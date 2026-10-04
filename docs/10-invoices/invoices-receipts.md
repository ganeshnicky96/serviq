# Module 9 — Invoices & Receipts

## 1. Module Overview

The Invoice & Receipt module converts a successful SERVIQ payment into a
customer invoice.

The module provides:

- Invoice generation
- Unique invoice number
- Invoice status tracking
- Booking-to-invoice relationship
- Customer-to-invoice relationship
- Payment reference
- Payment method
- Invoice totals
- Duplicate invoice protection
- Customer ownership protection
- Future PDF/download support

---

## 2. Invoice Lifecycle

Current lifecycle:

```text
Booking
   ↓
Successful Payment
   ↓
Confirmed Booking
   ↓
Invoice Generated
   ↓
Invoice Status = PAID


Invoice Generation
Invoice ID:
42df39a8-4f81-4b00-8f9a-98b771c1d021

Invoice Number:
SVQ-INV-1791096151731

Status:
PAID

Subtotal:
299 INR

Total:
299 INR

## PDF Invoice Generation

SERVIQ supports generating a PDF version of an issued invoice.

### Endpoint

GET `/invoices/:id/pdf`

### Authentication

JWT authentication is required.

The invoice is returned only when the authenticated customer owns the invoice.

### PDF Contents

The generated invoice contains:

- SERVIQ branding
- Invoice number
- Invoice date
- Invoice status
- Customer name
- Customer address
- Booking number
- Service name
- Quantity
- Subtotal
- Tax
- Total paid
- Payment method
- Payment reference
- Payment status
- Computer-generated invoice footer

### Customer Name

The PDF uses the customer's first name and last name from the associated `User` record.

If a name is unavailable, the PDF falls back to:

`SERVIQ Customer`

### Security

The PDF endpoint uses the same invoice ownership validation as the invoice details endpoint.

A customer cannot download another customer's invoice PDF.

### Current Status

Module 9 invoice management now supports:

- Invoice creation
- Duplicate invoice protection
- Payment-linked invoice data
- Customer ownership validation
- Invoice retrieval
- PDF invoice generation
- Customer name in PDF
- Secure PDF download