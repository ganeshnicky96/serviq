# SERVIQ — Module 4: Dispatch & Partner Assignment

## 1. Module Overview

The Dispatch & Partner Assignment module is responsible for finding suitable service partners for a Job and managing the process of offering that Job to a partner.

The module connects:

Customer Booking
→ Job
→ Eligible Partners
→ Job Offer
→ Partner Response
→ Job Assignment

The system supports:

- Partner eligibility checking
- Partner availability checking
- Service-skill matching
- Job offers
- Offer expiration
- Automatic expiration processing
- Partner acceptance
- Partner rejection
- Partner assignment
- Partner busy-state management
- Offer history
- Dispatch-state inspection

---

# 2. Dispatch Architecture

The dispatch system uses three main database models:

1. `PartnerAvailability`
2. `JobOffer`
3. Existing `Job` assignment fields

Relationship:

Organization
    │
    ├── PartnerProfile
    │       │
    │       ├── PartnerSkill
    │       ├── PartnerAvailability
    │       └── JobOffer
    │
    └── Job
            │
            ├── Booking
            └── JobOffer

---

# 3. Partner Eligibility

A partner is eligible for a Job only when all required conditions are satisfied.

Current eligibility rules:

1. Partner exists
2. Partner status is `ACTIVE`
3. Partner is verified
4. Partner availability exists
5. Partner is online
6. Partner is not busy
7. Partner has the required service skill

The eligibility flow is:

Job
 ↓
Booking
 ↓
Service
 ↓
PartnerSkill
 ↓
PartnerProfile
 ↓
ACTIVE
 ↓
VERIFIED
 ↓
PartnerAvailability
 ↓
ONLINE
 ↓
NOT BUSY
 ↓
Eligible Partner

---

# 4. PartnerAvailability

`PartnerAvailability` represents the current operational state of a service partner.

Important fields:

- `partnerId`
- `isOnline`
- `isBusy`
- `latitude`
- `longitude`
- `lastSeenAt`

Example:

```text
isOnline = true
isBusy   = false
latitude = 17.3850
longitude = 78.4867