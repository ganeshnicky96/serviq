import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { db } from '../prisma/db.js';

@Injectable()
export class InvoicesService {
  async healthCheck() {
    return {
      module: 'invoices',
      status: 'ok',
    };
  }

  async getInvoice(
  invoiceId: string,
  userId: string,
) {
  const invoice =
    await db.orm.public.Invoice.first({
      id: invoiceId,
    });

  if (!invoice) {
    throw new NotFoundException(
      'Invoice not found',
    );
  }

  const customer =
    await db.orm.public.CustomerProfile.first({
      userId,
    });

  if (!customer) {
    throw new NotFoundException(
      'Customer profile not found',
    );
  }

  const user =
    await db.orm.public.User.first({
    id: customer.userId,
  });

  if (!user) {
  throw new NotFoundException(
    'Customer user not found',
  );
}

  if (invoice.customerId !== customer.id) {
    throw new BadRequestException(
      'You are not authorized to access this invoice',
    );
  }

  const booking =
    await db.orm.public.Booking.first({
      id: invoice.bookingId,
    });

  if (!booking) {
    throw new NotFoundException(
      'Booking not found',
    );
  }

  const service =
    await db.orm.public.Service.first({
      id: booking.serviceId,
    });

  if (!service) {
    throw new NotFoundException(
      'Service not found',
    );
  }

  const address =
    await db.orm.public.Address.first({
      id: booking.addressId,
    });

  return {
    ...invoice,
    booking,
    service,
    address,
    customer,
    user,
  };
}
  async generateInvoice(bookingId: string, userId: string,) {
    const booking =
      await db.orm.public.Booking.first({
        id: bookingId,
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    const customer =
  await db.orm.public.CustomerProfile.first({
    userId,
  });

if (!customer) {
  throw new NotFoundException(
    'Customer profile not found',
  );
}

if (!booking.customerId || booking.customerId !== customer.id) {
  throw new BadRequestException(
    'You are not authorized to generate this invoice',
  );
}

    if (
        booking.estimatedSubtotal === null ||
        booking.estimatedTotal === null
        ) {
        throw new BadRequestException(
            'Booking does not have complete payable amounts',
        );
        }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Invoice can only be generated for a confirmed booking',
      );
    }

    const existingInvoice =
      await db.orm.public.Invoice.first({
        bookingId: booking.id,
      });

    if (existingInvoice) {
      return existingInvoice;
    }

    const payment =
      await db.orm.public.Payment.first({
        bookingId: booking.id,
        status: 'SUCCESS',
      });

    if (!payment) {
      throw new BadRequestException(
        'Successful payment not found for booking',
      );
    }

    const now = Temporal.Now.instant();

    const invoiceNumber =
      `SVQ-INV-${Date.now()}`;

    return db.orm.public.Invoice.create({
      bookingId: booking.id,
      customerId: payment.customerId,
      invoiceNumber,
      status: 'PAID',
      subtotal: booking.estimatedSubtotal,
      tax: booking.estimatedTax ?? null,
      total: booking.estimatedTotal,
      currency: booking.currency,
      paymentMethod: payment.method,
      paymentReference:
        payment.gatewayPaymentId ??
        payment.gatewayOrderId ??
        null,
      issuedAt: now,
      paidAt: payment.paidAt ?? now,
      cancelledAt: null,
      refundedAt: null,
    });
  }
}