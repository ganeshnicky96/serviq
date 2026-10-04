import { Controller, Get, Param, Post, Body, UseGuards, } from '@nestjs/common';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { TrackingService } from './tracking.service.js';
import { UpdateJobStatusDto } from './dto/update-job-status.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Roles('PARTNER')
  @Post('location')
  async updateLocation(@Body() dto: UpdateLocationDto, @CurrentUser() user: any,) {
  const partner = await this.trackingService.getPartnerByUserId(
    user.sub,
  );

  return this.trackingService.updatePartnerLocation({
    ...dto,
    partnerId: partner.id,
  });
}

  @Roles('CUSTOMER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN')

  @Get('jobs/:jobId/location')
  async getJobCurrentLocation(@Param('jobId') jobId: string) {
  return this.trackingService.getJobCurrentLocation(jobId);
}

  @Get('jobs/:jobId/distance')
  async getJobDistance(@Param('jobId') jobId: string) {
  return this.trackingService.getJobDistance(jobId);
}

@Roles('PARTNER')
@Post('jobs/:jobId/status')
async updateJobStatus(
  @Param('jobId') jobId: string,
  @Body() body: UpdateJobStatusDto,
  @CurrentUser() user: any,
) {
  const partner = await this.trackingService.getPartnerByUserId(
    user.sub,
  );

  return this.trackingService.updateJobStatus(
    jobId,
    partner.id,
    body.status,
  );
}
}