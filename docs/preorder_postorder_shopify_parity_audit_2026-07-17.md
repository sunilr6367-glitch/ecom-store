# Odhvica Pre-order, Post-order & Admin Panel Audit

**Audit date:** 17 July 2026  
**Audited commit:** `891e25ac4c2d299c70ab821d287bc41c6dc3e325` (`origin/main` and local `HEAD`)  
**Audit type:** Static code, schema, API, UI, workflow, and focused-test review  
**Benchmark:** A mature Shopify-style D2C store. “Shopify parity” means comparable operational capability, not identical implementation or UI.

## 1. Executive verdict

Odhvica has a **good custom post-order foundation**, but it is **not yet at full Shopify-standard order-management parity**. The normal paid-order path—checkout, payment verification, inventory reservation, order processing, packages, tracking, labels, delivery, return request, provider refund, and restocking—is materially implemented.

The **pre-order workflow is not a real pre-order system today**. A database field named `allow_backorder` exists, but it is not exposed in the product admin and the checkout still rejects quantities above current stock. There is no pre-order availability window, expected ship date, allocation, customer consent, pre-order-specific payment policy, messaging, queue, reporting, or delay workflow.

### Overall scorecard

| Area | Score | Verdict |
|---|---:|---|
| Pre-order product setup | 1/10 | Not implemented as an operable workflow |
| Pre-order storefront and checkout | 1/10 | Out-of-stock becomes “notify me,” not pre-order |
| Checkout/order creation | 8/10 | Strong server-side pricing, stock, payment ownership, and idempotency |
| Payment lifecycle | 8/10 | Razorpay, PayPal, and Stripe paths exist; refund-provider integration exists |
| Fulfilment and shipping | 8/10 | Multi-package, tracking/no-tracking, carrier label, notes, ETA, and checklist are strong |
| Customer post-order experience | 7/10 | Tracking, account orders, and return requests exist; cancellation/reorder/payment recovery are incomplete |
| Returns/refunds | 6/10 | Secure partial-item refund basis, but only one return per order and no exchange/RMA depth |
| Admin order UI | 7/10 | Useful operational UI, but lacks Shopify-level payment, risk, editing, timeline, saved views, and audit depth |
| Data integrity/auditability | 6/10 | Status history and provider idempotency exist; hard delete and metadata-heavy workflow reduce audit strength |
| **Weighted overall** | **6.2/10** | Solid custom store foundation; not complete Shopify-grade operations |

**Release recommendation:** Normal retail orders can proceed after closing the critical issues below. Do **not** market or activate pre-orders until the dedicated P0 pre-order work is implemented and tested.

## 2. Benchmark definition

A mature Shopify-style order operation normally separates:

- commercial order state (open, cancelled, archived);
- payment state (pending, authorized, paid/captured, partially refunded, refunded, failed);
- fulfilment state (unfulfilled, partial, fulfilled/shipped, delivered);
- return state (requested, approved/in progress, inspected, returned, refunded);
- risk/hold state;
- customer communications and a complete immutable timeline.

It also supports order search and filters, draft/manual orders, order editing, partial fulfilments, labels, packing documents, cancellation/refund/restock controls, self-service returns, multiple returns, exchanges, customer history, tags/notes, and operational reports.

Pre-orders additionally need a purchase-option contract: product eligibility, sale window, promised/estimated availability, allocation limits, full/deposit/deferred payment behavior, explicit customer disclosure and consent, delayed-date communications, cancellation/refund rules, and separate fulfilment reporting.

## 3. Current end-to-end workflows

### 3.1 Current purchase (“pre-order”/pre-payment) path

1. Customer selects an in-stock variant.
2. Checkout collects authenticated/OTP identity, shipping/billing address, shipping method, coupon, gift wrap, and terms acceptance.
3. Backend re-reads product/variant prices and inventory instead of trusting browser totals.
4. Shipping, discount, currency conversion, and tax are calculated server-side.
5. Checkout uses a deterministic idempotency key to reduce duplicate order creation.
6. Inventory is atomically reduced inside the transaction.
7. An unpaid order and line-item snapshots are created.
8. A short-lived checkout payment token binds the buyer/payment session to the order.
9. Razorpay/PayPal/Stripe verifies amount, currency, provider identifiers, and capture state.
10. Successful capture finalizes the order and triggers confirmation; failure/expiry releases inventory.

This is a **normal stock-reservation and payment workflow**, not a pre-order workflow.

### 3.2 Current post-order path

