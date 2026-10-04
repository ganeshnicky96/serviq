import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { CreatePaymentMethod } from '../payments/dto/create-payment.dto.js';
import { TrackingService } from '../tracking/tracking.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';

@Injectable()
export class CustomerService {

    constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService,
    private readonly trackingService: TrackingService,
    private readonly invoicesService: InvoicesService,
) {}
  async getCustomerProfile(userId: string) {
    const customer = await db.orm.public.CustomerProfile.first({ userId });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    const user = await db.orm.public.User.first({ id: userId });

    if (!user) {
      throw new NotFoundException('Customer user not found');
    }

    return {
      user,
      customer,
    };
  }

  async getServices() {
    const categories = await db.orm.public.ServiceCategory
      .where({ isActive: true })
      .all();

    const services = await db.orm.public.Service
      .where({ isActive: true })
      .all();

    return {
      categories,
      services,
    };
  }

  async getCustomerBookingInvoice(
  userId: string,
  bookingId: string,
) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const booking = await db.orm.public.Booking.first({
    id: bookingId,
  });

  if (!booking || booking.customerId !== customer.id) {
    throw new NotFoundException('Customer booking not found');
  }

  const invoice = await db.orm.public.Invoice.first({
    bookingId: booking.id,
  });

  if (!invoice) {
    throw new NotFoundException(
      'Invoice has not been generated yet',
    );
  }

  return this.invoicesService.getInvoice(
    invoice.id,
    userId,
  );
}

  async getCustomerAddresses(userId: string) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const addresses = await db.orm.public.Address
    .where({ customerId: customer.id })
    .all();

  return {
    addresses,
  };
}

async createCustomerBooking(
  userId: string,
  serviceId: string,
  addressId: string,
  quantity: number = 1,
) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const address = await db.orm.public.Address.first({
    id: addressId,
  });

  if (!address || address.customerId !== customer.id) {
    throw new NotFoundException('Customer address not found');
  }

  const service = await db.orm.public.Service.first({
    id: serviceId,
  });

  if (!service || !service.isActive) {
    throw new NotFoundException('Service not found or inactive');
  }

  return this.bookingsService.createBooking({
  customerId: customer.id,
  serviceId: service.id,
  addressId: address.id,
  ...(service.pricingType === 'PER_UNIT' ? { quantity } : {}),
});
}

async createCustomerPayment(
  userId: string,
  bookingId: string,
  method: CreatePaymentMethod,
) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  return this.paymentsService.createPayment({
    bookingId,
    customerId: customer.id,
    method,
  });
}

async confirmCustomerPayment(
  userId: string,
  paymentId: string,
  gatewayPaymentId: string,
  gatewaySignature: string,
  gatewayReference?: string,
) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const payment = await db.orm.public.Payment.first({ id: paymentId });

  if (!payment || payment.customerId !== customer.id) {
    throw new NotFoundException('Customer payment not found');
  }

  return this.paymentsService.confirmPayment(paymentId, {
    gatewayPaymentId,
    gatewaySignature,
    gatewayReference,
  });
}

async getCustomerBooking(userId: string, bookingId: string) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const booking = await db.orm.public.Booking.first({ id: bookingId });

  if (!booking || booking.customerId !== customer.id) {
    throw new NotFoundException('Customer booking not found');
  }

  const service = await db.orm.public.Service.first({
    id: booking.serviceId,
    });

    const address = await db.orm.public.Address.first({
    id: booking.addressId,
    });

    const job = await db.orm.public.Job.first({
    bookingId: booking.id,
    });

    let partner = null;

if (job?.partnerId) {
  partner = await db.orm.public.PartnerProfile.first({
    id: job.partnerId,
  });
}
    const payment = await db.orm.public.Payment.first({
     bookingId: booking.id,
    });
  return {
    booking,
    service,
    address,
    job,
    partner,
    payment,
  };
}

async getCustomerBookings(userId: string) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const bookings = await db.orm.public.Booking
    .where({ customerId: customer.id })
    .all();

  return {
    bookings,
  };
}

async getCustomerBookingLocation(
  userId: string,
  bookingId: string,
) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const booking = await db.orm.public.Booking.first({ id: bookingId });

  if (!booking || booking.customerId !== customer.id) {
    throw new NotFoundException('Customer booking not found');
  }

  const job = await db.orm.public.Job.first({
    bookingId: booking.id,
  });

  if (!job) {
    throw new NotFoundException('Booking job not found');
  }

  if (!job.partnerId) {
    return {
      available: false,
      message: 'Partner has not been assigned yet',
      location: null,
    };
  }

  const location = await this.trackingService.getJobCurrentLocation(
    job.id,
  );

  return {
    available: location !== null,
    location,
  };
}
async getCustomerBookingDistance(
  userId: string,
  bookingId: string,
) {
  const customer = await db.orm.public.CustomerProfile.first({ userId });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const booking = await db.orm.public.Booking.first({ id: bookingId });

  if (!booking || booking.customerId !== customer.id) {
    throw new NotFoundException('Customer booking not found');
  }

  const job = await db.orm.public.Job.first({
    bookingId: booking.id,
  });

  if (!job) {
    throw new NotFoundException('Booking job not found');
  }

  if (!job.partnerId) {
    return {
      available: false,
      message: 'Partner has not been assigned yet',
      distanceKm: null,
      etaMinutes: null,
    };
  }

  const distance = await this.trackingService.getJobDistance(job.id);

  return {
    available: true,
    distanceKm: distance.distanceKm,
    etaMinutes: distance.estimatedTimeMinutes,
  };
}

async updateCustomerAddressLocation(
  userId: string,
  addressId: string,
  latitude: number,
  longitude: number,
) {
  const customer = await db.orm.public.CustomerProfile.first({
    userId,
  });

  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }

  const address = await db.orm.public.Address.first({
    id: addressId,
  });

  if (!address || address.customerId !== customer.id) {
    throw new NotFoundException('Customer address not found');
  }

  return db.orm.public.Address
    .where({ id: address.id })
    .update({
  latitude: String(latitude),
  longitude: String(longitude),
});
}
}