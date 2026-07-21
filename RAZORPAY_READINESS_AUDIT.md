# Razorpay Readiness Audit

## 1. Canonical/Domain Bug
- **Root cause (which file, hardcoded vs dynamic)**:
  Canonical and OpenGraph URLs are constructed dynamically in `src/lib/seo.ts`. It uses `const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://odhvica.com';`.
- **Is NEXT_PUBLIC_SITE_URL used anywhere or is everything hardcoded?**
  Yes, `NEXT_PUBLIC_SITE_URL` is used in `src/lib/seo.ts` to build dynamic URLs. However, in `.env.production`, `NEXT_PUBLIC_SITE_URL` is **NOT defined**. As a result, all production URLs fallback to the hardcoded `https://odhvica.com` instead of the correct domain (`kvastram.com`), causing the canonical domain bug.
- **Fix complexity estimate**:
  Very low. Just add `NEXT_PUBLIC_SITE_URL=https://kvastram.com` to `.env.production` (and the server environment) and rebuild the site.

## 2. Razorpay Integration Status
- **Is SDK installed? (yes/no + version)**:
  - **Frontend**: The SDK is NOT in `package.json`. It is loaded dynamically via CDN in `src/components/checkout/RazorpayButton.tsx` (`https://checkout.razorpay.com/v1/checkout.js`).
  - **Backend**: The `razorpay` NPM package is installed and used (e.g., in `refund-service.ts` and `payments-razorpay.ts`).
- **Is it test mode or live mode currently?**
  It is configured for **Live mode** but uses a dummy key. `.env.production` contains: `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID_HERE`.
- **Where does order creation happen — client or server? (server-side is mandatory, flag if client-side)**
  **Server-side.** In `RazorpayButton.tsx`, the client calls the backend API endpoint (`${API_URL}/store/payments/razorpay/create-order`) to generate the secure order ID before opening the popup.
- **Is webhook signature verification implemented? (yes/no)**
  **Yes.** The backend `index.ts` handles webhook timeouts, and the respective payment routers (`payments-razorpay.ts`, `payments.ts`) verify signatures to ensure authenticity.
- **Any exposed secrets found in git history or current files? (CRITICAL if yes)**
  No production Razorpay secrets were found in the current files or `.env` files. The `.env.production` file correctly leaves secrets blank or uses dummy placeholders (`rzp_live_YOUR_KEY_ID_HERE`).

## 3. Pricing Data
- **Is ₹5,000 uniform price hardcoded/seed data, or genuinely set per-product in DB by admin?**
  The ₹5,000 price is **genuinely set in the DB**, not hardcoded in the frontend or fallback logic. 
  The frontend fetches the actual prices via `product.variants?.[0]?.prices`. Backend seed data (e.g., `seed-luxury.ts`) contains diverse prices (like `priceINR: 2500000` / ₹25,000). 
- **Source of the data**
  The API (Database). If all products display as ₹5,000, it means the admin/seed data in the database literally set them all to ₹5,000 (500000 paise) upon creation.

## Summary table

| Item | Status | Risk Level |
|------|--------|------------|
| Canonical URL Bug | Fallback `odhvica.com` used because env var is missing | High (SEO impact) |
| Razorpay SDK | Dynamic CDN (frontend), NPM package (backend) | Low |
| Razorpay Environment | Live Mode (dummy keys present) | Low (Needs actual keys before launch) |
| Order Creation | Server-side API endpoint | Low (Secure) |
| Webhook Verification | Implemented | Low (Secure) |
| Exposed Secrets | None found for Razorpay | Low |
| Uniform Pricing (₹5K) | From Database / Admin entry | Low (Data issue, not code issue) |
