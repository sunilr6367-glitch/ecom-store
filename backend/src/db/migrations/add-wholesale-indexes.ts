import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

console.log('⏳ Adding database indexes for wholesale_inquiries...');

const client = postgres(connectionString, {
  max: 1,
  ssl: 'require',
  prepare: false,
});

const db = drizzle(client);

async function addIndexes() {
  try {
    // Add index on status column for faster filtering
    await client`
            CREATE INDEX IF NOT EXISTS idx_wholesale_status
            ON wholesale_inquiries(status)
        `;
    console.log('✅ Created index: idx_wholesale_status');

    // Add index on created_at for faster sorting
    await client`
            CREATE INDEX IF NOT EXISTS idx_wholesale_created_at
            ON wholesale_inquiries(created_at DESC)
        `;
    console.log('✅ Created index: idx_wholesale_created_at');

    // Add index on email for faster search
    await client`
            CREATE INDEX IF NOT EXISTS idx_wholesale_email
            ON wholesale_inquiries(email)
        `;
    console.log('✅ Created index: idx_wholesale_email');

    // Add composite index for common query pattern
    await client`
            CREATE INDEX IF NOT EXISTS idx_wholesale_status_created
            ON wholesale_inquiries(status, created_at DESC)
        `;
    console.log('✅ Created index: idx_wholesale_status_created');

    console.log('\n🎉 All indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addIndexes();
