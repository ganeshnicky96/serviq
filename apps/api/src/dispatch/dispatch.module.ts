import { Module } from '@nestjs/common';
import { DispatchController } from './dispatch.controller.js';
import { DispatchService } from './dispatch.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
  ],
  controllers: [DispatchController],
  providers: [
    DispatchService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class DispatchModule {}