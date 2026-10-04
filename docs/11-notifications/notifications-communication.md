# Module 7 — Notifications & Communication

## 1. Purpose

The Notifications & Communication module provides a centralized system for informing SERVIQ users about important events in their bookings, jobs, payments, and invoices.

The architecture separates:

- Notification event
- Notification record
- Delivery channel
- Delivery status

The first implementation uses **in-app notifications**.

External channels such as:

- Push notifications
- SMS
- WhatsApp
- Email

are represented in the database and can be integrated later.

---

## 2. Notification Architecture

The intended flow is:

```text
Business Event
      ↓
Notification Service
      ↓
Notification
      ↓
Notification Delivery
      ↓
Communication Channel

✓ Notification database model
✓ Notification delivery model
✓ Notification event types
✓ Notification channels
✓ In-app notifications
✓ Notification listing
✓ Unread count
✓ Mark as read
✓ Mark all as read
✓ JWT-protected notification APIs
✓ Dispatch integration
✓ JOB_ACCEPTED customer notification
✓ Integration testing
✓ Notification read-state tracking