`pending → processing → shipped → delivered`, with terminal `cancelled` and `refunded` states.

Admin can:

- search/filter orders and view summary metrics;
- change valid statuses;
- maintain ship-by and estimated-delivery dates;
- add customer/internal notes;
- create multiple package records;
- add tracking or intentionally mark no tracking;
- check carrier readiness/rates and purchase a Shiprocket-supported label;
- store label status/cost/dimensions;
- maintain a packing checklist;
- send templated buyer email updates;
- download invoices;
- complete shipment and notify the buyer;
- approve/reject a return and execute the provider refund with optional restocking.

Customers can:

- view account order history and order detail;
- track an order using order number plus email;
- see workflow/tracking information;
- submit a return for delivered orders;
- see return status.

## 4. What is implemented well

### A. Checkout integrity

- Server-side price lookup prevents client price tampering.
- Atomic inventory decrement protects the last unit from concurrent checkout races.
- Reservation expiry and failed-payment paths restore stock.
- Duplicate checkout protection exists through order idempotency.
- Coupon status, date window, global usage, per-customer usage, and minimum order checks exist.
- Tax is calculated on discounted value, and shipping options are server-derived.
- Guest and signed-in checkout ownership rules are enforced.
- Sensitive checkout fields are redacted from logging.

### B. Payment safety

- Payment APIs require an order-bound checkout token or authenticated ownership.
- Razorpay verification validates signature, provider order ID, amount, currency, and captured state.
- PayPal capture validates the order and paid amount/currency.
- Webhook paths and provider event handling exist.
- Provider refund calls use idempotency identifiers.
- Full and partial refund payment states are distinguished in the return workflow.

### C. Fulfilment operations

- A real transition map prevents arbitrary forward/backward status changes.
- Multi-package records support split shipment data.
- Tracking and no-tracking fulfilment are both modeled.
- Shipping label metadata, dimensions, carrier rates, and live label purchase are supported.
- Packaging quality checklist is valuable for a premium handmade brand.
- Ship-by, overdue, missing-tracking, packaging, on-time-shipping, tracking-coverage, and processing-time metrics exist.
- Customer-facing and internal notes are separated.

### D. Returns security

- Customer ownership of the order is verified.
- Returns are restricted to delivered/completed orders.
- Returned line IDs must belong to the order.
- Duplicate line IDs and quantities above purchased quantities are rejected.
- Discount allocation reduces maximum refundable value proportionally.
- Only captured payments can enter provider refund processing.
- A compare-and-set `refund_processing` claim reduces double-refund risk.
- Restock happens after successful provider refund initiation.

## 5. Critical and high-priority findings

### P0-01 — No genuine pre-order domain model or workflow

**Evidence:** `product_variants.allow_backorder` exists, but product admin forms only expose inventory quantity. Storefront treats zero stock as unavailable/back-in-stock. Checkout rejects `requested quantity > inventory_quantity` and its transaction update requires inventory to remain non-negative.

**Business impact:** Odhvica cannot truthfully sell “pre-order” items, promise dates, forecast committed demand, or distinguish ready stock from future stock. Enabling the existing backorder flag alone would not solve this.

**Required implementation:**

- variant purchase mode: `in_stock | preorder | backorder | made_to_order`;
- pre-order sale start/end, expected ship window, allocation cap, per-customer cap;
- full/deposit/deferred payment policy and balance state;
- immutable line-item snapshot of pre-order promise and terms version;
- customer disclosure/consent checkbox and confirmation text;
- mixed-cart rules for ready + pre-order items;
- separate pre-order admin queue, allocation/oversell metrics, ETA change action;
- delay, ready-to-ship, payment-due, cancellation, and refund communications;
- reporting by promised window and allocation status;
- end-to-end tests for oversell, ETA changes, partial payment, cancellation, refund, and mixed fulfilment.

### P0-02 — Checkout success can show success without confirmed payment

**Evidence:** The success page polls payment status, but after 30 seconds it falls back to `success` if still loading.

**Impact:** A delayed or unconfirmed payment can be presented as “Order Confirmed.” This creates customer-support, inventory, and accounting ambiguity.

**Fix:** Never infer success from elapsed time. Show “Payment verification pending,” continue safe polling with a bounded retry policy, provide refresh/support actions, and only show confirmed success for a server-verified captured/paid state.

### P0-03 — Returns allow only one return record per order

**Evidence:** Both customer and admin return creation check whether any return already exists for the order and reject a second request.

