import { db } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function seed() {
  console.log('🌱 Starting Seed...');

  const email = 'admin@odhvica.com';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ ADMIN_PASSWORD environment variable is required');
    console.error(
      "   Set it with: export ADMIN_PASSWORD='your-secure-password'"
    );
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log('⚠️ Admin user already exists. Skipping...');
    process.exit(0);
  }

  // Create Admin
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  await db.insert(users).values({
    email,
    password_hash: hash,
    first_name: 'Super',
    last_name: 'Admin',
    role: 'admin',
  });

  console.log('✅ Admin user created!');
  console.log('   Email: ' + email);
  console.log('   Password: (set via ADMIN_PASSWORD env var)');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
