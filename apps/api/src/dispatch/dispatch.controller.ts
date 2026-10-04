import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DispatchService } from './dispatch.service.js';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('jobs/:jobId/eligible-partners')
  async findEligiblePartners(@Param('jobId') jobId: string) {
    return this.dispatchService.findEligiblePartners(jobId);
  }

  @Post('jobs/:jobId/offer')
  async offerJob(
    @Param('jobId') jobId: string,
    @Body() body: { partnerId: string },
  ) {
    return this.dispatchService.offerJob(jobId, body.partnerId);
  }

  @Post('jobs/:jobId/accept')
  async acceptOffer(
  @Param('jobId') jobId: string,
  @Body() body: { partnerId: string },
) {
  return this.dispatchService.acceptOffer(jobId, body.partnerId);
}

@Post('jobs/:jobId/reject')
async rejectOffer(
  @Param('jobId') jobId: string,
  @Body() body: { partnerId: string },
) {
  return this.dispatchService.rejectOffer(jobId, body.partnerId);
}

@Post('jobs/:jobId/offers/:partnerId/expire')
async expireOffer(
  @Param('jobId') jobId: string,
  @Param('partnerId') partnerId: string,
) {
  return this.dispatchService.expireOffer(jobId, partnerId);
}

@Get('jobs/:jobId/state')
async getJobDispatchState(@Param('jobId') jobId: string) {
  return this.dispatchService.getJobDispatchState(jobId);
}

@Post('partners/:partnerId/availability')
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
async processExpiredOffers() {
  return this.dispatchService.expirePendingOffers();
}

}