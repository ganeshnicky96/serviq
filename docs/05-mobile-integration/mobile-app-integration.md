
# Module 12 — Mobile App Integration

## 1. Objective

Integrate the SERVIQ Customer and Partner mobile applications with the existing NestJS backend.

Both mobile applications use Expo, React Native, Expo Router, and a shared API request pattern implemented separately within each app.

## 2. API Configuration

Each app has a local `.env` file containing `EXPO_PUBLIC_API_URL`.

Example:

`EXPO_PUBLIC_API_URL=http://192.168.1.7:3000`

Replace the address with the development computer's reachable IPv4 address when necessary.

The `.env.example` files contain a placeholder URL for development setup.

### Network requirements

- The API must be running on port 3000 unless configured otherwise.
- A physical phone and development computer must be able to communicate over the network.
- Use the computer's reachable LAN IPv4 address rather than `localhost` on a physical phone.
- Firewall rules must permit the required connection.

## 3. API Helper

Both applications contain `src/lib/api.ts`.

The helper provides:

- `API_BASE_URL`: configured backend URL.
- `apiRequest<T>()`: JSON HTTP request helper.
- Optional Bearer-token authentication.
- `ApiError`: an error containing the HTTP status code.

Authenticated requests include:

`Authorization: Bearer <accessToken>`

The helper supports JSON request bodies and successful responses with no content.

## 4. Authentication Integration

The backend provides two authentication endpoints.

### Request OTP

`POST /auth/request-otp`

Request body:

`{ "phone": "registered-mobile-number" }`

The response includes a message and OTP expiry duration. In development mode, it also includes `developmentOtp`.

### Verify OTP

`POST /auth/verify-otp`

Request body:

`{ "phone": "registered-mobile-number", "otp": "six-digit-code" }`

Successful verification returns an access token and a user object containing identity and role information.

The mobile applications use the returned access token for protected API requests.

### Current token handling

The current mobile screens hold the access token in React state.

Consequences:

- The token is not persisted across application restarts.
- The user must sign in again after the app state is lost.
- Secure token storage and session restoration remain future work.

## 5. Customer App

Location: `apps/customer`

The integrated Customer screen currently supports:

1. Entering a mobile number.
2. Requesting an OTP.
3. Entering or using the development OTP.
4. Verifying the OTP.
5. Loading the service catalog using an authenticated request.
6. Displaying available services and pricing.
7. Refreshing the service catalog.
8. Logging out and clearing in-memory authentication state.

### API endpoint

`GET /customer/services`

The request must include a valid Bearer token.

### Verified development result

The Customer app was opened successfully in Expo Go.

OTP verification and the authenticated services request succeeded. The service catalog returned the Electrical category and the Switch Replacement service, priced at INR 299 with a 30-minute estimated duration.

## 6. Partner App

Location: `apps/partner`

The integrated Partner screen currently supports:

1. Entering a registered partner mobile number.
2. Requesting and verifying an OTP.
3. Checking that the authenticated account has the PARTNER role.
4. Loading the partner profile.
5. Loading the current availability state.
6. Switching between online and offline when permitted.
7. Refreshing profile and availability.
8. Signing out and clearing in-memory authentication state.

### Partner API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/partner/profile` | Retrieve the authenticated partner profile |
| GET | `/partner/availability` | Retrieve online, busy, and location state |
| POST | `/partner/availability` | Update online/offline status |

The availability update request body is:

`{ "isOnline": true }`

Use `false` to request offline status.

The backend controls the `isBusy` state. The mobile app disables the availability control when the partner is busy.

### Verified development result

The Partner app was opened successfully in Expo Go. OTP login succeeded, and the profile, availability state, refresh control, and online/offline controls were displayed.

## 7. Verification Checklist

- [x] Customer app opens in Expo Go.
- [x] Partner app opens in Expo Go.
- [x] Both apps load the configured API URL.
- [x] Development OTP request works.
- [x] OTP verification returns an access token.
- [x] Authenticated Customer services request succeeds.
- [x] Customer service catalog displays real backend data.
- [x] Authenticated Partner profile and availability requests succeed.
- [x] Partner online/offline controls are available.
- [ ] Customer booking flow integrated and tested.
- [ ] Partner job operations integrated and tested.
- [ ] Live tracking displayed in the mobile apps.
- [ ] Payment and invoice flows integrated into the complete mobile experience.
- [ ] Secure token persistence and session restoration implemented.
- [ ] Production OTP delivery and rate limiting verified.

## 8. Security Notes

- `EXPO_PUBLIC_` variables are bundled into the client and must not contain secrets.
- Never put database credentials, JWT signing keys, or payment-gateway secrets in mobile environment variables.
- The development OTP must not be exposed in production responses.
- Production authentication must use a secure OTP delivery mechanism and appropriate rate limiting.
- Access tokens must be stored securely if persistence is introduced.
- Backend authorization must remain authoritative; hiding a mobile control alone is not a security boundary.

## 9. Current Status

**Customer and Partner authentication and initial API integration are verified in the local development environment.**

The current screens are integration milestones, not the completed production UI.

The next implementation milestone is the Customer booking experience, followed by Partner job operations and mobile tracking.
