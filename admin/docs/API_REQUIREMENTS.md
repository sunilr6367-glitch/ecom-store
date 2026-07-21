# API Requirements — Odhvica Admin Panel Upgrade

---

## Existing APIs (No Change Needed)

These routes are fully functional and must NOT be modified:

| Route Base                 | Method(s)             | Purpose                                                                                                                                            | Auth        |
| -------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `GET /auth/login`          | POST                  | Admin login                                                                                                                                        | None        |
| `GET /products`            | GET/POST/PUT/DELETE   | Full product CRUD                                                                                                                                  | verifyAdmin |
| `GET /orders`              | GET/POST/PUT/DELETE   | Order management                                                                                                                                   | verifyAdmin |
| `GET /customers`           | GET/PUT/DELETE        | Customer management                                                                                                                                | verifyAdmin |
| `GET /regions`             | GET                   | List regions                                                                                                                                       | Public      |
| `GET /regions/:id`         | GET                   | Get single region                                                                                                                                  | Public      |
| `POST /regions`            | POST                  | Create region                                                                                                                                      | verifyAuth  |
| `PUT /regions/:id`         | PUT                   | Update region                                                                                                                                      | verifyAuth  |
| `DELETE /regions/:id`      | DELETE                | Delete region                                                                                                                                      | verifyAuth  |
| `GET /settings`            | GET                   | Get all settings                                                                                                                                   | verifyAdmin |
| `PUT /settings/:key`       | PUT                   | Update single setting                                                                                                                              | verifyAdmin |
| `POST /settings/bulk`      | POST                  | Bulk update settings                                                                                                                               | verifyAdmin |
| `GET /marketing/campaigns` | GET/POST/PUT/DELETE   | Campaign CRUD                                                                                                                                      | verifyAdmin |
| `GET /marketing/discounts` | GET/POST/PUT/DELETE   | Discount CRUD                                                                                                                                      | verifyAdmin |
| `GET /collections`         | GET/POST/PUT/DELETE   | Collections CRUD                                                                                                                                   | verifyAdmin |
| `GET /categories`          | GET/POST/PUT/DELETE   | Categories CRUD                                                                                                                                    | verifyAdmin |
| `GET /tags`                | GET/POST/PUT/DELETE   | Tags CRUD                                                                                                                                          | verifyAdmin |
| `GET /reviews`             | GET/PUT/DELETE        | Reviews management                                                                                                                                 | verifyAdmin |
| `GET /analytics`           | GET                   | Analytics data                                                                                                                                     | verifyAdmin |
| `GET /admin/tiers/tiers`   | GET/POST/PATCH/DELETE | Wholesale tiers CRUD (⚠️ path is `/admin/tiers/tiers` — confirmed: `index.ts` mounts at `/admin/tiers`, `tiers.ts` defines sub-routes at `/tiers`) | verifyAdmin |
| `GET /admin/returns`       | GET/PUT               | Returns management                                                                                                                                 | verifyAdmin |
| `GET /admin/back-in-stock` | GET/POST              | Back-in-stock alerts                                                                                                                               | verifyAdmin |
| `GET /admin/whatsapp`      | GET/POST              | WhatsApp settings                                                                                                                                  | verifyAdmin |
| `GET /admin/notifications` | GET/PUT               | Notifications                                                                                                                                      | verifyAdmin |
| `GET /wholesale`           | GET/POST/PUT          | Wholesale inquiries                                                                                                                                | verifyAdmin |

---

## APIs to Create

### 1. GET /admin/abandoned-carts

```
Route:    GET /admin/abandoned-carts
Method:   GET
Auth:     verifyAdmin
Purpose:  List abandoned carts with customer info and value calculation

Query Params:
  period:   string (optional) — "24h" | "7d" | "30d" (default: "30d")

Response: {
  carts: [
    {
      id: string,
      customer_id: string | null,
      session_id: string | null,
      customer_email: string | null,
      customer_name: string | null,
      items: CartItem[],             // JSON array from saved_carts.items
      cart_value: number,            // Calculated total in cents
      item_count: number,            // Number of items
      created_at: string,            // When cart was created
      updated_at: string,            // Last activity (= abandoned time)
      recovery_sent: boolean         // Whether recovery email was sent
    }
  ],
  stats: {
    total_abandoned_value: number,   // Sum of all cart values in cents
    total_count: number,             // Number of abandoned carts
    avg_cart_value: number           // Average cart value in cents
  }
}

DB Tables Used: saved_carts, customers (LEFT JOIN for email/name)

Logic:
  - A cart is "abandoned" if updated_at is older than 1 hour and no corresponding order exists
  - Filter by period: 24h = last 24 hours, 7d = last 7 days, 30d = last 30 days
  - Calculate cart_value by summing item prices from JSON items array
  - LEFT JOIN with customers table on customer_id for email/name

Edge Cases:
  - Guest carts (session_id only, no customer_id) should show email as "Guest"
  - Empty items array should show 0 value
  - Cart value calculation: each item in JSON has unit_price and quantity
```

### 2. POST /admin/abandoned-carts/:id/recover

```
Route:    POST /admin/abandoned-carts/:id/recover
Method:   POST
Auth:     verifyAdmin
Purpose:  Mark an abandoned cart as "recovery email sent"

Request Body: {} (empty — action is just marking status)

Response: {
  success: true,
  message: "Recovery email marked as sent",
  cart_id: string
}

DB Table Used: saved_carts

Logic:
  - Update the saved_cart's metadata to include { recovery_sent: true, recovery_sent_at: ISO timestamp }
  - In future, this could trigger actual email sending via emailService
  - For now, just marks the status

Edge Cases:
  - Cart not found → 404
  - Cart already marked as recovery_sent → Return success with "Already sent" message
```

### 3. DELETE /admin/abandoned-carts/:id

```
Route:    DELETE /admin/abandoned-carts/:id
Method:   DELETE
Auth:     verifyAdmin
Purpose:  Delete an abandoned cart record

Response: {
  success: true,
  message: "Abandoned cart deleted"
}

DB Table Used: saved_carts

Edge Cases:
  - Cart not found → 404
  - Confirm this only deletes from saved_carts, not from orders
```

### 4. GET /admin/bulk-discounts

```
Route:    GET /admin/bulk-discounts
Method:   GET
Auth:     verifyAdmin
Purpose:  List all bulk discount rules

Response: {
  bulk_discounts: [
    {
      id: string,
      product_id: string | null,
      variant_id: string | null,
      product_title: string | null,   // Joined from products table
      min_quantity: number,
      discount_percent: number,
      description: string | null,
      active: boolean,
      created_at: string,
      updated_at: string
    }
  ]
}

DB Tables Used: bulk_discounts, products (LEFT JOIN for title)

Edge Cases:
  - Product may be deleted → show null for product_title
```

### 5. POST /admin/bulk-discounts

```
Route:    POST /admin/bulk-discounts
Method:   POST
Auth:     verifyAdmin
Purpose:  Create a new bulk discount rule

Request Body: {
  product_id: string | null,        // Optional: apply to specific product
  variant_id: string | null,        // Optional: apply to specific variant
  min_quantity: number,             // Required: min items for discount
  discount_percent: number,         // Required: discount percentage (1-100)
  description: string | null,       // Optional: note
  active: boolean                   // Default: true
}

Response: {
  bulk_discount: { ... created record }
}

DB Table Used: bulk_discounts

Validation:
  - min_quantity must be >= 1
  - discount_percent must be 1-100
  - If product_id provided, verify product exists
```

### 6. PUT /admin/bulk-discounts/:id

```
Route:    PUT /admin/bulk-discounts/:id
Method:   PUT
Auth:     verifyAdmin
Purpose:  Update an existing bulk discount rule

Request Body: (partial — any subset of fields)
  Same fields as POST

Response: {
  bulk_discount: { ... updated record }
}

DB Table Used: bulk_discounts

Edge Cases:
  - ID not found → 404
```

### 7. DELETE /admin/bulk-discounts/:id

```
Route:    DELETE /admin/bulk-discounts/:id
Method:   DELETE
Auth:     verifyAdmin
Purpose:  Delete a bulk discount rule

Response: {
  success: true,
  message: "Bulk discount deleted"
}

DB Table Used: bulk_discounts

Edge Cases:
  - ID not found → 404
```

---

## APIs to Fix

### 1. Regions API — No fixes needed

The backend already has full CRUD:

- `GET /regions` — list (public)
- `GET /regions/:id` — single (public)
- `POST /regions` — create (verifyAuth)
- `PUT /regions/:id` — update (verifyAuth)
- `DELETE /regions/:id` — delete (verifyAuth)

**Note:** Uses `verifyAuth` instead of `verifyAdmin`. This is acceptable since the admin panel uses auth tokens. No change needed.

### 2. Frontend API Module — Methods to Add

The following methods need to be added to `admin/src/lib/api.ts`:

```typescript
// Regions — add updateRegion
updateRegion(id: string, data: any)
  → PUT /api/regions/${id}

// Abandoned Carts
getAbandonedCarts(period?: string)
  → GET /api/admin/abandoned-carts?period=${period}

recoverAbandonedCart(id: string)
  → POST /api/admin/abandoned-carts/${id}/recover

deleteAbandonedCart(id: string)
  → DELETE /api/admin/abandoned-carts/${id}

// Bulk Discounts
getBulkDiscounts()
  → GET /api/admin/bulk-discounts

createBulkDiscount(data: any)
  → POST /api/admin/bulk-discounts

updateBulkDiscount(id: string, data: any)
  → PUT /api/admin/bulk-discounts/${id}

deleteBulkDiscount(id: string)
  → DELETE /api/admin/bulk-discounts/${id}

// Wholesale Tiers (for Settings > Tiers tab)
// ⚠️ VERIFIED: index.ts line 282 mounts at '/admin/tiers'
//    tiers.ts defines sub-routes at '/tiers', '/tiers/:id'
//    So full path = /admin/tiers/tiers (double 'tiers' is intentional in current codebase)
getTiers()
  → GET /api/admin/tiers/tiers

createTier(data: any)
  → POST /api/admin/tiers/tiers

updateTier(id: string, data: any)
  → PATCH /api/admin/tiers/tiers/${id}

deleteTier(id: string)
  → DELETE /api/admin/tiers/tiers/${id}
```

---

## Route Registration in Backend

New routes must be registered in `backend/src/index.ts`:

```typescript
// Add imports
import abandonedCartsRoutes from './routes/admin/abandoned-carts';
import bulkDiscountsRoutes from './routes/admin/bulk-discounts';

// Add route registration (line ~304)
app.route('/admin/abandoned-carts', abandonedCartsRoutes);
app.route('/admin/bulk-discounts', bulkDiscountsRoutes);

// Add CSRF protection
csrfForStateChanging([
  '/admin/abandoned-carts/*',
  '/admin/bulk-discounts/*',
]);

// Add rate limiting
// Add to generalApiRoutes array:
'/admin/abandoned-carts/*',
'/admin/bulk-discounts/*',
```
