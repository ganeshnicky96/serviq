@'
# Service Catalog & Pricing

## Purpose

This module defines the services that SERVIQ can offer and the pricing information associated with each service.

It also connects qualified partners to the services they can perform.

## Database Models

The module contains:

- ServiceCategory
- Service
- PartnerSkill

## ServiceCategory

Service categories group related services.

Examples:

- Electrical
- Plumbing
- AC Services
- Appliance Repair

A category contains:

- Name
- Slug
- Description
- Icon
- Active status
- Display order

## Service

A service represents an individual service that can be offered to customers.

A service contains:

- Name
- Slug
- Description
- Pricing type
- Price
- Currency
- Unit label
- Estimated service time
- Tax inclusion
- Active status
- Display order

The default currency is INR.

## Pricing Types

SERVIQ supports four pricing models.

### FIXED

A fixed price is displayed to the customer.

Example:

Switch Replacement - ₹299

### STARTING_FROM

The displayed amount is the starting price.

Example:

Wiring Repair - Starting from ₹499

The final amount may depend on the actual work required.

### PER_UNIT

The price is calculated according to a unit.

Examples:

- ₹199 per light
- ₹120 per meter
- ₹100 per point

The unit is stored using the unitLabel field.

### INSPECTION_REQUIRED

Some services require inspection before the final price can be determined.

Example:

Main Electrical Fault - Inspection Required

## PartnerSkill

PartnerSkill connects a PartnerProfile with a Service.

This allows SERVIQ to identify which partners are qualified to perform a particular service.

Example:

Partner:
- Fan Installation
- Light Installation
- Switch Replacement

A partner can have multiple skills.

A service can have multiple qualified partners.

## Relationships

```text
Organization
    |
    +--- ServiceCategory
    |        |
    |        +--- Service
    |               |
    |               +--- PartnerSkill
    |                        |
    |                        +--- PartnerProfile
    |
    +--- PartnerProfile