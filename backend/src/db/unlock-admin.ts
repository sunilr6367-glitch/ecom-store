/**
 * unlock-admin.ts
 *
 * Resets the failed_login_attempts and locked_until fields for an admin user.
 * Run this when an admin account is locked out due to too many failed logins.
 *
 * Usage (on VPS inside the backend container):
 *   docker exec -it odhvica-backend-1 npm run unlock-admin -- admin@odhvica.com
 *
 * Or directly if running Node.js without Docker:
 *   NODE_ENV=production tsx src/db/unlock-admin.ts admin@odhvica.com
 */

import { db } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function unlockAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌  Usage: npm run unlock-admin -- <email>');
    console.error('    Example: npm run unlock-admin -- admin@odhvica.com');
    process.exit(1);
  }

  console.log(`🔓 Attempting to unlock account: ${email}`);

  const result = await db
    .update(users)
    .set({
      failed_login_attempts: 0,
      locked_until: null,
    })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email });

  if (result.length === 0) {
    console.error(`❌  No admin account found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✅  Account unlocked successfully!`);
  console.log(`    ID:    ${result[0].id}`);
  console.log(`    Email: ${result[0].email}`);
  console.log(`\nYou can now log in at https://admin.odhvica.com`);

  process.exit(0);
}

unlockAdmin().catch((err) => {
  console.error('❌  Unlock failed:', err.message);
  process.exit(1);
});
