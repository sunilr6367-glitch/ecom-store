# Execution Plan — Odhvica Admin Panel Upgrade

---

## Task Order (Strict Sequence)

---

### TASK 1: Database Migration — Add Recovery Columns to saved_carts

**Complexity:** Low  
**Depends on:** None

> ⚠️ **BEFORE STARTING:** Check `backend/src/db/migrations/` folder for the latest file. Existing migrations use **date-based naming** (e.g. `20260218_...`, `20260227_...`). Name the new migration using today's date: `YYYYMMDD_add_saved_carts_recovery.sql`. Do NOT assume a number prefix.

**Files to CREATE:**

- `backend/src/db/migrations/YYYYMMDD_add_saved_carts_recovery.sql` (use current date)

**Files to EDIT:**

- `backend/src/db/schema.ts` — Add `recovery_sent` and `recovery_sent_at` columns to `saved_carts` table definition

**DB migration needed:** Yes

**Validation steps:**

- [ ] Migration SQL file exists with correct date-based name
- [ ] Schema.ts includes new columns with proper defaults
- [ ] Existing saved_carts data is not affected

---

### TASK 2: Backend — Create Abandoned Carts API Routes

**Complexity:** Medium  
**Depends on:** Task 1

**Files to CREATE:**

- `backend/src/routes/admin/abandoned-carts.ts`

**Files to EDIT:**

- `backend/src/index.ts` — Import and register new route, add to CSRF/rate-limiting arrays

**DB migration needed:** No

**Validation steps:**

- [ ] `GET /admin/abandoned-carts` returns carts with stats
- [ ] `GET /admin/abandoned-carts?period=24h` filters correctly
- [ ] `POST /admin/abandoned-carts/:id/recover` updates recovery_sent
- [ ] `DELETE /admin/abandoned-carts/:id` deletes cart
- [ ] All routes protected by verifyAdmin
- [ ] No raw SQL — Drizzle ORM only

---

### TASK 3: Backend — Create Bulk Discounts API Routes

**Complexity:** Medium  
**Depends on:** Task 2 (both Tasks 2 & 3 edit `backend/src/index.ts` — must be sequential to avoid conflicts)

**Files to CREATE:**

- `backend/src/routes/admin/bulk-discounts.ts`

**Files to EDIT:**

- `backend/src/index.ts` — Import and register new route, add to CSRF/rate-limiting arrays

**DB migration needed:** No

**Validation steps:**

- [ ] `GET /admin/bulk-discounts` returns all bulk discount rules
- [ ] `POST /admin/bulk-discounts` creates a new rule
- [ ] `PUT /admin/bulk-discounts/:id` updates a rule
- [ ] `DELETE /admin/bulk-discounts/:id` deletes a rule
- [ ] All routes protected by verifyAdmin
- [ ] Product title is joined from products table in GET

---

### TASK 4: Frontend — Add API Methods to api.ts

**Complexity:** Low  
**Depends on:** Tasks 2 & 3

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/lib/api.ts` — Add methods for:
  - `updateRegion(id, data)` → PUT
  - `getAbandonedCarts(period)` → GET
  - `recoverAbandonedCart(id)` → POST
  - `deleteAbandonedCart(id)` → DELETE
  - `getBulkDiscounts()` → GET
  - `createBulkDiscount(data)` → POST
  - `updateBulkDiscount(id, data)` → PUT
  - `deleteBulkDiscount(id)` → DELETE
  - `getTiers()` → GET
  - `createTier(data)` → POST
  - `updateTier(id, data)` → PATCH
  - `deleteTier(id)` → DELETE

**DB migration needed:** No

**Validation steps:**

- [ ] All new methods exist in api object
- [ ] Methods use correct HTTP methods
- [ ] Methods use correct URL paths matching backend routes
- [ ] No raw fetch — uses existing fetchWithTimeout pattern

---

### TASK 5: Frontend — Fix Regions Page (Add Edit)

**Complexity:** Low  
**Depends on:** Task 4

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/app/dashboard/regions/page.tsx`

**DB migration needed:** No

**Implementation:**

- Add `editingId` state (string | null)
- Add `handleEdit(region)` function that pre-populates formData
- Modify modal title to show "Edit Region" vs "Add Region"
- Modify form submit to call `api.updateRegion()` when editing
- Add Edit button (pencil icon) in each row's Actions column
- Match Collections page edit pattern exactly

**Validation steps:**

- [ ] Edit button (pencil icon) appears next to Delete on each row
- [ ] Clicking Edit opens modal pre-filled with region data
- [ ] Submitting edit calls PUT /api/regions/:id
- [ ] After edit, table shows updated data
- [ ] Create flow still works independently

---

### TASK 6: Frontend — Fix Settings > Shipping Tab

> ⚠️ **Tasks 6, 7, 8 must run strictly sequential** — all three edit `admin/src/app/dashboard/settings/page.tsx`. Never run them in parallel.

