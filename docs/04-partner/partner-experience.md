# SERVIQ Module 11 — Partner Experience & Job Operations

## 1. Objective

Provide the electrician/partner API for profile access, availability management, dispatch offer handling, and job operations.

## 2. Partner Profile and Availability

Authenticated partners can use:

- `GET /partner/profile` — retrieve the partner profile, user details, and availability.
- `GET /partner/availability` — retrieve online status, busy status, and the latest known location.
- `POST /partner/availability` — update online status.

The partner API uses JWT authentication and the `PARTNER` role.

## 3. Dispatch Offers and Authorization

Dispatch operations are protected by JWT authentication and role-based authorization.

- `ADMIN`, `SUPER_ADMIN`: find eligible partners, offer jobs, view dispatch state, expire offers, manage partner availability, and process expired offers.
- `PARTNER`: accept or reject offers for their own authenticated partner profile.

Partner acceptance and rejection resolve the partner ID from the authenticated JWT subject instead of trusting a client-supplied partner ID. The partner must be active and verified for these actions.

## 4. Job Status Lifecycle

The tracking API permits these transitions:

1. `ACCEPTED` → `EN_ROUTE`
2. `EN_ROUTE` → `ARRIVED`
3. `ARRIVED` → `IN_PROGRESS`
4. `IN_PROGRESS` → `COMPLETED`

Invalid transitions are rejected. A partner cannot update a job assigned to a different partner.

## 5. Automatic Availability Release

When a job reaches `COMPLETED`, the tracking service uses a database transaction to:

- Update the job status and completion timestamp.
- Set the assigned partner's `PartnerAvailability.isBusy` to `false`.
- Preserve the partner's online/offline setting.

Both updates are committed together or rolled back together if the transaction fails.

## 6. Verification Results

Development test booking: `SVQ-1792317005515`

Development test job: `f194dcbe-fa9c-4ab3-9570-c7c3ec77f1c9`

Verified status progression:

`ACCEPTED` → `EN_ROUTE` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED`

After completion, `GET /partner/availability` returned:

- `isOnline`: `true`
- `isBusy`: `false`

Dispatch authorization checks:

- Unauthenticated request to dispatch state: HTTP `401`.
- Partner request to admin-only dispatch state: HTTP `403`.
- Authenticated partner availability request: successful.

These results verify the tested flows only; additional authorization and failure-path tests are needed before production deployment.

## 7. Production Follow-ups

- Add comprehensive tests for partner ownership, role restrictions, and invalid transitions.
- Review dispatch scheduling, offer expiry, and concurrent job assignment behavior.
- Review the temporary customer address-location test endpoint before production.
- Configure production JWT secrets and payment gateway credentials securely.
- Confirm location permissions, tracking consent, and retention policies.
