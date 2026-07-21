# Odhvica Typography Audit
**Date:** 2026-06-24
**Status:** Audit Only (No Fixes Applied)

## Current Token Scale (from `tokens.css`)
**Display (Fluid Heading Scale)**
- `--ds-text-display-xl`: `clamp(2.25rem, 4vw, 4.25rem)`
- `--ds-text-display-lg`: `clamp(1.875rem, 3.1vw, 3.125rem)`
- `--ds-text-display-md`: `clamp(1.5rem, 2.2vw, 2.25rem)`
- `--ds-text-display-sm`: `clamp(1.2rem, 1.45vw, 1.5rem)`

**Body (Static Text Scale)**
- `--ds-text-body-xl`: `clamp(1rem, 1vw, 1.125rem)`
- `--ds-text-body-lg`: `1rem`
- `--ds-text-body-md`: `0.9375rem`
- `--ds-text-body-sm`: `0.875rem`
- `--ds-text-body-xs`: `0.75rem`

**Micro**
- `--ds-text-count-xs`: `0.625rem`

---

## Usage Inconsistencies Found

| Component | Element | Current Class | Should Be | Issue |
|-----------|---------|---------------|-----------|-------|
| `account/page.tsx` | `<h3>` | `.account-kicker` (`--ds-text-body-xs`) | `<p>` or `<span>` | Using a semantic `H3` heading tag for a tiny uppercase kicker label. |
| `cart/page.tsx` | `<h2>` | `text-[var(--ds-text-body-sm)]` | `<p>` or `<span>` | Using an `H2` tag for small body text. |
| `cart/page.tsx` | `<h3>` | `text-[var(--ds-text-body-md)]` | `text-[var(--ds-text-display-sm)]` | `H3` is using regular body sizing instead of a heading token. |
| `account/orders/[id]/page.tsx` | `<h3>` | `.account-form-label` (`--ds-text-body-xs`) | `<label>` or `<p>` | Form labels are being rendered as `H3` tags. |

---

## Heading Hierarchy Issues

The audit revealed severe semantic inconsistency across heading tags. Semantic HTML tags (`H1`-`H3`) are currently being decoupled from visual hierarchy. 

**H1 (3 distinct sizes used):**
- Used as `text-[var(--ds-text-display-xl)]` (About, Bestsellers)
- Used as `text-[var(--ds-text-display-lg)]` (Cart, Checkout, Collections)
- Used as `.account-page-title` (`--ds-text-display-md`) (Account)

**H2 (6 distinct sizes used):**
- Used as `text-[var(--ds-text-display-xl)]` (About)
- Used as `text-[var(--ds-text-display-lg)]` (Checkout)
- Used as `text-[var(--ds-text-display-sm)]` (Bestsellers)
- Used as `text-[var(--ds-text-body-xl)]` (Cart)
- Used as `text-[var(--ds-text-body-sm)]` (Cart)
- Used as `.account-kicker` (`--ds-text-body-xs`) (Account profile)

**H3 (5 distinct sizes used):**
- Used as `text-[var(--ds-text-body-xl)]` (Checkout)
- Used as `text-[var(--ds-text-body-lg)]` (About)
- Used as `text-[var(--ds-text-body-md)]` (Cart)
- Used as `text-[var(--ds-text-body-sm)]` (Cart)
- Used as `.account-form-label` (`--ds-text-body-xs`) (Orders)

---

## Raw Tailwind Usage (Needs Token Replacement)

**0 usages found.** 
The codebase is successfully migrated. Every instance of typography scaling is utilizing a `--ds-text-*` token (e.g., `text-[var(--ds-text-display-xl)]`) or mapping through the typography.css layer (`.account-page-title`). There are zero raw Tailwind `text-xl`, `text-2xl`, etc. classes present in `src/`.

---

## Recommended Type Scale

To fix the heading hierarchy inconsistencies, we recommend strictly enforcing the following contract between HTML tags and Design System tokens:

- **H1** → `text-[var(--ds-text-display-xl)]` (Homepage/Hero) or `text-[var(--ds-text-display-lg)]` (Inner pages)
- **H2** → `text-[var(--ds-text-display-md)]`
- **H3** → `text-[var(--ds-text-display-sm)]`
- **Body Large** → `text-[var(--ds-text-body-lg)]`
- **Body Regular** → `text-[var(--ds-text-body-md)]`
- **Body Small** → `text-[var(--ds-text-body-sm)]`
- **UI Labels (Kickrs, Badges)** → `text-[var(--ds-text-body-xs)]` (Use `<p>` or `<span>`, NOT `H2`/`H3`)
- **Captions** → `text-[var(--ds-text-count-xs)]`
