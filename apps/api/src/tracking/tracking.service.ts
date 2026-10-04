import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { db } from '../prisma/db.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { calculateDistanceKm } from './distance.util.js';

@Injectable()
export class TrackingService {
    private readonly averageTravelSpeedKmh = 25;
    async updatePartnerLocation(dto: UpdateLocationDto) {
    const partner = await db.orm.public.PartnerProfile
      .where({ id: dto.partnerId })
      .first();

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    if (partner.status !== 'ACTIVE') {
      throw new BadRequestException('Partner is not active');
    }

    if (!partner.isVerified) {
      throw new BadRequestException('Partner is not verified');
    }

    if (dto.latitude < -90 || dto.latitude > 90) {
      throw new BadRequestException('Invalid latitude');
    }

    if (dto.longitude < -180 || dto.longitude > 180) {
      throw new BadRequestException('Invalid longitude');
    }

    if (dto.jobId) {
      const job = await db.orm.public.Job
        .where({ id: dto.jobId })
        .first();

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (job.partnerId !== dto.partnerId) {
        throw new BadRequestException(
          'Job is not assigned to this partner',
        );
      }
    }

    const now = Temporal.Now.instant();

    const result = await db.transaction(async (tx) => {
      const location = await tx.orm.public.PartnerLocation.create({
        partnerId: dto.partnerId,
        jobId: dto.jobId ?? null,
        latitude: String(dto.latitude),
        longitude: String(dto.longitude),
        accuracy:
          dto.accuracy !== undefined
            ? String(dto.accuracy)
            : null,
        heading:
          dto.heading !== undefined
            ? String(dto.heading)
            : null,
        speed:
          dto.speed !== undefined
            ? String(dto.speed)
            : null,
        recordedAt: now,
        createdAt: now,
      });

      const availability = await tx.orm.public.PartnerAvailability
        .where({ partnerId: dto.partnerId })
        .update({
          latitude: String(dto.latitude),
          longitude: String(dto.longitude),
          lastSeenAt: now,
        });

      return {
        location,
        availability,
      };
    });

    return {
      partnerId: dto.partnerId,
      jobId: dto.jobId ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy ?? null,
      heading: dto.heading ?? null,
      speed: dto.speed ?? null,
      recordedAt: result.location.recordedAt,
    };
  }

  async getJobCurrentLocation(jobId: string) {
  const job = await db.orm.public.Job
    .where({ id: jobId })
    .first();

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  if (!job.partnerId) {
    throw new BadRequestException(
      'No partner is assigned to this job',
    );
  }

  const availability = await db.orm.public.PartnerAvailability
    .where({ partnerId: job.partnerId })
    .first();

  if (!availability) {
    throw new NotFoundException(
      'Partner availability not found',
    );
  }

  return {
    jobId,
    partnerId: job.partnerId,
    jobStatus: job.status,
    isOnline: availability.isOnline,
    isBusy: availability.isBusy,
    latitude: availability.latitude,
    longitude: availability.longitude,
    lastSeenAt: availability.lastSeenAt,
  };
}

async getJobDistance(jobId: string) {
  const job = await db.orm.public.Job
    .where({ id: jobId })
    .first();

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  if (!job.partnerId) {
    throw new BadRequestException(
      'No partner is assigned to this job',
    );
  }

  const booking = await db.orm.public.Booking
    .where({ id: job.bookingId })
    .first();

  if (!booking) {
    throw new NotFoundException('Booking not found');
  }

  const address = await db.orm.public.Address
    .where({ id: booking.addressId })
    .first();

  if (!address) {
    throw new NotFoundException('Customer address not found');
  }

  const availability = await db.orm.public.PartnerAvailability
    .where({ partnerId: job.partnerId })
    .first();

  if (!availability) {
    throw new NotFoundException(
      'Partner availability not found',
    );
  }

  if (
    availability.latitude === null ||
    availability.longitude === null
  ) {
    throw new BadRequestException(
      'Partner location is not available',
    );
  }

  if (
    address.latitude === null ||
    address.longitude === null
  ) {
    throw new BadRequestException(
      'Customer address location is not available',
    );
  }

  const distanceKm = calculateDistanceKm(
    Number(availability.latitude),
    Number(availability.longitude),
    Number(address.latitude),
    Number(address.longitude),
  );

  const estimatedTimeMinutes =
  (distanceKm / this.averageTravelSpeedKmh) * 60;

  return {
    jobId,
    partnerId: job.partnerId,
    trackingState: job.status,
    distanceKm: Number(distanceKm.toFixed(2)),
    estimatedTimeMinutes: Number(
    estimatedTimeMinutes.toFixed(0),
  ),
    partnerLocation: {
      latitude: availability.latitude,
      longitude: availability.longitude,
    },
    customerLocation: {
      latitude: address.latitude,
      longitude: address.longitude,
    },
  };
}

async updateJobStatus(
  jobId: string,
  partnerId: string,
  status: string,
) {
  const job = await db.orm.public.Job
    .where({ id: jobId })
    .first();

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  if (job.partnerId !== partnerId) {
    throw new BadRequestException(
      'Job is not assigned to this partner',
    );
  }

  const allowedTransitions: Record<string, string[]> = {
    ACCEPTED: ['EN_ROUTE'],
    EN_ROUTE: ['ARRIVED'],
    ARRIVED: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED'],
  };

  const allowedNextStatuses = allowedTransitions[job.status] ?? [];

  if (!allowedNextStatuses.includes(status)) {
    throw new BadRequestException(
      `Invalid job status transition: ${job.status} → ${status}`,
    );
  }

  const now = Temporal.Now.instant();

  const update: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (status === 'EN_ROUTE') {
    update.assignedAt = job.assignedAt ?? now;
  }

  if (status === 'IN_PROGRESS') {
    update.startedAt = now;
  }

  if (status === 'COMPLETED') {
    update.completedAt = now;
  }

  const updatedJob = await db.orm.public.Job
  .where({ id: jobId })
  .update(update);

  if (!updatedJob) {
    throw new NotFoundException('Job update failed');
  }

  return {
    jobId,
    partnerId,
    previousStatus: job.status,
    status: updatedJob.status,
    updatedAt: updatedJob.updatedAt,
  };
}

async getPartnerByUserId(userId: string) {
  const partner = await db.orm.public.PartnerProfile
    .where({ userId })
    .first();

  if (!partner) {
    throw new NotFoundException(
      'Partner profile not found for this user',
    );
  }

  return partner;
}
}