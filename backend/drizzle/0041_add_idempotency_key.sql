ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_idempotency_key" ON "orders" ("idempotency_key");
