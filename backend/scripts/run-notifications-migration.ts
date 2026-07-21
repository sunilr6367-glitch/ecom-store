import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const client = postgres(connectionString);

async function migrate() {
  console.log('Running notification and WhatsApp tables migration...');

  try {
    // Create notifications table if not exists
    await client`CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      read boolean DEFAULT false,
      metadata jsonb,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now(),
      deleted_at timestamp
    )`;
    console.log('✓ notifications table created');
  } catch (e: any) {
    if (e.code === '42P07') {
      console.log('✓ notifications table already exists');
    } else {
      console.error('Error creating notifications table:', e.message);
    }
  }

  try {
    // Create whatsapp_settings table if not exists
    await client`CREATE TABLE IF NOT EXISTS whatsapp_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_number_id text NOT NULL,
      access_token text NOT NULL,
      business_account_id text,
      admin_phone text NOT NULL,
      notify_on_order boolean DEFAULT true,
      notify_on_new_customer boolean DEFAULT false,
      is_active boolean DEFAULT false,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now(),
      deleted_at timestamp
    )`;
    console.log('✓ whatsapp_settings table created');
  } catch (e: any) {
    if (e.code === '42P07') {
      console.log('✓ whatsapp_settings table already exists');
    } else {
      console.error('Error creating whatsapp_settings table:', e.message);
    }
  }

  // Create indexes
  try {
    await client`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`;
    await client`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`;
    await client`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`;
    console.log('✓ Indexes created');
  } catch (e: any) {
    console.log('Indexes may already exist:', e.message);
  }

  console.log('✅ Migration completed!');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
