console.log('Script starting...');
import { db } from '../db/client';
import { wholesale_inquiries } from '../db/schema';
import { desc } from 'drizzle-orm';

async function checkWholesale() {
  console.log('🔍 Checking latest wholesale inquiries...');
  try {
    const inquiries = await db
      .select()
      .from(wholesale_inquiries)
      .orderBy(desc(wholesale_inquiries.created_at))
      .limit(1);

    if (inquiries.length > 0) {
      console.log('✅ Found Inquiry:', inquiries[0]);
    } else {
      console.log('⚠️ No inquiries found.');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  process.exit(0);
}

checkWholesale();
