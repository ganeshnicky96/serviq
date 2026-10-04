import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async getMyNotifications(
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.getUserNotifications(
      user.sub,
    );
  }

  @Get('unread-count')
    async getUnreadCount(
    @CurrentUser() user: any,
    ) {
    return this.notificationsService.getUnreadCount(
        user.sub,
    );
    }

    @Patch('read-all')
    async markAllAsRead(
    @CurrentUser() user: any,
    ) {
    return this.notificationsService.markAllAsRead(
        user.sub,
    );
    }

  @Patch(':id/read')
async markAsRead(
  @Param('id') notificationId: string,
  @CurrentUser() user: any,
) {
  return this.notificationsService.markAsRead(
    notificationId,
    user.sub,
  );
}

  @Post('test')
  async createTestNotification(
    @Body()
    body: {
      title: string;
      message: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.createNotification({
      userId: user.sub,
      eventType: 'BOOKING_CREATED',
      title: body.title,
      message: body.message,
    });
  }
}