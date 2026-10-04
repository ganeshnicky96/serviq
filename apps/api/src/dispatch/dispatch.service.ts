import { Injectable, NotFoundException,} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '../prisma/db.js';
import { Temporal } from '@js-temporal/polyfill';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class DispatchService {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}
  async findEligiblePartners(jobId: string) {
    const job = await db.orm.public.Job.first({
      id: jobId,
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'UNASSIGNED') {
      throw new NotFoundException(
        'Job is not available for dispatch',
      );
    }

    const booking = await db.orm.public.Booking.first({
      id: job.bookingId,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const service = await db.orm.public.Service.first({
      id: booking.serviceId,
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const partnerSkills =
      await db.orm.public.PartnerSkill.where({
        serviceId: service.id,
      }).all();

    const eligiblePartners = [];

    for (const skill of partnerSkills) {
      const partner =
        await db.orm.public.PartnerProfile.first({
          id: skill.partnerId,
        });

      if (!partner) {
        continue;
      }

      if (partner.status !== 'ACTIVE') {
        continue;
      }

      if (!partner.isVerified) {
        continue;
      }

      const availability =
        await db.orm.public.PartnerAvailability.first({
          partnerId: partner.id,
        });

      if (!availability) {
        continue;
      }

      if (!availability.isOnline) {
        continue;
      }

      if (availability.isBusy) {
        continue;
      }

      eligiblePartners.push({
        partner,
        availability,
        skill,
      });
    }

    return {
      jobId: job.id,
      serviceId: service.id,
      partners: eligiblePartners,
    };
  }
  async offerJob(jobId: string, partnerId: string) {
  const job = await db.orm.public.Job.first({
    id: jobId,
  });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  if (job.status !== 'UNASSIGNED') {
    throw new NotFoundException(
      'Job is not available for dispatch',
    );
  }

  const partner = await db.orm.public.PartnerProfile.first({
    id: partnerId,
  });

  if (!partner) {
    throw new NotFoundException('Partner not found');
  }

  if (partner.status !== 'ACTIVE') {
    throw new NotFoundException(
      'Partner is not active',
    );
  }

  if (!partner.isVerified) {
    throw new NotFoundException(
      'Partner is not verified',
    );
  }

  const availability =
    await db.orm.public.PartnerAvailability.first({
      partnerId: partner.id,
    });

  if (!availability) {
    throw new NotFoundException(
      'Partner availability not found',
    );
  }

  if (!availability.isOnline) {
    throw new NotFoundException(
      'Partner is offline',
    );
  }

  if (availability.isBusy) {
    throw new NotFoundException(
      'Partner is busy',
    );
  }

  const booking = await db.orm.public.Booking.first({
    id: job.bookingId,
  });

  if (!booking) {
    throw new NotFoundException('Booking not found');
  }

  const skill = await db.orm.public.PartnerSkill.first({
    partnerId: partner.id,
    serviceId: booking.serviceId,
  });

  if (!skill) {
    throw new NotFoundException(
      'Partner is not qualified for this service',
    );
  }

  const existingOffer =
  await db.orm.public.JobOffer.first({
    jobId: job.id,
    partnerId: partner.id,
  });

  if (
    existingOffer &&
    (existingOffer.status === 'OFFERED' ||
      existingOffer.status === 'ACCEPTED')
  ) {
    throw new NotFoundException(
      'Job has already been offered to this partner',
    );
  }

  const now = Temporal.Now.instant();
  const expiresAt = now.add({ seconds: 60 });

  const result = await db.transaction(async (tx) => {
    let offer;

    if (existingOffer) {
      offer = await tx.orm.public.JobOffer
        .where({ id: existingOffer.id })
        .update({
          status: 'OFFERED',
          offeredAt: now,
          respondedAt: null,
          expiresAt,
        });
    } else {
      offer = await tx.orm.public.JobOffer.create({
        jobId: job.id,
        partnerId: partner.id,
        status: 'OFFERED',
        offeredAt: now,
        respondedAt: null,
        expiresAt,
      });
    }

    const updatedJob = await tx.orm.public.Job
      .where({ id: job.id })
      .update({
        status: 'OFFERED',
      });

    return {
      offer,
      job: updatedJob,
    };
  });

  return result;
}

async expireOffer(jobId: string, partnerId: string) {
  const offer = await db.orm.public.JobOffer.first({
    jobId,
    partnerId,
  });

  if (!offer) {
    throw new NotFoundException('Job offer not found');
  }

  if (offer.status !== 'OFFERED') {
    throw new NotFoundException(
      'Job offer is not currently active',
    );
  }

  const now = Temporal.Now.instant();

  if (!offer.expiresAt || offer.expiresAt > now) {
    throw new NotFoundException(
      'Job offer has not expired yet',
    );
  }

  const result = await db.transaction(async (tx) => {
    const expiredOffer = await tx.orm.public.JobOffer
      .where({ id: offer.id })
      .update({
        status: 'EXPIRED',
        respondedAt: now,
      });

    const updatedJob = await tx.orm.public.Job
      .where({ id: jobId })
      .update({
        status: 'UNASSIGNED',
      });

    return {
      offer: expiredOffer,
      job: updatedJob,
    };
  });

  return result;
}

async acceptOffer(jobId: string, partnerId: string) {
  const job = await db.orm.public.Job.first({ id: jobId });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  if (job.status !== 'OFFERED') {
    throw new NotFoundException('Job is not currently offered');
  }

  const offer = await db.orm.public.JobOffer
    .where({
      jobId,
      partnerId,
    })
    .first();

  if (!offer) {
    throw new NotFoundException('Job offer not found');
  }

  if (offer.status !== 'OFFERED') {
    throw new NotFoundException('Job offer is no longer available');
  }

  const booking = await db.orm.public.Booking.first({
  id: job.bookingId,
});

if (!booking) {
  throw new NotFoundException('Booking not found');
}

const customer = await db.orm.public.CustomerProfile.first({
  id: booking.customerId,
});

if (!customer) {
  throw new NotFoundException(
    'Customer profile not found',
  );
}

  const partner = await db.orm.public.PartnerProfile.first({
    id: partnerId,
  });

  if (!partner) {
    throw new NotFoundException('Partner not found');
  }

  if (partner.status !== 'ACTIVE' || !partner.isVerified) {
    throw new NotFoundException('Partner is not eligible');
  }

  const availability =
    await db.orm.public.PartnerAvailability.first({
      partnerId,
    });

  if (!availability) {
    throw new NotFoundException(
      'Partner availability not found',
    );
  }

  if (!availability.isOnline || availability.isBusy) {
    throw new NotFoundException(
      'Partner is not available',
    );
  }

  const now = Temporal.Now.instant();

  const result = await db.transaction(async (tx) => {
    const acceptedOffer = await tx.orm.public.JobOffer
      .where({ id: offer.id })
      .update({
        status: 'ACCEPTED',
        respondedAt: now,
      });

      
    const updatedJob = await tx.orm.public.Job
      .where({ id: job.id })
      .update({
        partnerId,
        status: 'ACCEPTED',
        assignedAt: now,
        acceptedAt: now,
      });

    const updatedAvailability =
      await tx.orm.public.PartnerAvailability
        .where({ partnerId })
        .update({
          isBusy: true,
        });

    return {
      offer: acceptedOffer,
      job: updatedJob,
      availability: updatedAvailability,
    };
  });
  await this.notificationsService.createNotification({
      userId: customer.userId,
      eventType: 'JOB_ACCEPTED',
      title: 'Partner accepted your job',
      message: 'Your SERVIQ partner has accepted the job.',
      bookingId: booking.id,
      jobId: job.id,
    });


  return result;
}

async rejectOffer(jobId: string, partnerId: string) {
  const job = await db.orm.public.Job.first({
    id: jobId,
  });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  if (job.status !== 'OFFERED') {
    throw new NotFoundException(
      'Job is not currently offered',
    );
  }

  const offer = await db.orm.public.JobOffer
    .where({
      jobId,
      partnerId,
    })
    .first();

  if (!offer) {
    throw new NotFoundException('Job offer not found');
  }

  if (offer.status !== 'OFFERED') {
    throw new NotFoundException(
      'Job offer is no longer available',
    );
  }

  const now = Temporal.Now.instant();

  const result = await db.transaction(async (tx) => {
    const rejectedOffer = await tx.orm.public.JobOffer
      .where({ id: offer.id })
      .update({
        status: 'REJECTED',
        respondedAt: now,
      });

    const updatedJob = await tx.orm.public.Job
      .where({ id: jobId })
      .update({
        status: 'UNASSIGNED',
      });

    return {
      offer: rejectedOffer,
      job: updatedJob,
    };
  });

  return result;
}

async getJobDispatchState(jobId: string) {
  const job = await db.orm.public.Job.first({
    id: jobId,
  });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  const offers = await db.orm.public.JobOffer
    .where({
      jobId,
    })
    .all();

  let availability = null;

  if (job.partnerId) {
    availability =
      await db.orm.public.PartnerAvailability.first({
        partnerId: job.partnerId,
      });
  }

  return {
    job,
    offers,
    availability,
  };
}

async setPartnerAvailability(
  partnerId: string,
  isOnline: boolean,
  isBusy: boolean,
) {
  const partner =
    await db.orm.public.PartnerProfile.first({
      id: partnerId,
    });

  if (!partner) {
    throw new NotFoundException('Partner not found');
  }

  const availability =
    await db.orm.public.PartnerAvailability.first({
      partnerId,
    });

  if (!availability) {
    throw new NotFoundException(
      'Partner availability not found',
    );
  }

  return db.orm.public.PartnerAvailability
    .where({ partnerId })
    .update({
      isOnline,
      isBusy,
      lastSeenAt: Temporal.Now.instant(),
    });
}

@Cron(CronExpression.EVERY_MINUTE)
async expirePendingOffers() {
  const now = Temporal.Now.instant();

  const expiredOffers =
    await db.orm.public.JobOffer
      .where({
        status: 'OFFERED',
      })
      .all();

  const expired = [];

  for (const offer of expiredOffers) {
        if (
      !offer.expiresAt ||
      Temporal.Instant.compare(offer.expiresAt, now) > 0
    ) {
      continue;
    }

    const result = await db.transaction(async (tx) => {
      const expiredOffer =
        await tx.orm.public.JobOffer
          .where({ id: offer.id })
          .update({
            status: 'EXPIRED',
            respondedAt: now,
          });

      const job =
        await tx.orm.public.Job.first({
          id: offer.jobId,
        });

      let updatedJob = job;

      if (job && job.status === 'OFFERED') {
        updatedJob =
          await tx.orm.public.Job
            .where({ id: job.id })
            .update({
              status: 'UNASSIGNED',
              partnerId: null,
            });
      }

      return {
        offer: expiredOffer,
        job: updatedJob,
      };
    });

    expired.push(result);
  }

  return {
    processedAt: now,
    count: expired.length,
    expired,
  };
}

}