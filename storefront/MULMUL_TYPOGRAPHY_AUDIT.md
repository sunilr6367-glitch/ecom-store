# Mulmul Typography Audit and Execution Plan

> **Status:** Incorporated into `docs/design-system/storefront-design-system-v1.md`. Use the canonical v1 file for implementation rules.

## Reference Audit

- shopmulmul.com presents a restrained fashion-commerce typography system: clean sans-serif text, uppercase navigation/category labels, compact product metadata, and limited decorative type.
- The strongest reusable pattern is not a serif editorial system. It is a single-family sans system with weight, case, spacing, and hierarchy doing most of the work.
- Product and navigation surfaces should feel light and scannable: medium-weight labels, generous uppercase tracking, and calmer heading scale.

## Codebase Audit

- `storefront/src/app/layout.tsx` was the font-loading source of truth.
- `storefront/src/app/globals.css` already centralized typography via `--font-display`, `--font-body`, type-scale, weight, line-height, and tracking tokens.
- Many components use `font-serif`, `font-heading`, `font-body`, and tokenized sizes, so the safest adoption path is updating the global font aliases rather than rewriting every component.
- Legacy global CSS still contained a few viewport-based typography values; the touched typography-specific values were normalized to token or fixed clamps.

## Execution

- Replaced the Cormorant Garamond + DM Sans pair with a Mulmul-like single sans family using `Montserrat` from `next/font/google`.
- Mapped both display and body aliases to the same sans family so existing `font-serif` and `font-heading` usages now render in the cleaner Mulmul-like voice.
- Updated Tailwind font aliases so `heading`, `display`, `serif`, `sans`, and `body` remain compatible with existing component classes.
- Removed negative tracking from the global token and reduced the display scale so headings are less ornamental and closer to fashion retail typography.

## Verification Plan

- Run `npm run lint` in `storefront`.
- Run `npm run build` in `storefront`.
- Start the storefront and visually compare homepage, catalog, PDP, cart, and mobile header typography.
- Push to GitHub after verification.
- Deploy to VPS using the repo deployment flow in `deploy/hostinger`.
