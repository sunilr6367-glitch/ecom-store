# Odhvica Razorpay Production Setup Guide

Last verified: 2026-06-30

## 1. Scope and current limitation

This guide covers:

- Razorpay Live Mode credentials for Indian INR checkout.
- Production webhook configuration.
- Deployment and verification on the Hostinger VPS.
- The additional engineering work required before Razorpay can replace PayPal for international checkout.

Important: Razorpay international payments being enabled on the merchant account does not automatically make Odhvica's international checkout work. The current application routes only INR orders to Razorpay and rejects non-INR Razorpay orders in the backend.

## 2. Current Odhvica payment flow

1. Storefront creates an Odhvica draft order with `POST /store/checkout/place-order`.
2. Storefront calls `POST /store/payments/razorpay/create-order` using the Odhvica order ID and checkout token.
3. Backend creates the Razorpay order using server-side credentials.
4. Razorpay Checkout returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
5. Storefront sends those values to `POST /store/payments/razorpay/verify`.
6. Backend verifies the signature, fetches the payment from Razorpay, checks amount/currency/order ownership, captures an authorized payment when needed, and marks the Odhvica order paid.
7. Webhooks provide the asynchronous source of truth for captured, failed, and refunded payments.

Production endpoints:

```text
Storefront: https://odhvica.com
API:        https://api.odhvica.com
Webhook:    https://api.odhvica.com/store/payments/razorpay/webhook
Health:     https://api.odhvica.com/health
```

## 3. Generate Live Mode keys

In the Razorpay Dashboard:

1. Confirm the account and `odhvica.com` website are activated/whitelisted.
2. Switch the Dashboard to **Live Mode**.
3. Open **Account & Settings -> API Keys -> Generate Key**.
4. Securely store both values immediately:
   - Key ID: normally starts with `rzp_live_`.
   - Key Secret: shown only when generated.
5. Do not reuse the API Key Secret as the webhook secret.

Security contract:

| Value | Public? | Production destination |
|---|---:|---|
| Razorpay Key ID | Yes | Backend and storefront build |
| Razorpay Key Secret | No | Backend only |
| Webhook Secret | No | Backend only and Razorpay webhook configuration |

Never commit these values, paste them into tickets/chat, or print them in deployment logs.

Official reference: [Razorpay API Keys](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/)

## 4. Configure production environment files

The production checkout is `/root/odhvica-ecommerce`. Its ignored environment files survive Git deploy resets and are the current source for payment credentials.

Open these files interactively on the VPS so secrets are not stored in shell history.

### Backend credentials

Edit:

```text
/root/odhvica-ecommerce/backend/.env.production
```

Set:

```dotenv
RAZORPAY_KEY_ID=rzp_live_replace_with_live_key_id
RAZORPAY_KEY_SECRET=replace_with_live_key_secret
RAZORPAY_WEBHOOK_SECRET=replace_with_a_separate_random_webhook_secret
```

### Storefront public key

Edit:

```text
/root/odhvica-ecommerce/storefront/.env.production
```

Set:

```dotenv
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_replace_with_the_same_live_key_id
```

The Key ID must match `RAZORPAY_KEY_ID`. The backend also accepts the legacy `RAZORPAY_ID` and `RAZORPAY_SECRET` names so existing deployments keep working. The storefront key is baked into the client bundle during Docker build, so changing the file without rebuilding the storefront is not sufficient.

`deploy/hostinger/deploy.sh` copies `NEXT_PUBLIC_RAZORPAY_KEY_ID` into the Compose build environment automatically.

## 5. Configure payment capture

In Live Mode, open **Account & Settings -> Payment Capture** and enable automatic capture unless the business explicitly requires manual capture.

Odhvica verifies every successful client callback server-side and also handles `payment.authorized`/`payment.captured` webhooks. Fulfilment must begin only after the local order has `payment_status='captured'`.

Official reference: [Razorpay Standard Checkout go-live checklist](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)

## 6. Configure the Live Mode webhook

In Razorpay Live Mode:

1. Open **Account & Settings -> Webhooks -> Add New Webhook**.
2. URL:

   ```text
   https://api.odhvica.com/store/payments/razorpay/webhook
   ```

