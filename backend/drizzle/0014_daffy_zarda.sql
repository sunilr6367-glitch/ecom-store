ALTER TABLE "orders" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "regions" ADD COLUMN "countries" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_line_items_order_id" ON "line_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_line_items_variant_id" ON "line_items" ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_money_amounts_variant_id" ON "money_amounts" ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_money_amounts_region_id" ON "money_amounts" ("region_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_region_id" ON "orders" ("region_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_discount_id" ON "orders" ("discount_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_variants_product_id" ON "product_variants" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_collection_id" ON "products" ("collection_id");