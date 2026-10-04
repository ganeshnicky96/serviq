# Module 6 — Authentication & Authorization

## 1. Purpose

The Authentication & Authorization module provides secure identity verification and access control for SERVIQ.

The module is responsible for:

- Phone-number based authentication
- OTP generation
- OTP verification
- User creation during first successful login
- JWT access-token generation
- JWT token validation
- Role-based access control
- Authenticated-user identification
- Protection of sensitive API endpoints

The current authentication flow is designed around mobile users and supports SERVIQ roles such as:

- CUSTOMER
- PARTNER
- ADMIN
- SUPER_ADMIN

---

# 2. Authentication Strategy

SERVIQ currently uses:

```text
Phone Number
     ↓
OTP Request
     ↓
OTP Verification
     ↓
User Lookup / Creation
     ↓
JWT Access Token
     ↓
Protected API Requests

src/auth/
│
├── auth.constants.ts
├── auth.controller.ts
├── auth.module.ts
├── auth.service.ts
├── jwt-auth.guard.ts
├── roles.guard.ts
│
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
│
└── dto/
    ├── request-otp.dto.ts
    └── verify-otp.dto.ts