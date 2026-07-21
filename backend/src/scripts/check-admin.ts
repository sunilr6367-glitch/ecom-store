import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function checkAdmin() {
  console.log('🔍 Checking for admin user...');

  try {
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} users in the database.`);
    console.log('---------------------------------------------------');
    allUsers.forEach((u) => {
      console.log(`User: ${u.email} | Role: ${u.role} | ID: ${u.id}`);
    });
    console.log('---------------------------------------------------');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }

  process.exit(0);
}

checkAdmin();
