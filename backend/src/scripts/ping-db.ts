import { db } from '../db';
import { sql } from 'drizzle-orm';
import dns from 'node:dns';

// Force IPv4 lookup
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

async function pingDb() {
  console.log('📡 Pinging Database (IPv4 Preferred)...');
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const duration = Date.now() - start;
    console.log(`✅ Pong! Database Responded in ${duration}ms`);
  } catch (error) {
    console.error('❌ Database Ping Failed:', error);
  }
  process.exit(0);
}

pingDb();
