import { db } from '../db/client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Dropping legacy tables (lessons, courses)...');
  try {
    await db.execute(sql`DROP TABLE IF EXISTS lessons CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS courses CASCADE;`);
    console.log('Legacy tables dropped.');
  } catch (e) {
    console.error('Error dropping tables:', e);
  }
  process.exit(0);
}

main();
