# Module 8 — Payments

## 1. Purpose

The Payments module manages the financial lifecycle of a SERVIQ booking.

The module is responsible for:

- Creating a payment for a booking
- Creating a gateway order
- Tracking payment status
- Tracking payment transactions
- Verifying gateway payments
- Confirming successful payments
- Marking failed payments
- Updating the booking after successful payment
- Creating a payment-success notification
- Maintaining a gateway abstraction so a real payment provider can be integrated later

---

## 2. Payment Lifecycle

The current payment lifecycle is:

PENDING
→ PROCESSING
→ SUCCESS

Possible failure/cancellation paths:

PENDING
→ FAILED

SUCCESS
→ REFUNDED

SUCCESS
→ PARTIALLY_REFUNDED

PENDING
→ CANCELLED

The current implementation primarily covers:

- PENDING
- SUCCESS
- FAILED

Refund functionality is planned for a later stage.

---

## 3. Payment Models

### Payment

The `Payment` model represents the payment associated with a booking.

Important fields:

- `id`
- `bookingId`
- `customerId`
- `amount`
- `currency`
- `status`
- `method`
- `gateway`
- `gatewayOrderId`
- `gatewayPaymentId`
- `gatewaySignature`
- `paidAt`
- `failureReason`
- `createdAt`
- `updatedAt`

A booking can have multiple payment records.

---

## 4. Payment Transaction

`PaymentTransaction` provides an auditable transaction history.

Important fields:

- `id`
- `paymentId`
- `type`
- `status`
- `amount`
- `currency`
- `gateway`
- `gatewayReference`
- `failureReason`
- `processedAt`
- `createdAt`
- `updatedAt`

Transaction types currently include:

- `PAYMENT`
- `REFUND`

Transaction statuses:

- `PENDING`
- `SUCCESS`
- `FAILED`

This separation allows the payment record and its transaction history to be maintained independently.

---

## 5. Payment Methods

The system currently supports these payment methods:

- `ONLINE`
- `CASH`
- `UPI`
- `CARD`
- `NET_BANKING`
- `WALLET`

The current gateway test flow uses:

`ONLINE`

---

## 6. Payment Creation

Endpoint:

`POST /payments`

Required information:

- `bookingId`
- `customerId`
- `method`

Validation performed:

1. Booking must exist.
2. Booking must belong to the supplied customer.
3. Customer must exist.
4. Booking must have a payable amount.
5. Booking must not already have a successful payment.

The payment amount is taken from the booking's `estimatedTotal`.

A payment transaction is then created with:

`PENDING`

---

## 7. Gateway Abstraction

The payment system does not directly depend on a specific payment provider.

Gateway operations are abstracted through:

`PaymentGateway`

Current operations:

### Create Order

Creates a gateway order for the payment.

### Verify Payment

Verifies:

- gateway order ID
- gateway payment ID
- gateway signature

This abstraction allows the mock gateway to be replaced by a real payment gateway later.

---

## 8. Mock Payment Gateway

The current implementation uses:

`MockPaymentGateway`

Gateway name:

`MOCK`

A gateway order is generated using the payment ID.

Example:

`mock_order_<paymentId>`

The mock verification succeeds when:

- gateway order ID starts with `mock_order_`
- gateway payment ID is present
- gateway signature is present

This gateway is intended only for development and testing.

---

## 9. Payment Confirmation

Endpoint:

`POST /payments/:id/confirm`

Confirmation flow:

1. Find payment.
2. Reject if payment does not exist.
3. Reject if payment is already successful.
4. Reject if payment has failed.
5. Ensure a gateway order exists.
6. Validate gateway payment ID and signature.
7. Verify payment through the gateway.
8. Start a database transaction.
9. Update payment status to `SUCCESS`.
10. Store gateway payment ID and signature.
11. Mark the payment transaction as `SUCCESS`.
12. Store the gateway reference.
13. Update the booking status to `CONFIRMED`.
14. Create a `PAYMENT_SUCCESSFUL` notification.
15. Return payment, transaction, booking and notification information.

---

## 10. Successful Payment Notification

After successful payment confirmation, SERVIQ creates an in-app notification.

Event:

`PAYMENT_SUCCESSFUL`

Title:

`Payment Successful`

Example message:

`Your payment of INR 299 was successful.`

The notification contains the related booking ID.

This allows the customer application to display confirmation immediately.

---

## 11. Payment Failure

Endpoint:

`POST /payments/:id/fail`

A payment can be marked as failed with a failure reason.

The payment record stores:

- `FAILED`
- `failureReason`

The corresponding payment transaction is also updated.

---

## 12. Payment Details

Endpoint:

`GET /payments/:id`

Returns:

- payment information
- associated transaction history

This provides a payment audit view.

---

## 13. Booking Integration

A successful payment changes the booking status:

`PENDING → CONFIRMED`

This connects the payment lifecycle with the booking lifecycle.

The booking should not be treated as financially confirmed until the payment confirmation process succeeds.

---

## 14. Current Test Result

A complete development test was successfully executed.

Test booking:

`SVQ-1790587846358`

Booking ID:

`6e48b7c5-f53e-415f-877f-a95b68177512`

Payment ID:

`082a2a37-4448-4f27-8203-694615def8a9`

Test payment amount:

`INR 299`

Gateway:

`MOCK`

Payment result:

`SUCCESS`

Transaction result:

`SUCCESS`

Booking result:

`CONFIRMED`

Payment notification:

`PAYMENT_SUCCESSFUL`

Notification ID:

`cb4b43a6-4c26-4503-afc1-db2bd29aa97a`

This confirms the complete development payment flow:

Booking
→ Payment
→ Gateway Order
→ Gateway Verification
→ Successful Payment
→ Successful Transaction
→ Booking Confirmation
→ Customer Notification

---

## 15. Production Gateway

The current `MOCK` gateway is for development only.

A production gateway such as Razorpay can later implement the same `PaymentGateway` interface.

The production implementation should handle:

- real order creation
- real payment verification
- signature verification
- webhook verification
- payment reconciliation
- refunds
- gateway failures
- duplicate callbacks
- idempotency

No real payment credentials should be stored directly in source code.

---

## 16. Future Payment Work

Remaining payment work includes:

1. Refund processing
2. Partial refunds
3. Real Razorpay integration
4. Webhook handling
5. Idempotency protection
6. Payment reconciliation
7. Payment receipt/invoice integration
8. Customer payment history
9. Admin payment management
10. Production security hardening

---

## 17. Security Considerations

Payment confirmation must never trust client-side payment status alone.

The backend must verify the payment with the payment gateway.

Gateway signatures must be validated server-side.

Payment credentials and secrets must be stored using environment variables or a secure secrets-management system.

Payment endpoints should also enforce authenticated access and ownership checks before production release.

---

## 18. Module Status

Core development payment flow:

`COMPLETED`

Mock gateway:

`COMPLETED`

Payment transaction tracking:

`COMPLETED`

Booking confirmation integration:

`COMPLETED`

Payment-success notification:

`COMPLETED`

Refunds:

`PENDING`

Real payment gateway:

`PENDING`

Webhooks:

`PENDING`

Production payment hardening:

`PENDING`