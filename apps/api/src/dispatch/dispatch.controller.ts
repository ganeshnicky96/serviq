
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DispatchService } from './dispatch.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { db } from '../prisma/db.js';

@Controller('dispatch')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatchController {
  constructor(
    private readonly dispatchService: DispatchService,
  ) {}

  private async getAuthenticatedPartnerId(userId: string) {
    const partner = await db.orm.public.PartnerProfile.first({
      userId,
    });

    if (!partner) {
      throw new NotFoundException(
        'Partner profile not found',
      );
    }

    if (
      partner.status !== 'ACTIVE' ||
      !partner.isVerified
    ) {
      throw new ForbiddenException(
        'Partner is not active and verified',
      );
    }

    return partner.id;
  }

  @Get('jobs/:jobId/eligible-partners')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findEligiblePartners(
    @Param('jobId') jobId: string,
  ) {
    return this.dispatchService.findEligiblePartners(jobId);
  }

  @Post('jobs/:jobId/offer')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async offerJob(
    @Param('jobId') jobId: string,
    @Body() body: { partnerId: string },
  ) {
    return this.dispatchService.offerJob(
      jobId,
      body.partnerId,
    );
  }

  @Post('jobs/:jobId/accept')
  @Roles('PARTNER')
  async acceptOffer(
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    const partnerId =
      await this.getAuthenticatedPartnerId(user.sub);

    return this.dispatchService.acceptOffer(
      jobId,
      partnerId,
    );
  }

  @Post('jobs/:jobId/reject')
  @Roles('PARTNER')
  async rejectOffer(
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    const partnerId =
      await this.getAuthenticatedPartnerId(user.sub);

    return this.dispatchService.rejectOffer(
      jobId,
      partnerId,
    );
  }

  @Post('jobs/:jobId/offers/:partnerId/expire')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async expireOffer(
    @Param('jobId') jobId: string,
    @Param('partnerId') partnerId: string,
  ) {
    return this.dispatchService.expireOffer(
      jobId,
      partnerId,
    );
  }

  @Get('jobs/:jobId/state')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getJobDispatchState(
    @Param('jobId') jobId: string,
  ) {
    return this.dispatchService.getJobDispatchState(jobId);
  }

  @Post('partners/:partnerId/availability')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async setPartnerAvailability(
    @Param('partnerId') partnerId: string,
    @Body()
    body: {
      isOnline: boolean;
      isBusy: boolean;
    },
  ) {
    return this.dispatchService.setPartnerAvailability(
      partnerId,
      body.isOnline,
      body.isBusy,
    );
  }

  @Post('offers/process-expired')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async processExpiredOffers() {
    return this.dispatchService.expirePendingOffers();
  }
}
