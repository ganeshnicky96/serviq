# Module 5 — Partner Location & Live Tracking

## 1. Overview

Module 5 introduces real-time partner location tracking for SERVIQ.

The purpose of this module is to allow:

- Partners to send GPS location updates.
- SERVIQ backend to validate and store partner locations.
- SERVIQ to maintain the partner's latest known location.
- Customers to retrieve the current partner location for an assigned job.
- Jobs to move through a controlled tracking lifecycle.

The module establishes the backend foundation required for a future customer experience similar to Swiggy/Zomato live tracking.

---

## 2. Objectives

This module provides:

1. Partner GPS location ingestion.
2. Location history storage.
3. Latest partner location storage.
4. Partner last-seen tracking.
5. Customer access to the current assigned partner location.
6. Controlled job tracking status transitions.
7. Timestamped location records.
8. Foundation for future distance and ETA calculation.

---

## 3. Location Data Architecture

SERVIQ uses two related concepts for partner location.

### PartnerAvailability

`PartnerAvailability` stores the partner's current/latest location.

Important fields:

- `latitude`
- `longitude`
- `lastSeenAt`
- `isOnline`
- `isBusy`

This answers:

> Where is the partner right now?

### PartnerLocation

`PartnerLocation` stores individual GPS readings as location history.

Important fields:

- `partnerId`
- `jobId`
- `latitude`
- `longitude`
- `accuracy`
- `heading`
- `speed`
- `recordedAt`
- `createdAt`

This answers:

> Where has the partner been?

---

## 4. PartnerLocation Relationships

The relationship is:

```text
PartnerProfile
      │
      ├── PartnerAvailability
      │       └── Latest location
      │
      └── PartnerLocation[]
              └── Location history
                       │
                       └── Optional Job

---

## 22. Distance Calculation

SERVIQ calculates the approximate straight-line distance between:

```text
Partner current GPS location
        ↓
Customer address GPS location

Partner:
17.3850, 78.4867

Customer:
17.4000, 78.4900

Distance:
1.7 km

ETA minutes = distance / average speed × 60

Distance:
1.7 km

Average speed:
25 km/h

Estimated ETA:
approximately 4 minutes