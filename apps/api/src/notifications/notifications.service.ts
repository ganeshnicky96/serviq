import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { db } from '../prisma/db.js';

@Injectable()
export class NotificationsService {
  async createNotification(input: {
    userId: string;
    eventType:
      | 'OTP_REQUESTED'
      | 'BOOKING_CREATED'
      | 'PARTNER_ASSIGNED'
      | 'JOB_ACCEPTED'
      | 'PARTNER_EN_ROUTE'
      | 'PARTNER_ARRIVED'
      | 'JOB_STARTED'
      | 'JOB_COMPLETED'
      | 'BOOKING_CANCELLED'
      | 'PAYMENT_SUCCESSFUL'
      | 'INVOICE_GENERATED';
    title: string;
    message: string;
    bookingId?: string;
    jobId?: string;
  }) {
    return db.orm.public.Notification.create({
      userId: input.userId,
      eventType: input.eventType,
      title: input.title,
      message: input.message,
      bookingId: input.bookingId ?? null,
      jobId: input.jobId ?? null,
      isRead: false,
      readAt: null,
    });
  }

  async getUserNotifications(userId: string) {
    return db.orm.public.Notification
      .where({ userId })
      .orderBy((notification) =>
        notification.createdAt.desc(),
      )
      .all();
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ) {
    const notification =
      await db.orm.public.Notification
        .where({
          id: notificationId,
          userId,
        })
        .first();

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    if (notification.isRead) {
      return notification;
    }

    const now = Temporal.Now.instant();

    return db.orm.public.Notification
      .where({ id: notificationId })
      .update({
        isRead: true,
        readAt: now,
        updatedAt: now,
      });
  }

  async getUnreadCount(userId: string) {
    const notifications =
      await db.orm.public.Notification
        .where({
          userId,
          isRead: false,
        })
        .all();

    return {
      unreadCount: notifications.length,
    };
  }

  async markAllAsRead(userId: string) {
  const notifications =
    await db.orm.public.Notification
      .where({
        userId,
        isRead: false,
      })
      .all();

  const now = Temporal.Now.instant();

  for (const notification of notifications) {
    await db.orm.public.Notification
      .where({ id: notification.id })
      .update({
        isRead: true,
        readAt: now,
        updatedAt: now,
      });
  }

  return {
    message: 'All notifications marked as read',
    updatedCount: notifications.length,
  };
}
}