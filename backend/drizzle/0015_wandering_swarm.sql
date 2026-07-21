CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_usage" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"discount_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"used_at" timestamp DEFAULT now(),
	CONSTRAINT "pk_discount_customer_usage" PRIMARY KEY("discount_id","customer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "verification_expires_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discount_usage_customer_id" ON "discount_usage" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discount_usage_discount_id" ON "discount_usage" ("discount_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_events_event_id" ON "webhook_events" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_events_status" ON "webhook_events" ("status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
