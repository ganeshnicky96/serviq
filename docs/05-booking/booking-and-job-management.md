# SERVIQ — Booking & Job Management

## 1. Module Overview

The Booking & Job Management module is responsible for converting a customer's service request into a trackable service job.

The module creates two related records:

- Booking — represents the customer's service request.
- Job — represents the operational work item that will eventually be assigned to a service partner.

The initial booking flow is:

Customer
→ Select Service
→ Select Address
→ Confirm Booking
→ Booking Created
→ Job Created
→ Job Status = UNASSIGNED
→ Future Dispatch Module assigns a Partner

---

## 2. Module Objectives

The module provides:

- Customer booking creation
- Service validation
- Customer address validation
- Transparent price snapshot
- Booking status management
- Job creation
- Initial job assignment state
- Scheduled service support
- Customer notes
- Booking-to-job relationship

The module is designed so that future dispatch functionality can operate on the Job without modifying the original customer booking.

---

## 3. Core Concepts

### Booking

A Booking represents what the customer requested.

Example:

> Customer requests "Switch Replacement" at their home address for ₹299.

The Booking stores:

- Customer
- Service
- Address
- Booking code
- Booking status
- Scheduled time
- Customer notes
- Pricing information

---

### Job

A Job represents the operational work required to fulfill a Booking.

A Job is automatically created when a Booking is successfully created.

Initially:

```text
Job Status = UNASSIGNED