**Complexity:** Medium  
**Depends on:** Task 4

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/app/dashboard/settings/page.tsx` — Rewrite shipping tab section

**DB migration needed:** No

**Implementation:**

- Add Shipping Origin Address fields (address, city, state, country, pincode)
- Add Free Shipping toggle + minimum order value + "applies to" selector
- Add Shipping Zones table with inline add/edit/delete
- All fields use `handleChange()` → persisted via settings bulk update
- Shipping zones stored as JSON array in settings key `shipping_zones`

**Validation steps:**

- [ ] Origin address fields render and accept input
- [ ] Free shipping toggle works
- [ ] Shipping zones table renders (empty state if no zones)
- [ ] Can add a new zone inline
- [ ] Can edit existing zone
- [ ] Can delete a zone
- [ ] Save → refresh → all data persists

---

### TASK 7: Frontend — Fix Settings > Email Tab

**Complexity:** Medium  
**Depends on:** Tasks 4 & 6 (must wait for Task 6 to finish editing `settings/page.tsx`)

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/app/dashboard/settings/page.tsx` — Enhance email tab section

**DB migration needed:** No

**Implementation:**

- Add Reply-To Email field
- Add Notification Toggles section: Order Confirmation, Payment Received, Shipping Update, Delivery Confirmed
- Add Review Request section: toggle + "send after X days" number input
- Add Abandoned Cart Recovery section: toggle + "send after X hours" number input
- All fields use `handleChange()` → persisted via settings bulk update

**Validation steps:**

- [ ] Reply-to email field renders and accepts input
- [ ] All 4 notification toggles render with labels and descriptions
- [ ] Review request toggle + days input renders
- [ ] Abandoned cart toggle + hours input renders
- [ ] Toggling review request off → save → refresh → still off
- [ ] All fields persist after save

---

### TASK 8: Frontend — Add Settings > Tiers Tab

**Complexity:** Medium  
**Depends on:** Tasks 4, 6 & 7 (must wait for Tasks 6 & 7 to finish editing `settings/page.tsx`)

> ⚠️ **BEFORE STARTING:** Read `backend/src/routes/admin/tiers.ts` and `backend/src/index.ts` (line 282) to verify actual route paths. Confirmed: `index.ts` mounts at `/admin/tiers`, `tiers.ts` sub-routes start with `/tiers`. Full path = `/admin/tiers/tiers`. Use this exact path in API calls.

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/app/dashboard/settings/page.tsx` — Add Tiers tab and tab content

**DB migration needed:** No

**Implementation:**

- Add `{ id: 'tiers', label: 'Tiers', icon: Layers }` to tabs array
- Add tier management UI: table of tiers + create/edit form
- Table columns: Name | Slug | Discount % | Min Order | Payment Terms | Active | Actions
- Create/Edit form: all fields from wholesale_tiers schema
- CRUD calls use `api.getTiers()`, `api.createTier()`, `api.updateTier()`, `api.deleteTier()`
- Import `Layers` icon from lucide-react

**Validation steps:**

- [ ] "Tiers" tab appears in settings sidebar
- [ ] Clicking shows tiers list from real API
- [ ] Can create a new tier
- [ ] Can edit an existing tier
- [ ] Can delete a tier (with confirmation)
- [ ] Empty state shows helpful message

---

### TASK 9: Frontend — Build Abandoned Carts Page

**Complexity:** High  
**Depends on:** Tasks 2 & 4

> ⚠️ **BEFORE STARTING:** Read `admin/src/app/dashboard/orders/page.tsx` completely. This page is the styling reference — match its exact patterns for stats cards, table layout, loading states, empty states, and pagination.

**Files to CREATE:**

- `admin/src/app/dashboard/abandoned-carts/page.tsx`

**Files to EDIT:** None

**DB migration needed:** No

**Implementation:**

- Match Orders page styling exactly (stats bar, filters, table, pagination)
- Stats bar: Total Abandoned Value | Count | Avg Cart Value
- Filter tabs: Last 24hrs | 7 Days | 30 Days
- Table: Customer Email | Items | Cart Value | Abandoned At | Status | Actions
- Actions: "Send Recovery Email" button + Delete button
- "Send Recovery Email" calls `api.recoverAbandonedCart(id)`
- Delete calls `api.deleteAbandonedCart(id)` with confirmation modal
- Empty state: "No abandoned carts found for this period"
- Loading state while fetching
- Error handling with user-friendly messages

**Validation steps:**

- [ ] Page loads at `/dashboard/abandoned-carts`
- [ ] Stats bar shows calculated values
- [ ] Filter tabs switch data
- [ ] Table shows real data from saved_carts
- [ ] "Send Recovery Email" marks cart and shows confirmation
- [ ] Delete works with confirmation
- [ ] Empty state renders when no carts
- [ ] Loading spinner shows during fetch

---

### TASK 10: Frontend — Add Bulk Discounts Tab to Marketing

**Complexity:** High  
**Depends on:** Tasks 3 & 4

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/app/dashboard/marketing/page.tsx` — Add "Bulk Discounts" tab + content

