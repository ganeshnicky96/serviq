
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PartnerService } from './partner.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARTNER')
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.partnerService.getProfile(user.sub);
  }

  @Get('availability')
  async getAvailability(@CurrentUser() user: any) {
    return this.partnerService.getAvailability(user.sub);
  }

  @Post('availability')
  async updateAvailability(
    @Body() body: { isOnline: boolean },
    @CurrentUser() user: any,
  ) {
    return this.partnerService.updateAvailability(
      user.sub,
      body.isOnline,
    );
  }
}
