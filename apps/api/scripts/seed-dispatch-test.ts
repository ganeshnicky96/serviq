import 'dotenv/config';
import { Temporal } from '@js-temporal/polyfill';

(globalThis as any).Temporal = Temporal;

import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../src/prisma/contract.d.js';
import contractJson from '../src/prisma/contract.json' with { type: 'json' };

const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

async function main() {
  const organization = await db.orm.public.Organization.create({
    name: 'SERVIQ Dispatch Test Organization',
    slug: `dispatch-test-${Date.now()}`,
    phone: '8888888888',
    email: `dispatch-${Date.now()}@serviq.local`,
    isActive: true,
  });

  const user = await db.orm.public.User.create({
    organizationId: organization.id,
    phone: `91111${String(Date.now()).slice(-5)}`,
    email: `partner-${Date.now()}@serviq.local`,
    firstName: 'Test',
    lastName: 'Electrician',
    role: 'PARTNER',
    status: 'ACTIVE',
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  const partner = await db.orm.public.PartnerProfile.create({
    userId: user.id,
    organizationId: organization.id,
    partnerCode: `SVQ-P-${Date.now()}`,
    status: 'ACTIVE',
    profileImage: null,
    bio: 'SERVIQ dispatch test electrician',
    yearsOfExperience: 5,
    rating: '5.0',
    totalJobsCompleted: 10,
    isVerified: true,
  });

  const service = await db.orm.public.Service.first({
    id: '8ed8fc29-dca1-45ae-93f7-23b1dc9df6c1',
  });

  if (!service) {
    throw new Error('Test service not found');
  }

  await db.orm.public.PartnerSkill.create({
    partnerId: partner.id,
    serviceId: service.id,
    isPrimary: true,
  });

  const availability =
    await db.orm.public.PartnerAvailability.create({
      partnerId: partner.id,
      isOnline: true,
      isBusy: false,
      latitude: '17.3850',
      longitude: '78.4867',
      lastSeenAt: Temporal.Now.instant(),
    });

  console.log('\n===== SERVIQ DISPATCH TEST DATA =====');
  console.log('Partner ID:       ', partner.id);
  console.log('Partner Code:     ', partner.partnerCode);
  console.log('Service ID:       ', service.id);
  console.log('Availability ID:  ', availability.id);
  console.log('Online:           ', availability.isOnline);
  console.log('Busy:             ', availability.isBusy);
  console.log('=====================================\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });