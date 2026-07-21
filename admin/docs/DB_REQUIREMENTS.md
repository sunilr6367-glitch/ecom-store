# Database Requirements — Odhvica Admin Panel Upgrade

---

## Existing Tables Being Used

| Table Name                    | Used by Which Pages                   | Any Missing Columns                                            |
| ----------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `products`                    | Products, Collections, Bulk Discounts | None                                                           |
| `product_variants`            | Products, Bulk Discounts              | None                                                           |
| `product_options`             | Products                              | None                                                           |
| `product_images`              | Products                              | None                                                           |
| `product_reviews`             | Reviews                               | None                                                           |
| `product_collections`         | Collections                           | None                                                           |
| `product_categories`          | Categories                            | None                                                           |
| `product_tags`                | Tags                                  | None                                                           |
| `categories`                  | Categories                            | None                                                           |
| `tags`                        | Tags                                  | None                                                           |
| `regions`                     | Regions & Currencies                  | None                                                           |
| `countries`                   | Regions & Currencies                  | None                                                           |
| `money_amounts`               | Products (pricing)                    | None                                                           |
| `customers`                   | Customers, Abandoned Carts (join)     | None                                                           |
| `addresses`                   | Orders, Customers                     | None                                                           |
| `orders`                      | Orders                                | None                                                           |
| `line_items`                  | Orders                                | None                                                           |
| `settings`                    | Settings (all tabs)                   | None — uses key/value store, flexible                          |
| `campaigns`                   | Marketing > Campaigns                 | None                                                           |
| `discounts`                   | Marketing > Discounts                 | None                                                           |
| `discount_usage`              | Marketing                             | None                                                           |
| `wholesale_inquiries`         | Wholesale                             | None                                                           |
| `wholesale_tiers`             | Settings > Tiers (NEW frontend)       | None — backend already uses it                                 |
| `bulk_discounts`              | Marketing > Bulk Discounts (NEW tab)  | None                                                           |
| `saved_carts`                 | Abandoned Carts (NEW page)            | Needs `recovery_sent` + `recovery_sent_at` columns (see below) |
| `back_in_stock_subscriptions` | Marketing > Back-in-Stock             | None                                                           |
| `banners`                     | Content > Banners                     | None                                                           |
| `posts`                       | Content > Blog                        | None                                                           |
| `pages`                       | Content > Pages                       | None                                                           |
| `testimonials`                | Content > Testimonials                | None                                                           |
| `notifications`               | Admin Notifications                   | None                                                           |
| `whatsapp_settings`           | Settings > WhatsApp                   | None                                                           |
| `returns`                     | Returns                               | None                                                           |
| `return_items`                | Returns                               | None                                                           |
| `newsletter_subscribers`      | Marketing (email blasts)              | None                                                           |
| `contacts`                    | Contact form submissions              | None                                                           |
| `wishlists`                   | Store (not in admin)                  | None                                                           |
| `webhook_events`              | Stripe webhooks                       | None                                                           |
| `users`                       | Auth, Settings                        | None                                                           |

---

## New Columns Needed

### Table: `saved_carts`

The `saved_carts` table currently has: `id`, `customer_id`, `session_id`, `items` (JSONB), `created_at`, `updated_at`.

For the Abandoned Carts feature, we need to track recovery status. Rather than adding columns (to avoid schema migration), we'll use the JSONB `items` field's sibling — we'll store recovery metadata in application logic using the `updated_at` timestamp for "last activity" and track `recovery_sent` status via a metadata approach.

**Decision: No new columns required.**

Instead, we'll handle abandoned cart logic entirely at the query level:

- **"Abandoned" = cart whose `updated_at` is older than 1 hour and has no matching order**
- **"Recovery sent" = tracked by inserting a settings key per cart or by adding a simple metadata column**

However, for cleaner implementation, **one new column is recommended:**

