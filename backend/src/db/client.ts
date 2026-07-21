import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

// Fail loudly in production if DATABASE_URL is missing
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not set in production');
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

// Determine if SSL is required for the database connection.
// Supabase pooler URLs contain 'supabase.com' or 'aws-0-'.
// Other cloud DBs (Neon, Railway, etc.) can opt-in via DATABASE_SSL=true env var.
const isSupabase =
  connectionString.includes('supabase.com') ||
  connectionString.includes('aws-0-');
const requiresSsl = isSupabase || process.env.DATABASE_SSL === 'true';
const rejectUnauthorized =
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

// Connection type logging removed for security

// Create postgres client with proper configuration
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10, // fail fast instead of hanging
  max_lifetime: 1800,  // recycle connections every 30 min
  ssl: requiresSsl ? { rejectUnauthorized } : false,
  prepare: false,
  onnotice: () => {}, // suppress noise
});

// Test connection function
export async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    // Connection successful
    return true;
  } catch (error) {
    console.error('[DB DEBUG] Connection failed:', error);
    return false;
  }
}

// Health check with retry
export async function healthCheck(retries = 3, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    // Health check attempt
    if (await testConnection()) {
      return true;
    }
    if (i < retries - 1) {
      // Retrying...
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

export const db = drizzle(client, { schema });

// Initial connection test
// Initial connection test
testConnection().then((connected) => {
  if (connected) {
    console.log('✅ Database client ready');
  } else {
    console.error('❌ Database client failed to connect');
  }
});