**DB migration needed:** No

**Implementation:**

- Add `{ id: 'bulk_discounts', label: 'Bulk Discounts', icon: Package }` to tabs array
- Add tab content section with table + inline create form
- Table: Min Quantity | Discount % | Product | Active | Actions
- Create form: min_quantity, discount_percent, product selector input, description, active toggle
- ⚠️ **Product selector dropdown:** `api.getProducts()` already exists in `api.ts` — use it directly to fetch product list for the dropdown (call with `limit=100` to get enough options)
- Edit: populate form with existing data
- Delete: confirmation modal
- All CRUD via `api.getBulkDiscounts()`, `api.createBulkDiscount()`, etc.
- Import `Package` icon from lucide-react

**Validation steps:**

- [ ] "Bulk Discounts" tab appears in Marketing page
- [ ] Tab shows bulk discount rules from real API
- [ ] Can create a new bulk discount rule
- [ ] Can edit an existing rule
- [ ] Can delete a rule (with confirmation)
- [ ] Empty state shows when no rules exist

---

### TASK 11: Sidebar Restructure

**Complexity:** Medium  
**Depends on:** Tasks 5, 6, 7, 8, 9, 10 (all pages must exist before restructuring sidebar)

**Files to CREATE:** None

**Files to EDIT:**

- `admin/src/components/layout/Sidebar.tsx` — Complete restructure

**DB migration needed:** No

**Implementation:**

- Replace flat `menuItems` array with grouped sections
- Each section has an uppercase muted label divider
- Section order: MAIN → CATALOG → STOREFRONT → OPERATIONS → GROWTH → CONTENT → SETTINGS
- Add Abandoned Carts link under GROWTH section
- Keep `bg-[#1e1e2d]` dark sidebar styling
- Keep all existing working icons from lucide-react
- Add `ShoppingCart` icon for Abandoned Carts
- Every link must point to a real, working page

**Final sidebar structure:**

```
MAIN:       Dashboard
CATALOG:    Products, Collections, Categories, Tags
STOREFRONT: Header Navigation
OPERATIONS: Orders, Returns, Customers, Wholesale, Regions & Currencies
GROWTH:     Analytics, Marketing, Abandoned Carts, Reviews
CONTENT:    Content
SETTINGS:   Settings
```

**Validation steps:**

- [ ] All section labels visible with correct styling
- [ ] All links clickable, zero 404s
- [ ] Active state highlights correctly
- [ ] Sidebar maintains `bg-[#1e1e2d]` color
- [ ] Marketing sub-items still show when in marketing section
- [ ] Regions link still works under OPERATIONS
- [ ] Abandoned Carts appears under GROWTH

---

## Final Validation Checklist

After all 11 tasks are complete, run these 10 acceptance tests:

1. [ ] **Sidebar Navigation:** Click every single sidebar link — zero 404s
2. [ ] **Settings > Shipping:** Fill all fields (origin, zones, free shipping) → save → refresh → data persists
3. [ ] **Settings > Email:** Toggle review request off → save → refresh → still off
4. [ ] **Regions:** Edit an existing region → save → changes persist in table
5. [ ] **Abandoned Carts:** Page loads with real data from saved_carts table
6. [ ] **Abandoned Carts:** "Send Recovery Email" button marks cart as recovery_sent
7. [ ] **Marketing:** "Bulk Discounts" tab visible and loads real data
8. [ ] **Bulk Discounts:** Create a rule → appears in list → edit → delete works
9. [ ] **Sidebar:** All section labels visible, correct grouping, no broken links
10. [ ] **Settings > Tiers:** Fully working CRUD page for wholesale tiers

---

## Rollback Plan

If something breaks during execution:

### Backend Issues

1. **Migration failure:** Run rollback SQL:
   ```sql
   ALTER TABLE saved_carts DROP COLUMN IF EXISTS recovery_sent;
   ALTER TABLE saved_carts DROP COLUMN IF EXISTS recovery_sent_at;
   DROP INDEX IF EXISTS idx_saved_carts_recovery_sent;
   DROP INDEX IF EXISTS idx_saved_carts_updated_at;
   ```
2. **New route breaks existing routes:** Comment out new route imports in `index.ts` and verify existing routes still work
3. **Schema.ts breaks:** Revert only the `saved_carts` definition to its original form

### Frontend Issues

1. **Settings page breaks:** Revert only the specific tab section (shipping/email/tiers) — each tab is independent
2. **Regions page break:** Revert `regions/page.tsx` to git HEAD
3. **Marketing page break:** Revert `marketing/page.tsx` — the new tab is additive, commenting it out restores original
4. **Sidebar breaks:** Revert `Sidebar.tsx` — the original flat structure still works
5. **New page breaks other pages:** Each new page is in its own directory — delete the directory to remove

### General Safety

- Git commit before each task starts
- Never modify working pages (Products, Orders, Customers, etc.)
- Run `npm run build` after each task to catch TypeScript errors
- Test sidebar navigation after each task completes