**Impact:** A customer cannot return one item now and another later, submit multiple partial returns, or retry after a rejected/closed return. Shopify-style order status explicitly supports multiple returns.

**Fix:** Remove one-return-per-order constraint; calculate remaining returnable quantity per line across non-rejected returns; add return lifecycle and per-line cumulative validation.

### P0-04 — Hard-delete order API is unsafe for commerce records

**Evidence:** Admin API exposes `DELETE /orders/:id`; service deletes line items and then the order.

**Impact:** Financial, tax, customer-service, refund, fulfilment, and audit evidence can disappear. Related rows may also fail or become inconsistent.

**Fix:** Remove routine hard delete. Use cancel + archive/soft-delete with reason, actor, timestamp, and immutable audit event. Restrict any legal erasure workflow to a separately authorized, policy-compliant process that preserves required financial records.

### P1-01 — Order status is too compressed

One workflow status currently merges commercial, payment, and fulfilment concepts. The database has separate fields, but admin presentation and decisions are centered on a single status.

**Missing/weak states:** authorized, payment pending, payment review, partially paid, partially refunded, unfulfilled, partially fulfilled, on hold, return requested/in progress/inspected/returned, archived, and fulfilment not required.

**Fix:** Display separate badges/filters and enforce cross-state rules. A payment issue must not look like a normal `pending` fulfilment order.

### P1-02 — Admin lacks payment operations and payment history

There is no complete admin payment card showing gateway transactions, authorization/capture, failures, partial refunds, remaining refundable amount, or retry/resend-payment action. Manual status refund is correctly blocked, but operational payment visibility is still incomplete.

**Fix:** Add provider transaction ledger, payment timeline, capture/void where supported, refund history, outstanding amount, and safe retry/payment-link actions.

### P1-03 — No fraud/risk review before fulfilment

Payment ownership checks are good security controls, but there is no order risk score, AVS/CVV/provider indicator display, IP/device mismatch view, manual hold/release, or risk queue.

**Fix:** Store gateway risk signals, show low/medium/high risk, automatically hold high-risk orders, require an auditable release action, and prevent label purchase/fulfilment while on hold.

### P1-04 — Return workflow lacks operational depth

Missing or weak:

- return eligibility window and policy rules enforced by code;
- return shipping label/RMA number;
- received and inspection states;
- item condition/disposition;
- exchange or store-credit workflow;
- multiple returns;
- refund shipping/tax handling policy;
- return-specific customer notifications and SLA timers;
- attachment/photo evidence;
- explicit webhook reconciliation for refund completion/failure at the return record level.

The admin list also hardcodes `$`, so INR and other currencies are displayed incorrectly.

### P1-05 — Order detail lacks a complete immutable timeline

`order_status_history` is written for explicit admin status changes, while shipping, package, label, payment, refund, email, notes, and carrier actions are split across metadata and different tables. The UI shows a generated milestone timeline, not a full actor-attributed event log.

**Fix:** Create append-only `order_events` with event type, actor, source, previous/new values, provider reference, timestamp, and safe metadata. Render it in admin.

### P1-06 — No Shopify-style order editing or draft/manual orders

Admin cannot safely add/remove line items, change quantities, adjust shipping/discounts, collect a balance, refund a decrease, or create a draft/manual order and send an invoice link.

**Fix:** Build a transactional order-edit engine with recalculation, inventory deltas, payment delta, customer confirmation, and audit log. Add draft orders separately.

### P1-07 — Cancellation experience is incomplete

Admin can cancel and stock is released, but there is no structured cancellation reason, refund calculation/action in the same flow, customer notification option, provider void, or customer cancellation request.

**Fix:** Cancellation wizard: reason, restock, refund/void, notification, fraud flag, and audit event. Customer self-cancel can be permitted only before a configurable fulfilment cutoff.

## 6. Medium-priority gaps

### P2 admin order list/UI

- Backend supports richer queue/date/sort filters, but the visible list mainly exposes status and search.
- No saved views, tags, payment/fulfilment/risk/return filters, or bulk actions UI.
- Search/filter state is not a complete shareable operational view.
- No column/table density option for large order volumes.
- “Revenue” logic counts delivered/completed workflow states and should be reconciled against captured payments, refunds, and reporting currency.
- Status transition options in UI include refund, although backend rejects manual refund; this can create a dead action depending on the current screen state.

### P2 fulfilment

