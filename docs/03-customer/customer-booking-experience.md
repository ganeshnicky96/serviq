# SERVIQ Module 10 — Customer Booking Experience & Service Completion

## 1. Module Overview

Module 10 implements the customer-facing orchestration layer for the complete SERVIQ service journey.

The module connects the existing backend capabilities from:

- Identity & Organization
- Service Catalog & Pricing
- Booking & Job Management
- Dispatch & Partner Assignment
- Partner Location & Live Tracking
- Authentication & Authorization
- Notifications
- Payments
- Invoices & Receipts

The goal is to provide a secure customer-facing API without duplicating the business logic already implemented in the underlying modules.

---

## 2. Customer Journey

The complete customer journey is:

Service Selection
→ Address Selection
→ Booking
→ Payment
→ Payment Confirmation
→ Partner Assignment
→ Partner Acceptance
→ Live Tracking
→ Partner Arrival
→ Work Started
→ Work Completed
→ Invoice Generation
→ Invoice Access
→ Invoice PDF Download

---

## 3. Customer Module Structure

Location:

`apps/api/src/customer/`

Main files:

- `customer.module.ts`
- `customer.controller.ts`
- `customer.service.ts`
- `dto/create-customer-booking.dto.ts`

The CustomerModule imports:

- AuthModule
- BookingsModule
- PaymentsModule
- TrackingModule
- InvoicesModule

The underlying services are exported from their respective modules so the CustomerService can orchestrate existing business logic.

---

## 4. Customer Authentication

All CustomerController routes are protected with:

- JwtAuthGuard
- RolesGuard
- CUSTOMER role

Controller protection:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')

Lifecycle
UNASSIGNED
    ↓
OFFERED
    ↓
ACCEPTED
    ↓
EN_ROUTE
    ↓
ARRIVED
    ↓
IN_PROGRESS
    ↓
COMPLETED

verfication status

| Capability | Status |
|---|---|
| Customer authentication | PASS |
| Customer profile | PASS |
| Service catalog | PASS |
| Customer addresses | PASS |
| Booking creation | PASS |
| Payment creation | PASS |
| Payment confirmation | PASS |
| Booking history | PASS |
| Booking details | PASS |
| Partner discovery | PASS |
| Partner assignment | PASS |
| Partner acceptance | PASS |
| Live location | PASS |
| Distance calculation | PASS |
| ETA calculation | PASS |
| Partner arrival | PASS |
| Job start | PASS |
| Job completion | PASS |
| Invoice generation | PASS |
| Customer invoice access | PASS |
| Invoice PDF download | PASS |