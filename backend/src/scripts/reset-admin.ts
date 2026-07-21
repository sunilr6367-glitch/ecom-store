import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
  console.log('🔄 Resetting Admin Password...');

  const email = 'admin@odhvica.com';
  const newPassword = 'admin123';

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      await db
        .update(users)
        .set({ password_hash: hash })
        .where(eq(users.email, email));
    } else {
      await db.insert(users).values({
        email,
        password_hash: hash,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'admin',
      });
    }

    console.log('✅ Password Reset Successfully!');
    console.log(`   User: ${email}`);
    console.log(`   New Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Failed to reset password:', error);
  }

  process.exit(0);
}

resetAdmin();