- Multi-package exists, but line-item-to-package allocation is not evident; partial fulfilment quantities cannot be reliably audited.
- Label purchase appears strongest for Shiprocket; other providers are modeled but may return configuration/readiness rather than full parity.
- No pickup scheduling/manifest/scan form, packing slip UI, bulk label printing, or fulfilment-location routing.
- Delivery is primarily an admin state; carrier webhook-driven delivered/exception events need stronger evidence.

### P2 customer experience

- No “buy again” action.
- No customer “pay now” recovery for an outstanding order.
- No customer-requested cancellation/edit-address flow.
- Tracking lookup exposes a useful summary but not a full support/event timeline.
- Customer returns require login; guest return initiation needs a secure order/email/OTP path if business policy permits.
- Return status is visible, but detailed returned items, refund amount, next action, and shipment instructions are limited.

### P2 inventory and operations

- No incoming inventory/purchase-order ledger for pre-order allocation.
- No multi-location inventory or fulfilment assignment.
- No inventory adjustment reason/history visible in the audited workflow.
- Reservation expiry uses metadata and scheduled cleanup; monitoring/alerting for stuck reservations should be explicit.

### P2 reporting

- Useful fulfilment metrics exist, but no dedicated pre-order forecast, promised-date breach, cancellation reason, return reason, refund ageing, payment failure recovery, chargeback, or contribution-margin reports.

## 7. Feature parity matrix

| Capability | Status | Notes |
|---|---|---|
| Secure checkout recalculation | Strong | Server-controlled prices, tax, shipping, discounts |
| Guest and account checkout | Strong | Ownership protections present |
| Inventory reservation | Strong | Atomic decrement and release paths |
| Duplicate order prevention | Strong | Checkout idempotency present |
| Multiple payment providers | Strong | Razorpay, PayPal, Stripe code paths |
| Payment confirmation email | Good | Sent after verified capture in primary active flows |
| Payment status separation | Partial | Stored separately, not fully operationalized in admin |
| Fraud/risk analysis | Missing | No risk queue/hold UI |
| Pre-order purchase option | Missing | Backorder field is dormant and insufficient |
| Deposit/deferred pre-order payment | Missing | No balance collection lifecycle |
| Pre-order ETA/customer consent | Missing | No line-level promise snapshot |
| Mixed ready/pre-order cart | Missing | No split-shipment policy |
| Order search | Good | Searches order/customer/address/item/notes |
| Rich filters/saved views | Partial | Backend richer than visible UI; no saved views |
| Separate payment/fulfilment/return badges | Partial | Single workflow status dominates |
| Valid status transitions | Strong | Backend transition map exists |
| Order tags | Missing | Product tags are unrelated |
| Internal/customer notes | Good | Both exist |
| Immutable full timeline | Partial | Status history plus metadata, not complete ledger |
| Draft/manual orders | Missing | No admin order creation/invoice checkout |
| Edit placed order | Missing | No line/shipping/discount edit engine |
| Cancel + refund + restock wizard | Partial | Cancel/release exists; integrated refund flow missing |
| Multi-package shipment | Good | Package model and UI exist |
| Partial fulfilment by line/quantity | Partial | Package exists; allocation evidence is weak |
| Carrier rates/label purchase | Good | Shiprocket-focused live path |
| Packing checklist | Strong | Brand-specific operational strength |
| Invoice PDF | Good | Download endpoint exists |
| Packing slip/bulk print | Missing/weak | Not evidenced |
| Customer tracking | Good | Email + order-number lookup |
| Account order history | Good | Present |
| Buy again/pay now | Missing | Standard customer convenience gap |
| Self-service return request | Good foundation | Authenticated customer flow exists |
| Multiple returns per order | Missing | Explicitly blocked |
| Return label/RMA/inspection | Missing | No reverse logistics depth |
| Exchanges/store credit | Missing | Refund only |
| Provider partial refund | Good foundation | Amount-limited provider refunds |
| Refund reconciliation | Partial | Provider webhook handling exists, return-state reconciliation needs depth |
| CSV order export | Good | 10,000-row cap |
| Hard-delete protection | Unsafe | Admin hard delete exists |

## 8. Recommended implementation roadmap

### Phase 0 — Immediate safety fixes

1. Remove success-page timeout that infers payment success.
2. Disable/remove hard order deletion; add cancel/archive.
3. Remove manual refund options from all UI states and route every refund through return/refund workflow.
4. Fix return currency rendering.
5. Add tests covering pending payment on success page, repeated returns, hard-delete authorization/removal, and partial refunds.

### Phase 1 — Normalize order architecture

