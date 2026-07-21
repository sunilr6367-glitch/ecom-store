# Product Requirements Document — Odhvica Admin Panel

---

## 1. Product Overview

### What This Admin Panel Does

The Odhvica Admin Panel is a full-featured e-commerce back-office for managing:

- Product catalog (products, variants, collections, categories, tags)
- Order processing and fulfillment
- Customer management (retail & wholesale)
- Marketing campaigns and discount codes
- Content management (banners, blog posts, legal pages, testimonials)
- Store settings (general, homepage, shipping, email, payment, security)
- International regions & currencies
- Analytics & reviews
- Returns & refunds

### Who Uses It

- **Primary:** Store owner (single admin managing all operations)
- **Future:** Staff accounts with role-based access

### Current Health Score

- **Score: 75/100**
- **Target: 95/100**
- 15 sidebar pages exist, most are working
- 2 settings tabs are partially empty (Shipping, Email have basic forms but missing features)
- Regions page is missing edit functionality
- No Abandoned Carts page exists
- No Bulk Discounts tab in Marketing
- Sidebar has no logical section grouping
- Tiers backend exists but no admin UI page

---

## 2. Current State Audit

| #   | Route                                       | Page Name                         | Status     | Connected to Real API                                                                         |
| --- | ------------------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| 1   | `/dashboard`                                | Dashboard                         | ✅ Working | Yes                                                                                           |
| 2   | `/dashboard/products`                       | Products                          | ✅ Working | Yes                                                                                           |
| 3   | `/dashboard/collections`                    | Collections                       | ✅ Working | Yes (CRUD with edit)                                                                          |
| 4   | `/dashboard/categories`                     | Categories                        | ✅ Working | Yes                                                                                           |
| 5   | `/dashboard/tags`                           | Tags                              | ✅ Working | Yes                                                                                           |
| 6   | `/dashboard/orders`                         | Orders                            | ✅ Working | Yes                                                                                           |
| 7   | `/dashboard/orders/[id]`                    | Order Details                     | ✅ Working | Yes                                                                                           |
| 8   | `/dashboard/returns`                        | Returns                           | ✅ Working | Yes                                                                                           |
| 9   | `/dashboard/customers`                      | Customers                         | ✅ Working | Yes                                                                                           |
| 10  | `/dashboard/reviews`                        | Reviews                           | ✅ Working | Yes                                                                                           |
| 11  | `/dashboard/analytics`                      | Analytics                         | ✅ Working | Yes                                                                                           |
| 12  | `/dashboard/marketing`                      | Marketing (Campaigns + Discounts) | ✅ Working | Yes                                                                                           |
| 13  | `/dashboard/marketing/back-in-stock`        | Back-in-Stock Alerts              | ✅ Working | Yes                                                                                           |
| 14  | `/dashboard/header-navigation`              | Header Navigation                 | ✅ Working | Yes                                                                                           |
| 15  | `/dashboard/wholesale`                      | Wholesale                         | ✅ Working | Yes                                                                                           |
| 16  | `/dashboard/content`                        | Content Hub                       | ✅ Working | Yes                                                                                           |
| 17  | `/dashboard/regions`                        | Regions & Currencies              | ⚠️ Partial | Yes (Create + Delete only, **no Edit**)                                                       |
| 18  | `/dashboard/settings` (General)             | Settings > General                | ✅ Working | Yes                                                                                           |
| 19  | `/dashboard/settings` (Homepage)            | Settings > Homepage               | ✅ Working | Yes                                                                                           |
| 20  | `/dashboard/settings` (Notifications)       | Settings > Notifications          | ✅ Working | Yes                                                                                           |
| 21  | `/dashboard/settings` (WhatsApp)            | Settings > WhatsApp               | ✅ Working | Yes                                                                                           |
| 22  | `/dashboard/settings` (Security)            | Settings > Security               | ✅ Working | Yes                                                                                           |
| 23  | `/dashboard/settings` (Payment)             | Settings > Payment                | ✅ Working | Yes                                                                                           |
| 24  | `/dashboard/settings` (Email)               | Settings > Email                  | ⚠️ Partial | Yes (SMTP config exists, but missing notification toggles & abandoned cart recovery settings) |
| 25  | `/dashboard/settings` (Shipping)            | Settings > Shipping               | ⚠️ Partial | Yes (Basic rates exist, but missing shipping origin address and zone table)                   |
| 26  | `/dashboard/abandoned-carts`                | Abandoned Carts                   | ❌ Missing | No — page doesn't exist                                                                       |
| 27  | `/dashboard/marketing` (Bulk Discounts tab) | Bulk Discounts                    | ❌ Missing | No — tab doesn't exist in marketing                                                           |

---

## 3. Pages to Fix

### 3.1 Settings > Shipping Tab

- **Current Problem:** Has basic domestic/international rates and free shipping threshold, but:
  - Missing shipping origin address fields
  - Missing structured shipping zones table (add/edit/delete zones)
  - No free shipping toggle (just a threshold number)
- **Exact Fix Needed:**
  - Add shipping origin address block (address, city, state, country, pincode)
  - Add free shipping toggle + minimum order value + "applies to" selector
  - Add shipping zones CRUD table: Zone Name | Countries | Standard Rate | Express Rate | Actions
  - All fields persist via existing settings bulk update API
- **Files to Edit:**
  - `admin/src/app/dashboard/settings/page.tsx` (lines 1456-1594, the shipping tab section)

### 3.2 Settings > Email Tab

- **Current Problem:** Has SMTP config (host, port, user, pass, from name, from email) but:
  - Missing reply-to email field
  - Missing email notification toggles (Order Confirmation, Payment Received, Shipping Update, Delivery Confirmed)
  - Missing Review Request toggle with "send after X days" input
  - Missing Abandoned Cart Recovery toggle with "send after X hours" input
- **Exact Fix Needed:**
  - Add reply-to email field
  - Add notification toggles section below SMTP config
  - Add review request section with toggle + "days after delivery" input
  - Add abandoned cart recovery section with toggle + "hours after abandonment" input
  - All fields persist via existing settings bulk update API
- **Files to Edit:**
  - `admin/src/app/dashboard/settings/page.tsx` (lines 1317-1454, the email tab section)

### 3.3 Regions Page — Missing Edit Functionality

- **Current Problem:** Page has Create + Delete but no Edit button. Backend already has `PUT /regions/:id` route working.
- **Exact Fix Needed:**
  - Add Edit (pencil) button next to Delete button per row
  - Click opens the existing modal, pre-populated with region data
  - Save calls `PUT /api/regions/:id` via new `api.updateRegion()` method
  - Match exact edit pattern from Collections page (`editingId` state, reuse modal form)
- **Files to Edit:**
  - `admin/src/app/dashboard/regions/page.tsx` (add edit state, edit handler, modify modal, add edit button)
  - `admin/src/lib/api.ts` (add `updateRegion` method)

### 3.4 Settings > Tiers

- **Current State:** `wholesale_tiers` table EXISTS in `schema.ts` (line 656). Backend CRUD exists at `admin/tiers.ts` (GET/POST/PATCH/DELETE). No frontend page linked from sidebar.
- **Decision:** Build a proper Tiers management page accessible from Settings.
- **Exact Fix Needed:**
  - Add "Tiers" tab to Settings page tabs array
  - Build full UI: list all wholesale tiers in a table
  - Create/Edit form: tier name, slug, discount %, min order value, min order qty, payments terms, color, priority, active toggle
  - All CRUD calls go to existing backend routes (`/admin/tiers/*`)
  - Add API methods to `api.ts` for tiers CRUD
- **Files to Edit:**
  - `admin/src/app/dashboard/settings/page.tsx` (add new tab + tab content)
  - `admin/src/lib/api.ts` (add tier CRUD methods)

---

## 4. Pages to Build (New)

### 4.1 Abandoned Carts Page — `/dashboard/abandoned-carts`

| Property                 | Detail                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Route**                | `/dashboard/abandoned-carts`                                                                     |
| **Purpose**              | View abandoned shopping carts and trigger recovery emails                                        |
| **DB Tables**            | `saved_carts`, `customers` (join)                                                                |
| **Key Features**         | Stats bar (total value, count, avg), filter tabs (24h/7d/30d), data table, recovery email action |
| **API Endpoints Needed** | `GET /api/admin/abandoned-carts`, `POST /api/admin/abandoned-carts/:id/recover`                  |

**Detailed Features:**

- Stats bar: Total Abandoned Value | Count | Avg Cart Value
- Filter tabs: Last 24hrs / 7 Days / 30 Days
- Table columns: Customer Email | Items | Cart Value | Abandoned At | Status | Actions
- Actions: "Send Recovery Email" button, Delete
- Empty state with helpful message
- Match Orders page styling exactly

### 4.2 Marketing > Bulk Discounts Tab

| Property                 | Detail                                                      |
| ------------------------ | ----------------------------------------------------------- |
| **Route**                | `/dashboard/marketing` (new tab)                            |
| **Purpose**              | Manage quantity-based bulk discounts for products           |
| **DB Tables**            | `bulk_discounts`, `products`, `product_variants`            |
| **Key Features**         | CRUD table for bulk discount rules, inline create/edit form |
| **API Endpoints Needed** | Full CRUD at `/api/admin/bulk-discounts/*`                  |

**Detailed Features:**

- New tab "Bulk Discounts" in Marketing page
- Table: Min Quantity | Discount % | Product/Variant | Active | Actions
- Create form: min_quantity, discount_percent, product selector, description, active toggle
- Edit per row, delete with confirmation
- Uses existing `bulk_discounts` DB table

---

## 5. Sidebar Final Structure

```
── MAIN ──────────────────────
📊 Dashboard                         EXISTS

── CATALOG ───────────────────
📦 Products                          EXISTS
🗂️ Collections                       EXISTS
📂 Categories                        EXISTS
🏷️ Tags                              EXISTS

── STOREFRONT ────────────────
🧭 Header Navigation                 EXISTS

── OPERATIONS ────────────────
🛒 Orders                            EXISTS
↩️ Returns                            EXISTS
👥 Customers                         EXISTS
🏭 Wholesale                         EXISTS
🌍 Regions & Currencies              FIXING (add edit)

── GROWTH ────────────────────
📈 Analytics                         EXISTS
📣 Marketing                         EXISTS
🛒 Abandoned Carts                   NEW
⭐ Reviews                           EXISTS

── CONTENT ───────────────────
📝 Content                           EXISTS

── SETTINGS ──────────────────
⚙️ Settings                          FIXING (shipping, email, tiers tabs)
```

**Rules:**

- Each section has a small uppercase muted label divider
- `bg-[#1e1e2d]` dark sidebar styling preserved
- All existing icons preserved via lucide-react
- Every link points to a working page
- Abandoned Carts link goes under GROWTH (alongside Marketing)

---

## 6. Success Criteria

- [ ] **SC-1:** Every sidebar link navigates to a working page — zero 404s
- [ ] **SC-2:** Settings > Shipping: shipping origin address, free shipping toggle, and shipping zones table all save and persist after refresh
- [ ] **SC-3:** Settings > Email: notification toggles, review request, and abandoned cart recovery settings all save and persist after refresh
- [ ] **SC-4:** Regions: edit button per row opens pre-populated form, save persists changes via API
- [ ] **SC-5:** Abandoned Carts page loads real data from `saved_carts` table with stats and filters
- [ ] **SC-6:** Abandoned Carts "Send Recovery Email" action works and updates status
- [ ] **SC-7:** Marketing "Bulk Discounts" tab is visible and loads real data from `bulk_discounts` table
- [ ] **SC-8:** Bulk Discounts: create, edit, and delete operations all work
- [ ] **SC-9:** Sidebar is properly grouped with section labels, correct ordering, and no broken links
- [ ] **SC-10:** Settings > Tiers: fully working CRUD page for wholesale tiers, or link cleanly removed
