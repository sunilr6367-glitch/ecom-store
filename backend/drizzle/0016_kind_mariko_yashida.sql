CREATE TABLE IF NOT EXISTS "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"avatar_url" text,
	"rating" integer DEFAULT 5,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "discount_usage" ALTER COLUMN "used_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "failed_login_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "product_collections" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_locked_until" ON "customers" ("locked_until");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discount_usage_order_id" ON "discount_usage" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_locked_until" ON "users" ("locked_until");--> statement-breakpoint
ALTER TABLE "discount_usage" DROP COLUMN IF EXISTS "id";