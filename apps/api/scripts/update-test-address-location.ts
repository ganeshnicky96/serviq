import { Temporal } from '@js-temporal/polyfill';

(globalThis as any).Temporal = Temporal;

import { db } from '../src/prisma/db.js';

async function main() {
  const addressId = '5c11f045-1897-43b0-9400-577849c3c0db';

  const updatedAddress = await db.orm.public.Address
    .where({ id: addressId })
    .update({
      latitude: '17.4000',
      longitude: '78.4900',
      updatedAt: Temporal.Now.instant(),
    });

  if (!updatedAddress) {
    throw new Error('Address update failed');
  }

  console.log({
    id: updatedAddress.id,
    latitude: updatedAddress.latitude,
    longitude: updatedAddress.longitude,
  });

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});