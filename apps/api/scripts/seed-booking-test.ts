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
    name: 'SERVIQ Test Organization',
    slug: `serviq-test-${Date.now()}`,
    phone: '9999999999',
    email: `test-${Date.now()}@serviq.local`,
    isActive: true,
  });

  const user = await db.orm.public.User.create({
    organizationId: organization.id,
    phone: `90000${String(Date.now()).slice(-5)}`,
    email: `customer-${Date.now()}@serviq.local`,
    firstName: 'Test',
    lastName: 'Customer',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  const customer = await db.orm.public.CustomerProfile.create({
    userId: user.id,
    organizationId: organization.id,
    dateOfBirth: null,
    profileImage: null,
  });

  const address = await db.orm.public.Address.create({
    customerId: customer.id,
    label: 'Home',
    addressLine1: '1 SERVIQ Test Street',
    addressLine2: null,
    landmark: null,
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500001',
    latitude: null,
    longitude: null,
    isDefault: true,
  });

  const category = await db.orm.public.ServiceCategory.create({
    organizationId: organization.id,
    name: 'Electrical',
    slug: `electrical-${Date.now()}`,
    description: 'Electrical services',
    icon: null,
    isActive: true,
    sortOrder: 1,
  });

  const service = await db.orm.public.Service.create({
    organizationId: organization.id,
    categoryId: category.id,
    name: 'Switch Replacement',
    slug: `switch-replacement-${Date.now()}`,
    description: 'Replacement of a standard electrical switch',
    pricingType: 'FIXED',
    price: '299',
    currency: 'INR',
    unitLabel: null,
    estimatedTimeMinutes: 30,
    taxIncluded: true,
    isActive: true,
    sortOrder: 1,
  });

  console.log('\n===== SERVIQ BOOKING TEST DATA =====');
  console.log('Organization ID:', organization.id);
  console.log('Customer ID:    ', customer.id);
  console.log('Address ID:     ', address.id);
  console.log('Service ID:     ', service.id);
  console.log('Service Price:  ', service.price);
  console.log('====================================\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });