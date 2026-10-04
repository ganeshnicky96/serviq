# SERVIQ — Module 1
# Identity & Organization

## Purpose

This module defines the identity, organization, customer,
and service-provider foundation of the SERVIQ platform.

## Organization

An organization represents the SERVIQ operating company or
a future SaaS tenant.

### Main fields

- id
- name
- slug
- phone
- email
- isActive
- createdAt
- updatedAt

## User

User represents the authentication identity of a person.

A user can have one of the following roles:

- CUSTOMER
- PARTNER
- ADMIN
- SUPER_ADMIN

A user can also have the following statuses:

- ACTIVE
- INACTIVE
- SUSPENDED
- PENDING

## Customer Profile

CustomerProfile contains customer-specific information
associated with a User.

A customer can have multiple service addresses.

## Address

Address represents a physical location where a service
can be requested.

The address stores:

- Address lines
- Landmark
- City
- State
- Postal code
- Latitude
- Longitude
- Default-address flag

Latitude and longitude will later support
service-provider GPS tracking and distance calculations.

## Partner Profile

PartnerProfile represents an electrician/service provider.

Partner information includes:

- Partner code
- Verification status
- Profile image
- Bio
- Experience
- Rating
- Completed jobs
- Organization
- Verification state

Partner availability and skills will be implemented
in later modules.

## Relationships

Organization
    |
    +--- Users
    |
    +--- Customers
    |
    +--- Partners

User
    |
    +--- CustomerProfile
    |       |
    |       +--- Addresses
    |
    +--- PartnerProfile

## Security Considerations

Passwords will not be stored directly in this module.

Authentication will be implemented through the
authentication module.

Phone and email verification will be handled through
the authentication/OTP system.

## Future Extensions

This module will later connect to:

- Service catalog
- Booking
- Partner dispatch
- GPS tracking
- Invoice
- Payment
- Notifications
- Admin SaaS dashboard