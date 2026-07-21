-- Migration: Account Security Features
-- Date: 2026-02-11
-- Purpose: Add account lockout and email verification columns

-- Add columns to customers table
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "verification_token" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "verification_expires_at" timestamp;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "locked_until" timestamp;

-- Add columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamp;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_customers_locked_until" ON "customers" ("locked_until");
CREATE INDEX IF NOT EXISTS "idx_users_locked_until" ON "users" ("locked_until");

-- Create new tables
CREATE TABLE IF NOT EXISTS "contacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "email" text NOT NULL,
    "message" text NOT NULL,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "discount_usage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "discount_id" uuid NOT NULL,
    "customer_id" uuid NOT NULL,
    "order_id" uuid NOT NULL,
    "used_at" timestamp DEFAULT now(),
    CONSTRAINT "pk_discount_customer_usage" PRIMARY KEY("discount_id","customer_id")
);

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "status" text DEFAULT 'active',
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "event_id" text NOT NULL,
    "event_type" text NOT NULL,
    "processed_at" timestamp,
    "status" text DEFAULT 'pending',
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "deleted_at" timestamp,
    CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS "idx_discount_usage_customer_id" ON "discount_usage" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_discount_usage_discount_id" ON "discount_usage" ("discount_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_event_id" ON "webhook_events" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_status" ON "webhook_events" ("status");
CREATE INDEX IF NOT EXISTS "idx_orders_region_id" ON "orders" ("region_id");
CREATE INDEX IF NOT EXISTS "idx_orders_discount_id" ON "orders" ("discount_id");
CREATE INDEX IF NOT EXISTS "idx_line_items_order_id" ON "line_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_line_items_variant_id" ON "line_items" ("variant_id");
CREATE INDEX IF NOT EXISTS "idx_product_variants_product_id" ON "product_variants" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_products_collection_id" ON "products" ("collection_id");
CREATE INDEX IF NOT EXISTS "idx_money_amounts_variant_id" ON "money_amounts" ("variant_id");
CREATE INDEX IF NOT EXISTS "idx_money_amounts_region_id" ON "money_amounts" ("region_id");

-- Drop and recreate foreign key constraints
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_billing_address_id_addresses_id_fk";
ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "addresses_customer_id_customers_id_fk";
ALTER TABLE "line_items" DROP CONSTRAINT IF EXISTS "line_items_order_id_orders_id_fk";
ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_product_id_products_id_fk";
ALTER TABLE "discounts" DROP CONSTRAINT IF EXISTS "discounts_campaign_id_campaigns_id_fk";
ALTER TABLE "wholesale_inquiries" DROP CONSTRAINT IF EXISTS "wholesale_inquiries_reviewed_by_users_id_fk";
ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_customer_id_customers_id_fk";
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_product_id_products_id_fk";
ALTER TABLE "product_option_values" DROP CONSTRAINT IF EXISTS "product_option_values_option_id_product_options_id_fk";
ALTER TABLE "product_options" DROP CONSTRAINT IF EXISTS "product_options_product_id_products_id_fk";
ALTER TABLE "countries" DROP CONSTRAINT IF EXISTS "countries_region_id_regions_id_fk";
ALTER TABLE "money_amounts" DROP CONSTRAINT IF EXISTS "money_amounts_region_id_regions_id_fk";
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_author_id_users_id_fk";
ALTER TABLE "product_categories" DROP CONSTRAINT IF EXISTS "product_categories_category_id_categories_id_fk";
ALTER TABLE "product_tags" DROP CONSTRAINT IF EXISTS "product_tags_product_id_products_id_fk";

-- Add foreign key constraints (DO $$ blocks handle if already exists)
DO $$
BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "line_items" ADD CONSTRAINT "line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "discounts" ADD CONSTRAINT "discounts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "wholesale_inquiries" ADD CONSTRAINT "wholesale_inquiries_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "countries" ADD CONSTRAINT "countries_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "money_amounts" ADD CONSTRAINT "money_amounts_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

SELECT 'Migration completed successfully!' as status;
