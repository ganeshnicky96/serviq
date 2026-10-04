import { Temporal } from '@js-temporal/polyfill';

(globalThis as any).Temporal = Temporal;

import { db } from '../src/prisma/db.js';

const user = await db.orm.public.User
  .where({
    id: 'ad2c2000-2254-4528-b24e-b738e8f19b5b',
  })
  .first();

console.log({
  id: user?.id,
  phone: user?.phone,
  role: user?.role,
  lastLoginAt: user?.lastLoginAt,
});

await db.close();