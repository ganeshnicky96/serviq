
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { DispatchService } from '../dispatch/dispatch.service.js';

@Injectable()
export class PartnerService {
  constructor(
    private readonly dispatchService: DispatchService,
  ) {}

  async getProfile(userId: string) {
    const partner = await db.orm.public.PartnerProfile.first({
      userId,
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    const user = await db.orm.public.User.first({
      id: userId,
    });

    const availability =
      await db.orm.public.PartnerAvailability.first({
        partnerId: partner.id,
      });

    return {
      partner,
      user,
      availability,
    };
  }

  async getAvailability(userId: string) {
    const partner = await db.orm.public.PartnerProfile.first({
      userId,
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    const availability =
      await db.orm.public.PartnerAvailability.first({
        partnerId: partner.id,
      });

    return {
      partnerId: partner.id,
      isOnline: availability?.isOnline ?? false,
      isBusy: availability?.isBusy ?? false,
      latitude: availability?.latitude ?? null,
      longitude: availability?.longitude ?? null,
      lastSeenAt: availability?.lastSeenAt ?? null,
    };
  }

  async updateAvailability(
    userId: string,
    isOnline: boolean,
  ) {
    const partner = await db.orm.public.PartnerProfile.first({
      userId,
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    const currentAvailability =
      await db.orm.public.PartnerAvailability.first({
        partnerId: partner.id,
      });

    const isBusy = currentAvailability?.isBusy ?? false;

    const availability =
      await this.dispatchService.setPartnerAvailability(
        partner.id,
        isOnline,
        isBusy,
      );

    return availability;
  }
}
