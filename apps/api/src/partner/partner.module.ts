
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DispatchModule } from '../dispatch/dispatch.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PartnerController } from './partner.controller.js';
import { PartnerService } from './partner.service.js';

@Module({
  imports: [AuthModule, DispatchModule],
  controllers: [PartnerController],
  providers: [
    PartnerService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class PartnerModule {}
