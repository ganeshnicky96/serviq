import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../prisma/db.js';
import { JWT_SECRET } from './auth.constants.js';
import { createHash, randomInt } from 'node:crypto';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { Temporal } from '@js-temporal/polyfill';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { MAX_OTP_ATTEMPTS } from './auth.constants.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private hashOtp(otp: string): string {
  return createHash('sha256')
    .update(otp)
    .digest('hex');
}

async requestOtp(dto: RequestOtpDto) {
  const otp = randomInt(100000, 1000000).toString();
  const codeHash = this.hashOtp(otp);

  const now = Temporal.Now.instant();
  const expiresAt = now.add({ minutes: 5 });

  await db.orm.public.OtpVerification.create({
    phone: dto.phone,
    codeHash,
    expiresAt,
    attempts: 0,
    verifiedAt: null,
    createdAt: now,
  });

  const response: {
  message: string;
  expiresInSeconds: number;
  developmentOtp?: string;
} = {
  message: 'OTP generated successfully',
  expiresInSeconds: 300,
};

if (process.env['NODE_ENV'] === 'development') {
  response.developmentOtp = otp;
}

return response;
}

async verifyOtp(dto: VerifyOtpDto) {
  const verification = await db.orm.public.OtpVerification
    .where({ phone: dto.phone })
    .orderBy((otp) => otp.createdAt.desc())
    .first();

  if (!verification) {
    throw new NotFoundException('OTP verification not found');
  }

  if (verification.verifiedAt) {
    throw new BadRequestException('OTP already verified');
  }

  const now = Temporal.Now.instant();

  if (
    Temporal.Instant.compare(
      verification.expiresAt,
      now,
    ) <= 0
  ) {
    throw new BadRequestException('OTP has expired');
  }

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new BadRequestException(
      'Maximum OTP attempts exceeded',
    );
  }

  const submittedHash = this.hashOtp(dto.otp);

  if (submittedHash !== verification.codeHash) {
    await db.orm.public.OtpVerification
      .where({ id: verification.id })
      .update({
        attempts: verification.attempts + 1,
        updatedAt: now,
      });

    throw new BadRequestException('Invalid OTP');
  }

  const updatedVerification =
    await db.orm.public.OtpVerification
      .where({ id: verification.id })
      .update({
        verifiedAt: now,
        updatedAt: now,
      });

  if (!updatedVerification) {
    throw new BadRequestException(
      'OTP verification update failed',
    );
  }

  let user = await db.orm.public.User
  .where({ phone: dto.phone })
  .first();

if (!user) {
  const createdUser = await db.orm.public.User.create({
    phone: dto.phone,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    isPhoneVerified: true,
    isEmailVerified: false,
    organizationId: null,
    email: null,
    firstName: null,
    lastName: null,
    lastLoginAt: null,
  });

  user = createdUser;
}

await db.orm.public.User
  .where({ id: user.id })
  .update({
    isPhoneVerified: true,
    lastLoginAt: now,
    updatedAt: now,
  });
const accessToken = await this.generateAccessToken(user.id);

  return {
  message: 'OTP verified successfully',
  accessToken,
  user: {
    id: user.id,
    phone: user.phone,
    role: user.role,
    status: user.status,
    organizationId: user.organizationId,
  },
};
}

  async findUserByPhone(phone: string) {
    const user = await db.orm.public.User
      .where({ phone })
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async generateAccessToken(userId: string) {
    const user = await db.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.jwtService.sign(
      {
        sub: user.id,
        role: user.role,
        organizationId: user.organizationId,
      },
      {
        secret: JWT_SECRET,
      },
    );
  }
}