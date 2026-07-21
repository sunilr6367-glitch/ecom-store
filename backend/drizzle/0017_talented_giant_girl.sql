CREATE TABLE IF NOT EXISTS "bulk_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"min_quantity" integer NOT NULL,
	"discount_percent" integer NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number_id" text NOT NULL,
	"access_token" text NOT NULL,
	"business_account_id" text,
	"admin_phone" text NOT NULL,
	"notify_on_order" boolean DEFAULT true,
	"notify_on_new_customer" boolean DEFAULT false,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wholesale_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"discount_percent" integer NOT NULL,
	"min_order_value" integer DEFAULT 0,
	"min_order_quantity" integer DEFAULT 0,
	"default_moq" integer DEFAULT 1,
	"payment_terms" text DEFAULT 'net_30',
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "wholesale_tiers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "reset_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "reset_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "wholesale_price" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "moq" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_wholesale_only" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_reset_token" ON "customers" ("reset_token");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bulk_discounts" ADD CONSTRAINT "bulk_discounts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bulk_discounts" ADD CONSTRAINT "bulk_discounts_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
