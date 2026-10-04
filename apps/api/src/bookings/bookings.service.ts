import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  async createBooking(dto: CreateBookingDto) {
    const customer = await db.orm.public.CustomerProfile.first({
      id: dto.customerId,
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const service = await db.orm.public.Service.first({
      id: dto.serviceId,
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is not active');
    }

    const address = await db.orm.public.Address.first({
      id: dto.addressId,
      customerId: dto.customerId,
    });

    if (!address) {
      throw new BadRequestException(
        'Address does not belong to this customer',
      );
    }

    if (service.pricingType === 'PER_UNIT' && dto.quantity === undefined) {
      throw new BadRequestException(
        'Quantity is required for per-unit services',
      );
    }

    if (
      service.pricingType !== 'PER_UNIT' &&
      dto.quantity !== undefined
    ) {
      throw new BadRequestException(
        'Quantity is only allowed for per-unit services',
      );
    }

    const quantity =
      service.pricingType === 'PER_UNIT'
        ? dto.quantity!
        : undefined;

    const estimatedSubtotal =
      quantity !== undefined
        ? String(Number(service.price) * quantity)
        : String(service.price);

    const bookingCode = `SVQ-${Date.now()}`;

    const result = await db.transaction(async (tx) => {
      const booking = await tx.orm.public.Booking.create({
        bookingCode,
        customerId: dto.customerId,
        serviceId: dto.serviceId,
        addressId: dto.addressId,
        status: 'PENDING',
        scheduledAt: dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : null,
        customerNotes: dto.customerNotes ?? null,
        pricingType: service.pricingType,
        unitPrice: service.price,
        quantity: quantity !== undefined ? String(quantity) : null,
        estimatedSubtotal,
        estimatedTax: null,
        estimatedTotal: estimatedSubtotal,
        currency: service.currency,
        taxIncluded: service.taxIncluded,
      });

      const job = await tx.orm.public.Job.create({
        bookingId: booking.id,
        partnerId: null,
        status: 'UNASSIGNED',
        assignedAt: null,
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        completionNotes: null,
        cancellationReason: null,
      });

      return {
        booking,
        job,
      };
    });

    return result;
  }
}