3. Enter the same separate secret stored as `RAZORPAY_WEBHOOK_SECRET`.
4. Add an alert email monitored by the Odhvica team.
5. Enable these events because the current backend handles them:

   ```text
   payment.authorized
   payment.captured
   payment.failed
   order.paid
   refund.created
   refund.processed
   refund.failed
   ```

6. Save and enable the webhook.

The backend validates the HMAC-SHA256 signature over the raw request body and deduplicates events using `x-razorpay-event-id`.

Official references:

- [Set up Razorpay webhooks](https://razorpay.com/docs/webhooks/setup-edit-payments/)
- [Validate and test webhooks](https://razorpay.com/docs/webhooks/validate-test/)

## 7. Deploy through GitHub Actions

Do not run a manual `docker compose up` deployment. Production deploys only through `.github/workflows/deploy-hostinger.yml` and `/root/odhvica-ecommerce`.

After updating the ignored production env files:

1. Open the repository's **Actions** tab.
2. Select **Deploy to Hostinger VPS**.
3. Choose **Run workflow** on `main`.
4. Wait for the quality and deploy jobs to succeed.
5. Confirm the deployed SHA:

   ```powershell
   Invoke-RestMethod https://api.odhvica.com/health
   ```

6. Confirm `data.gitSha` equals the intended `origin/main` commit.

## 8. Verify configuration without exposing secrets

Run on the VPS after deployment:

```bash
cd /root/odhvica-ecommerce/deploy/hostinger

docker compose exec -T backend node -e "for (const k of ['RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET']) console.log(k, process.env[k] ? 'CONFIGURED' : 'MISSING')"

grep '^NEXT_PUBLIC_RAZORPAY_KEY_ID=' ../../storefront/.env.production \
  | sed 's/=.*/=CONFIGURED/'
```

Expected:

```text
RAZORPAY_KEY_ID CONFIGURED
RAZORPAY_KEY_SECRET CONFIGURED
RAZORPAY_WEBHOOK_SECRET CONFIGURED
NEXT_PUBLIC_RAZORPAY_KEY_ID=CONFIGURED
```

Do not run `printenv RAZORPAY_KEY_SECRET` or include env file contents in screenshots/logs.

## 9. INR go-live smoke test

Use a low-value dedicated test product with stock greater than one.

1. Open checkout in a clean/incognito browser.
2. Select India and an Indian shipping address.
3. Confirm region is India, currency is INR, and shipping options load.
4. Click **Continue to Payment** once.
5. Confirm the Razorpay button appears and the popup opens.
6. Complete one real low-value payment using an approved payment method.
7. Confirm all three systems agree:
   - Razorpay Dashboard payment status is `captured`.
   - Odhvica order `payment_status` is `captured`.
   - Odhvica order status is `completed` and not `draft`/`failed`.
8. Confirm exactly one inventory unit was deducted.
9. Confirm the webhook returns HTTP 2xx and is marked delivered in Razorpay.
10. Initiate a controlled refund and verify `refund.created` then `refund.processed` update the Odhvica order.

Never fulfil an order based only on the browser success screen. Require server-side signature verification and captured status.

## 10. Troubleshooting matrix

| Symptom | Most likely cause | Check |
|---|---|---|
| `401 Authentication failed` from Razorpay | Wrong/revoked key pair or Test/Live mismatch | Regenerate the pair in the correct mode; update backend ID and secret together |
| Razorpay button absent | Storefront public key missing at build time | Update storefront env and rerun the deployment workflow |
| `Razorpay not configured` | Backend ID or secret missing | Check backend env presence and redeploy |
| Checkout popup opens but verification fails | Secret mismatch, tampered IDs, or wrong stored Razorpay order | Backend logs around `/razorpay/verify`; do not mark paid manually |
| Webhook returns `400 Invalid signature` | Webhook secret mismatch or rotated secret | Dashboard webhook secret must exactly match backend webhook secret |
| Webhook returns `500 Webhook not configured` | Backend webhook secret missing | Set `RAZORPAY_WEBHOOK_SECRET` and redeploy backend |
| Payment remains `authorized` | Capture settings or capture API failure | Dashboard capture setting and backend logs |
| Payment captured in Razorpay but local order unpaid | Webhook/callback failed | Razorpay delivery logs, API logs, and local order metadata |

## 11. International Razorpay rollout

### Dashboard requirements

1. Confirm Razorpay has enabled international payments for the account, not only normal Live Mode payments.
2. Confirm the approved card networks, countries, purpose code/export category, currencies, settlement cycle, and fees.
3. Confirm each currency against Razorpay's supported-currency list. Do not assume every Odhvica region currency is supported.
4. International payments for an India merchant settle in INR even when native supported currency is passed to Checkout.

Official references:

- [Razorpay international payments](https://razorpay.com/docs/payments/international-payments/)
- [International payments FAQ](https://razorpay.com/docs/payments/international-payments/faqs/?preferred-country=IN)

### Current code blockers

International checkout through Razorpay must not be enabled until these are changed and tested:

1. Backend currently rejects every non-INR Razorpay order in `backend/src/routes/store/payments-razorpay.ts`.
2. Storefront considers Razorpay active only when currency is INR in `storefront/src/app/checkout/page.tsx`.
3. Razorpay payment UI renders only for INR and passes `currency="INR"` as a fixed value.
4. Existing seeded products currently have India/INR prices only. Every sellable variant needs an exact price row for each enabled region/currency.
5. Currency minor-unit exponents vary. Most currencies use 2 decimals, but currencies such as JPY use 0 and BHD uses 3. Amount storage, display, conversion, Orders API requests, refunds, and reconciliation must use the correct exponent.
6. The allowed shipping country list must include each launched destination.
7. International phone numbers sent to Razorpay should use E.164 format, including country code.

### Recommended rollout order

1. Launch and verify Live INR payments.
2. Fix the known order/stock and OTP enforcement defects listed below.
3. Add one international pilot region, normally USD, with real region-specific prices.
4. Update backend and storefront currency routing.
5. Test successful, failed, cancelled, webhook-delayed, refund, and duplicate-webhook paths in Test Mode.
6. Obtain Razorpay confirmation that the pilot currency is active in Live Mode.
7. Run one low-value real international transaction.
8. Reconcile Razorpay native amount, Odhvica amount, fees, exchange rate, and INR settlement.
9. Expand currencies one at a time.

## 12. Mandatory application fixes before broad live traffic

The 2026-06-30 production audit identified these independent blockers. Razorpay activation does not fix them:

1. Guest OTP is currently enforced by the frontend but not by `POST /store/checkout/place-order`. A direct API caller can create an order for an unverified email.
2. Checkout creates orders with `payment_status='unpaid'`, but expired inventory cleanup selects only `awaiting` and `failed`. Abandoned unpaid orders can permanently consume stock.
3. The frontend tax preview endpoint `/store/checkout/tax` returns 404 and falls back to client calculation.
4. Until international Razorpay routing is deployed, non-INR checkout has no working provider when PayPal is unconfigured and Stripe is disabled.

Do not treat a successful Razorpay account activation as production checkout sign-off until these items have their own fixes and regression tests.

## 13. Final acceptance checklist

- [ ] Live Key ID starts with `rzp_live_`.
- [ ] Backend Key ID and storefront Key ID match.
- [ ] Key Secret exists only on the backend.
- [ ] Separate webhook secret configured in Razorpay and backend.
- [ ] Production domain is verified/whitelisted.
- [ ] Auto-capture decision is explicitly configured.
- [ ] Required webhook events are enabled.
- [ ] GitHub Actions deployment succeeded.
- [ ] `/health` reports the intended Git SHA.
- [ ] INR payment initializes without 401/500.
- [ ] Signature verification succeeds.
- [ ] Razorpay and Odhvica both report `captured`.
- [ ] Inventory changes exactly once.
- [ ] Failed payments release inventory.
- [ ] Refund webhook updates the local order.
- [ ] No key secret appears in logs, Git, screenshots, or browser bundles.
- [ ] International code/data blockers are resolved before enabling non-INR traffic.