| Table         | Column Name        | Type        | Default | Reason                                              |
| ------------- | ------------------ | ----------- | ------- | --------------------------------------------------- |
| `saved_carts` | `recovery_sent`    | `boolean`   | `false` | Track whether recovery email was sent for this cart |
| `saved_carts` | `recovery_sent_at` | `timestamp` | `null`  | When recovery email was sent                        |

---

## New Tables Needed

**None.** All required tables already exist in the schema:

- `saved_carts` — for Abandoned Carts page
- `bulk_discounts` — for Bulk Discounts tab
- `wholesale_tiers` — for Settings > Tiers tab
- `settings` — for all new settings keys (shipping zones, email toggles, etc.)

The `settings` table uses a key-value design (`key: text, value: jsonb`), so new settings for shipping zones, email notification toggles, etc. are stored as new keys without schema changes.

**New settings keys to be used (stored in `settings` table):**

### Shipping Tab Keys:

```
shipping_origin_address    → { address, city, state, country, pincode }
shipping_free_enabled      → boolean
shipping_free_min_value    → number (cents)
shipping_free_applies_to   → "all" | "domestic" | "international"
shipping_zones             → JSON array of zone objects
```

### Email Tab Keys:

```
email_reply_to             → string (email address)
email_notify_order_confirm → boolean
email_notify_payment       → boolean
email_notify_shipping      → boolean
email_notify_delivery      → boolean
email_review_request       → boolean
email_review_request_days  → number (days after delivery)
email_abandoned_cart       → boolean
email_abandoned_cart_hours → number (hours after abandonment)
```

---

## Migration Files to Create

### Migration: Add recovery tracking to saved_carts

**File:** `backend/src/db/migrations/20260309_add_saved_carts_recovery.sql`

> ⚠️ **NOTE:** Existing migrations use date-based naming (e.g. `20260218_...`, `20260227_...`). Before creating this file, check the migrations folder and use today's date `YYYYMMDD` prefix.

```sql
-- Add recovery tracking columns to saved_carts
ALTER TABLE saved_carts
  ADD COLUMN IF NOT EXISTS recovery_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMP;

-- Add index for querying abandoned carts
CREATE INDEX IF NOT EXISTS idx_saved_carts_recovery_sent
  ON saved_carts(recovery_sent);

CREATE INDEX IF NOT EXISTS idx_saved_carts_updated_at
  ON saved_carts(updated_at);
```

**What it does:** Adds `recovery_sent` boolean and `recovery_sent_at` timestamp to `saved_carts` for tracking abandoned cart recovery status. Both have DEFAULT values for backward compatibility.

### Schema Update Required

**File:** `backend/src/db/schema.ts` — Update the `saved_carts` table definition:

```typescript
export const saved_carts = pgTable(
  'saved_carts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'cascade',
    }),
    session_id: text('session_id'),
    items: jsonb('items').notNull().default('[]'),
    recovery_sent: boolean('recovery_sent').default(false), // NEW
    recovery_sent_at: timestamp('recovery_sent_at'), // NEW
    ...createdUpdated,
  },
  (table) => ({
    customerIdx: index('idx_saved_carts_customer_id').on(table.customer_id),
    sessionIdx: index('idx_saved_carts_session_id').on(table.session_id),
    recoverySentIdx: index('idx_saved_carts_recovery_sent').on(table.recovery_sent), // NEW
    updatedAtIdx: index('idx_saved_carts_updated_at').on(table.updated_at), // NEW
  })
);
```

---

## Data Safety Notes

1. **No existing columns are renamed or removed** — only new columns are added
2. **All new columns have DEFAULT values** — existing data survives the migration
3. **The `settings` table uses key-value design** — new settings are just new rows, no schema change
4. **The `bulk_discounts` table already exists** — no migration needed for it
5. **The `wholesale_tiers` table already exists** — no migration needed for it
6. **Migration uses `IF NOT EXISTS`** — safe to run multiple times (idempotent)
