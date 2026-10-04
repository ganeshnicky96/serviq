export const JWT_SECRET =
  process.env['JWT_SECRET'] ?? 'serviq-development-secret';

export const JWT_EXPIRES_IN = '7d';

export const MAX_OTP_ATTEMPTS = 5;