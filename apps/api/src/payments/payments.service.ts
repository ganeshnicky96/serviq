import { BadRequestException, Injectable, NotFoundException,} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';
import { Temporal } from '@js-temporal/polyfill';
import { FailPaymentDto } from './dto/fail-payment.dto.js';
import { MockPaymentGateway } from './gateway/mock-payment.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class PaymentsService {
  private readonly paymentGateway = new MockPaymentGateway();

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}
  async healthCheck() {
    return {
      module: 'payments',
      status: 'ok',
    };
  }

  async createPayment(dto: CreatePaymentDto) {
    const booking = await db.orm.public.Booking.first({
      id: dto.bookingId,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== dto.customerId) {
      throw new BadRequestException(
        'Booking does not belong to this customer',
      );
    }

    const customer =
      await db.orm.public.CustomerProfile.first({
        id: dto.customerId,
      });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!booking.estimatedTotal) {
      throw new BadRequestException(
        'Booking does not have a payable amount',
      );
    }

    const existingPayment =
      await db.orm.public.Payment.first({
        bookingId: booking.id,
        status: 'SUCCESS',
      });

    if (existingPayment) {
      throw new BadRequestException(
        'Booking has already been paid',
      );
    }

    const amount = booking.estimatedTotal;

   const result = await db.transaction(async (tx) => {
  const payment =
    await tx.orm.public.Payment.create({
      bookingId: booking.id,
      customerId: customer.id,
      amount,
      currency: booking.currency,
      status: 'PENDING',
      method: dto.method,
      gateway: null,
      gatewayOrderId: null,
      gatewayPaymentId: null,
      gatewaySignature: null,
      paidAt: null,
      failureReason: null,
    });

  const gatewayOrder =
    await this.paymentGateway.createOrder({
      paymentId: payment.id,
      amount,
      currency: booking.currency,
    });

  const updatedPayment =
    await tx.orm.public.Payment
      .where({ id: payment.id })
      .update({
        gateway: gatewayOrder.gateway,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
      });

  const transaction =
    await tx.orm.public.PaymentTransaction.create({
      paymentId: payment.id,
      type: 'PAYMENT',
      status: 'PENDING',
      amount,
      currency: booking.currency,
      gateway: gatewayOrder.gateway,
      gatewayReference: gatewayOrder.gatewayOrderId,
      failureReason: null,
      processedAt: null,
    });

  return {
    payment: updatedPayment,
    transaction,
  };
});

    return result;
  }
    async getPayment(paymentId: string) {
    const payment = await db.orm.public.Payment.first({
    id: paymentId,
  });

  if (!payment) {
    throw new NotFoundException('Payment not found');
  }

  const transactions =
    await db.orm.public.PaymentTransaction
      .where({
        paymentId: payment.id,
      })
      .all();

  return {
    payment,
    transactions,
  };
}
  async confirmPayment(
  paymentId: string,
  dto: ConfirmPaymentDto,
) {
  const payment = await db.orm.public.Payment.first({
    id: paymentId,
  });

  if (!payment) {
    throw new NotFoundException('Payment not found');
  }

  if (payment.status === 'SUCCESS') {
    throw new BadRequestException(
      'Payment has already been confirmed',
    );
  }

  if (payment.status === 'FAILED') {
    throw new BadRequestException(
      'Failed payment cannot be confirmed',
    );
  }

  if (!payment.gatewayOrderId) {
    throw new BadRequestException(
      'Payment does not have a gateway order',
    );
  }

  if (!dto.gatewayPaymentId || !dto.gatewaySignature) {
    throw new BadRequestException(
      'Gateway payment ID and signature are required',
    );
  }

  const verified =
    await this.paymentGateway.verifyPayment({
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: dto.gatewayPaymentId,
      gatewaySignature: dto.gatewaySignature,
    });

  if (!verified) {
    throw new BadRequestException(
      'Payment gateway verification failed',
    );
  }

  const now = Temporal.Now.instant();

  const result = await db.transaction(async (tx) => {
    const updatedPayment =
      await tx.orm.public.Payment
        .where({ id: payment.id })
        .update({
          status: 'SUCCESS',
          paidAt: now,
          gatewayPaymentId:
            dto.gatewayPaymentId,
          gatewaySignature:
            dto.gatewaySignature,
        });

    const transaction =
      await tx.orm.public.PaymentTransaction
        .where({
          paymentId: payment.id,
          type: 'PAYMENT',
          status: 'PENDING',
        })
        .update({
          status: 'SUCCESS',
          gatewayReference:
            dto.gatewayReference ?? null,
          processedAt: now,
        });

    const booking =
      await tx.orm.public.Booking
        .where({ id: payment.bookingId })
        .update({
          status: 'CONFIRMED',
          updatedAt: now,
        });

    return {
      payment: updatedPayment,
      transaction,
      booking,
    };
  });

  // Send payment-success notification to the customer
if (!payment.customerId) {
  throw new BadRequestException(
    'Payment does not have a customer',
  );
}

const customer =
  await db.orm.public.CustomerProfile.first({
    id: payment.customerId,
  });

if (!customer) {
  throw new NotFoundException(
    'Customer profile not found for payment notification',
  );
}
console.log('PAYMENT_NOTIFICATION: creating notification');
const notification =
  await this.notificationsService.createNotification({
    userId: customer.userId,
    eventType: 'PAYMENT_SUCCESSFUL',
    title: 'Payment Successful',
    message: `Your payment of ${payment.currency} ${payment.amount} was successful.`,
    bookingId: payment.bookingId,
  });

  return {
  ...result,
  notification,
};
}

async failPayment(
  paymentId: string,
  dto: FailPaymentDto,
) {
  const payment = await db.orm.public.Payment.first({
    id: paymentId,
  });

  if (!payment) {
    throw new NotFoundException('Payment not found');
  }

  if (payment.status === 'SUCCESS') {
    throw new BadRequestException(
      'Successful payment cannot be marked as failed',
    );
  }

  if (payment.status === 'FAILED') {
    throw new BadRequestException(
      'Payment has already been marked as failed',
    );
  }

  const now = Temporal.Now.instant();

  const result = await db.transaction(async (tx) => {
    const updatedPayment =
      await tx.orm.public.Payment
        .where({ id: payment.id })
        .update({
          status: 'FAILED',
          failureReason: dto.failureReason,
        });

    const transaction =
      await tx.orm.public.PaymentTransaction
        .where({
          paymentId: payment.id,
          type: 'PAYMENT',
          status: 'PENDING',
        })
        .update({
          status: 'FAILED',
          failureReason: dto.failureReason,
          processedAt: now,
        });

    return {
      payment: updatedPayment,
      transaction,
    };
  });

  return result;
}
}