import { db } from "../src/db/client";
import { sql } from "drizzle-orm";

async function runMigrations() {
    console.log("🔌 Running database migrations...\n");

    try {
        // Account security columns for customers table
        console.log("1. Adding email_verified to customers...");
        await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false`);
        console.log("   ✅ Done\n");

        console.log("2. Adding verification_token to customers...");
        await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_token text`);
        console.log("   ✅ Done\n");

        console.log("3. Adding verification_expires_at to customers...");
        await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_expires_at timestamp`);
        console.log("   ✅ Done\n");

        console.log("4. Adding failed_login_attempts to customers...");
        await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0`);
        console.log("   ✅ Done\n");

        console.log("5. Adding locked_until to customers...");
        await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS locked_until timestamp`);
        console.log("   ✅ Done\n");

        console.log("6. Adding failed_login_attempts to users...");
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0`);
        console.log("   ✅ Done\n");

        console.log("7. Adding locked_until to users...");
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamp`);
        console.log("   ✅ Done\n");

        // Inventory constraint (PostgreSQL doesn't support ADD CONSTRAINT IF NOT EXISTS)
        console.log("8. Adding inventory non-negative constraint...");
        await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'inventory_non_negative'
        ) THEN
          ALTER TABLE product_variants
          ADD CONSTRAINT inventory_non_negative
          CHECK (inventory_quantity >= 0);
        END IF;
      END $$
    `);
        console.log("   ✅ Done\n");

        // Discount usage table
        console.log("9. Creating discount_usage table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS discount_usage (
        discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        PRIMARY KEY (discount_id, customer_id)
      )
    `);
        console.log("   ✅ Done\n");

        console.log("========================================");
        console.log("✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!");
        console.log("========================================\n");
    } catch (err: any) {
        console.error("\n❌ Migration Error:");
        console.error("   Message:", err.message);
        if (err.code) console.error("   Code:", err.code);
        process.exit(1);
    }
}

runMigrations();
