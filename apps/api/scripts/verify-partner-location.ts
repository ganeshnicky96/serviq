import { Temporal } from '@js-temporal/polyfill';

(globalThis as any).Temporal = Temporal;

import { db } from '../src/prisma/db.js';

async function main() {
  const result = await db.orm.public.PartnerAvailability
    .where({
      partnerId: '0ae6a33c-3834-48e9-855f-d06dd1c2fd32',
    })
    .first();

  console.log(result);

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});