1. Separate order, payment, fulfilment, return, risk, and archive statuses in API and UI.
2. Add append-only `order_events`.
3. Add structured cancellation and hold/release workflows.
4. Add payment/refund ledger and admin payment panel.
5. Add line-level fulfilment allocation.

### Phase 2 — Complete returns

1. Support multiple returns per order and cumulative quantity accounting.
2. Add eligibility rules, RMA, return shipment, received, inspection, disposition, exchange/store-credit options.
3. Add customer instructions and event-driven notifications.
4. Reconcile provider refund webhook results into individual return/refund records.

### Phase 3 — Build pre-orders correctly

1. Add purchase-option and pre-order tables rather than relying on a boolean.
2. Add admin product setup, allocation, promised window, payment policy, and visibility controls.
3. Add storefront badge, PDP disclosure, cart segmentation, and checkout consent.
4. Add pre-order order-line snapshots and separate queue/reporting.
5. Add ETA-change and payment-due communications.
6. Run legal/payment-provider review for supported pre-order charge timing and cancellation rights.

### Phase 4 — Shopify-level operations

1. Draft/manual orders and invoice links.
2. Transaction-safe order editing.
3. Saved views, tags, bulk operations, packing slips, and bulk labels.
4. Fraud/risk integrations and chargeback evidence.
5. Customer buy-again, pay-now, cancellation request, and address-change request.

## 9. Acceptance criteria

The system should not be called Shopify-standard until:

- all P0 findings are closed;
- payment success is always server-confirmed;
- orders cannot be physically deleted through normal admin operations;
- statuses are separated and filterable;
- multiple partial returns and cumulative quantities are correct;
- a complete actor-attributed event timeline exists;
- cancellation, refund, restock, and notification are one coherent workflow;
- pre-order promises/payment terms are stored on each line item and visible to customer/admin;
- mixed carts and partial fulfilments have deterministic behavior;
- provider webhook replays and duplicate actions are idempotent;
- desktop/mobile admin and storefront E2E tests cover success, failure, retry, empty, partial, delayed, and race-condition states;
- production-like payment, carrier, email, refund, and reservation-expiry drills pass.

## 10. Verification performed and limitations

Reviewed:

- database order, line-item, inventory, return, and history structures;
- store checkout, payment, tracking, and return APIs;
- payment capture/ownership, inventory reservation, provider refund, carrier, and workflow utilities;
- admin order list/detail and returns UI;
- storefront checkout/success, product stock behavior, account orders, tracking, and returns;
- existing order/payment/checkout tests;
- V4/V5 storefront architecture constraints.

A focused Vitest command was launched for order workflow, checkout, Razorpay, PayPal, and payment ownership. It did not produce a completion result within the audit window, so this report does **not** claim those tests passed. No live gateway transaction, carrier purchase, email delivery, database migration check, browser walkthrough, accessibility scan, or production-data audit was performed.

## 11. Primary code evidence

- `backend/src/db/schema.ts`
- `backend/src/routes/store/checkout.ts`
- `backend/src/routes/store/payments.ts`
- `backend/src/routes/store/payments-razorpay.ts`
- `backend/src/routes/store/payments-paypal.ts`
- `backend/src/routes/store/orders.ts`
- `backend/src/routes/store/returns.ts`
- `backend/src/routes/orders.ts`
- `backend/src/routes/admin/returns.ts`
- `backend/src/services/order-service.ts`
- `backend/src/services/refund-service.ts`
- `backend/src/services/carrier-service.ts`
- `backend/src/utils/order-workflow.ts`
- `backend/src/utils/inventory-reservation.ts`
- `backend/src/utils/payment-capture.ts`
- `backend/src/utils/payment-ownership.ts`
- `backend/src/utils/return-validation.ts`
- `admin/src/app/dashboard/orders/page.tsx`
- `admin/src/app/dashboard/orders/[id]/page.tsx`
- `admin/src/app/dashboard/returns/page.tsx`
- `admin/src/app/dashboard/products/[id]/page.tsx`
- `storefront/src/app/checkout/page.tsx`
- `storefront/src/app/checkout/success/page.tsx`
- `storefront/src/app/account/orders/page.tsx`
- `storefront/src/components/product/ProductView.tsx`
- `storefront/src/components/products/ProductCard.tsx`

## 12. Benchmark references

- Shopify Help Center: Pre-orders
- Shopify Help Center: Managing orders
- Shopify Help Center: Understanding order statuses
- Shopify Help Center: Editing orders
- Shopify Help Center: Managing order details
- Shopify Help Center: Fraud analysis
- Shopify Help Center: Customer accounts

