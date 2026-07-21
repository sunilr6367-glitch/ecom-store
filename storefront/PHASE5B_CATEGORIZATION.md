# Phase 5B: PDP CSS Categorization Report

## STEP 4 — Summary counts
- Total values: 110
- Category A (fixable now): 20
- Category B (needs new token): 25
- Category C (intentional, no change): 65

## Categorization Table

| Line | Current Value | Selector Context | Category | Proposed Fix |
|------|---------------|-------------------|----------|---------------|
| 21 | `padding-bottom: 96px;` | `.pdp-page` | C | No change — layout-specific bottom clearance |
| 31 | `min-height: 44px;` | `.related-products-link` | C | No change — specific button tap target |
| 38 | `padding: 0 20px;` | `.related-products-link` | B | `--ds-btn-px: 20px` (frequent button padding) |
| 55 | `outline-offset: 2px;` | `.related-products-link:focus-visible` | C | No change — focus ring standard |
| 63 | `grid-template-columns: 36px minmax(0, 1fr) auto;` | `.pdp-mobile-nav` | C | No change — structural layout |
| 65 | `min-height: 48px;` | `.pdp-mobile-nav` | C | No change — mobile sticky nav height |
| 66 | `padding: 0 12px;` | `.pdp-mobile-nav` | B | `--ds-space-sm-md: 12px` (intermediate step) |
| 68 | `background: rgba(var(--ds-cream-rgb), 0.96);` | `.pdp-mobile-nav` | C | No change — alpha transparency layer |
| 69 | `backdrop-filter: blur(12px);` | `.pdp-mobile-nav` | B | `--ds-blur-md: 12px` |
| 88 | `width: 32px;` | `.pdp-nav-icon, .pdp-cart-icon` | C | No change — exact icon container size |
| 89 | `height: 32px;` | `.pdp-nav-icon, .pdp-cart-icon` | C | No change — exact icon container size |
| 96 | `gap: 2px;` | `.pdp-mobile-nav-actions` | C | No change — micro-spacing |
| 100 | `width: 32px;` | `.pdp-nav-share button` | C | No change — exact icon container size |
| 101 | `height: 32px;` | `.pdp-nav-share button` | C | No change — exact icon container size |
| 112 | `top: 3px;` | `.pdp-cart-icon span` | C | No change — absolute badge offset |
| 113 | `right: 1px;` | `.pdp-cart-icon span` | C | No change — absolute badge offset |
| 115 | `width: 14px;` | `.pdp-cart-icon span` | C | No change — specific badge dimension |
| 116 | `height: 14px;` | `.pdp-cart-icon span` | C | No change — specific badge dimension |
| 118 | `border-radius: 999px;` | `.pdp-cart-icon span` | A | `var(--ds-radius-pill)` |
| 149 | `right: 14px;` | `.pdp-gallery-wishlist` | C | No change — absolute floating offset |
| 150 | `top: 14px;` | `.pdp-gallery-wishlist` | C | No change — absolute floating offset |
| 160 | `width: 5px;` | `.pdp-gallery-dot` | C | No change — carousel micro-indicator |
| 161 | `height: 5px;` | `.pdp-gallery-dot` | C | No change — carousel micro-indicator |
| 163 | `border-radius: 999px;` | `.pdp-gallery-dot` | A | `var(--ds-radius-pill)` |
| 169 | `width: 14px;` | `.pdp-gallery-dot.active` | C | No change — active dot width expansion |
| 174 | `padding: 18px 0 0;` | `.pdp-buy-box` | B | `--ds-space-18: 18px` (common spacing size) |
| 178 | `margin: 8px 0 12px;` | `.pdp-title` | B | `--ds-space-12: 12px` (intermediate vertical step) |
| 180 | `font-size: clamp(1rem, 1.15vw, 1.25rem);` | `.pdp-title` | A | `var(--ds-text-display-sm)` |
| 188 | `min-height: 24px;` | `.pdp-stock-label` | C | No change — specific label size |
| 191 | `padding: 0 9px;` | `.pdp-stock-label` | C | No change — micro-padding for label |
| 198 | `gap: 8px;` | `.pdp-rating-row` | A | `var(--ds-space-xs)` |
| 202 | `margin: 14px 0 10px;` | `.pdp-price-row` | B | `--ds-space-14: 14px` and `--ds-space-10: 10px` |
| 218 | `margin: 0 0 18px;` | `.pdp-availability-note` | B | `--ds-space-18: 18px` |
| 225 | `margin-bottom: 14px;` | `.pdp-variant-block` | B | `--ds-space-14: 14px` |
| 229 | `gap: 6px;` | `.pdp-option-head` | C | No change — micro spacing |
| 246 | `gap: 4px;` | `.pdp-size-guide` | C | No change — micro spacing |
| 248 | `min-height: 30px;` | `.pdp-size-guide` | C | No change — button dimension |
| 249 | `border-radius: 999px;` | `.pdp-size-guide` | A | `var(--ds-radius-pill)` |
| 253 | `width: 26px;` | `.pdp-color-swatch` | C | No change — exact swatch sizing |
| 254 | `height: 26px;` | `.pdp-color-swatch` | C | No change — exact swatch sizing |
| 256 | `border-radius: 999px;` | `.pdp-color-swatch` | A | `var(--ds-radius-pill)` |
| 273 | `min-height: 36px;` | `.pdp-option-button` | C | No change — button dimension |
| 274 | `padding: 0 14px;` | `.pdp-option-button` | B | `--ds-space-14: 14px` |
| 297 | `min-width: 76px;` | `.pdp-size-pill` | C | No change — exact pill width |
| 298 | `min-height: 44px;` | `.pdp-size-pill` | C | No change — button tap target |
| 299 | `border-radius: 999px;` | `.pdp-size-pill` | A | `var(--ds-radius-pill)` |
| 314 | `min-height: 40px;` | `.pdp-quantity-value` | C | No change — specific input dimension |
| 315 | `min-width: 40px;` | `.pdp-quantity-value` | C | No change — specific input dimension |
| 329 | `gap: 8px;` | `.pdp-primary-cta, .pdp-buy-now, ...` | A | `var(--ds-space-xs)` |
| 330 | `min-height: 46px;` | `.pdp-primary-cta, .pdp-buy-now, ...` | C | No change — primary CTA standard height |
| 362 | `min-height: 46px;` | `.pdp-link-button` | C | No change — matched CTA height |
| 365 | `gap: 8px;` | `.pdp-link-button` | A | `var(--ds-space-xs)` |
| 369 | `padding: 0 28px;` | `.pdp-link-button` | B | `--ds-btn-px-lg: 28px` |
| 400 | `gap: 6px;` | `.pdp-service-lines` | C | No change — micro spacing |
| 401 | `margin-top: 18px;` | `.pdp-service-lines` | B | `--ds-space-18: 18px` |
| 409 | `gap: 1px;` | `.pdp-buyer-confidence` | C | No change — 1px divider gap |
| 410 | `margin-top: 18px;` | `.pdp-buyer-confidence` | B | `--ds-space-18: 18px` |
| 419 | `gap: 10px;` | `.pdp-buyer-confidence-item` | C | No change — layout spacing |
| 420 | `padding: 12px;` | `.pdp-buyer-confidence-item` | B | `--ds-space-12: 12px` |
| 425 | `margin-top: 2px;` | `.pdp-buyer-confidence-item svg` | C | No change — optical icon alignment |
| 439 | `margin: 4px 0 0;` | `.pdp-buyer-confidence-item p` | C | No change — micro spacing |
| 446 | `margin-top: 22px;` | `.pdp-summary-description` | B | `--ds-space-22: 22px` |
| 448 | `padding-top: 18px;` | `.pdp-summary-description` | B | `--ds-space-18: 18px` |
| 464 | `gap: 24px;` | `.pdp-detail-grid` | A | `var(--ds-space-md)` |
| 465 | `margin-top: 48px;` | `.pdp-detail-grid` | A | `var(--ds-space-xl)` |
| 484 | `grid-template-columns: 24px minmax(0, 1fr) 20px;` | `.pdp-accordion-trigger` | C | No change — grid layout for accordion |
| 485 | `gap: 12px;` | `.pdp-accordion-trigger` | B | `--ds-space-12: 12px` |
| 490 | `padding: 18px 0;` | `.pdp-accordion-trigger` | B | `--ds-space-18: 18px` |
| 503 | `width: 22px;` | `.pdp-accordion-icon` | C | No change — specific icon boundary |
| 504 | `height: 22px;` | `.pdp-accordion-icon` | C | No change — specific icon boundary |
| 531 | `padding: 0 0 22px 32px;` | `.pdp-accordion-content` | B | `--ds-space-22: 22px` / `--ds-space-lg: 32px` |
| 541 | `margin-top: 28px;` | `.pdp-spec-card` | B | `--ds-space-28: 28px` |
| 543 | `padding-top: 22px;` | `.pdp-spec-card` | B | `--ds-space-22: 22px` |
| 548 | `margin-bottom: 8px;` | `.pdp-spec-card .pdp-trust-label` | A | `var(--ds-space-xs)` |
| 566 | `padding: 12px 0;` | `.pdp-spec-cell` | B | `--ds-space-12: 12px` |
| 580 | `margin-top: 18px;` | `.pdp-review-summary` | B | `--ds-space-18: 18px` |
| 582 | `padding-top: 16px;` | `.pdp-review-summary` | A | `var(--ds-space-sm)` |
| 587 | `grid-template-columns: 20px 1fr;` | `.pdp-verified-card` | C | No change — specific column size |
| 588 | `gap: 6px 8px;` | `.pdp-verified-card` | C | No change — specific micro-gap |
| 589 | `margin-top: 18px;` | `.pdp-verified-card` | B | `--ds-space-18: 18px` |
| 591 | `padding-top: 16px;` | `.pdp-verified-card` | A | `var(--ds-space-sm)` |
| 597 | `gap: 2px;` | `.pdp-review-summary > div:first-child` | C | No change — micro-spacing |
| 598 | `margin-bottom: 14px;` | `.pdp-review-summary > div:first-child` | B | `--ds-space-14: 14px` |
| 614 | `grid-template-columns: 28px 1fr 38px;` | `.pdp-review-meter` | C | No change — structural meter grid |
| 616 | `gap: 8px;` | `.pdp-review-meter` | A | `var(--ds-space-xs)` |
| 617 | `margin: 8px 0;` | `.pdp-review-meter` | A | `var(--ds-space-xs)` |
| 624 | `height: 8px;` | `.pdp-review-meter i` | C | No change — exact progress bar height |
| 626 | `border-radius: 999px;` | `.pdp-review-meter i` | A | `var(--ds-radius-pill)` |
| 654 | `padding-top: 18px;` | `.pdp-review-sidebar .border-t` | B | `--ds-space-18: 18px` |
| 668 | `padding: 18px;` | `.pdp-review-sidebar form` | B | `--ds-space-18: 18px` |
| 676 | `padding-bottom: max(10px, ...)` | `.pdp-sticky-bar` | C | No change — env safe-area hack |
| 684 | `@media (max-width: 767px)` | `(media query)` | C | No change — media query |
| 692 | `padding-left: 16px;` | `.pdp-buy-box, .pdp-detail-grid` | A | `var(--ds-space-sm)` |
| 693 | `padding-right: 16px;` | `.pdp-buy-box, .pdp-detail-grid` | A | `var(--ds-space-sm)` |
| 705 | `margin-top: 28px;` | `.pdp-detail-grid` | B | `--ds-space-28: 28px` |
| 709 | `padding: 14px 0;` | `.pdp-accordion-trigger` | B | `--ds-space-14: 14px` |
| 713 | `padding-bottom: 18px;` | `.pdp-accordion-content` | B | `--ds-space-18: 18px` |
| 721 | `@media (min-width: 768px)` | `(media query)` | C | No change — media query |
| 732 | `padding-top: 24px;` | `.pdp-container` | A | `var(--ds-space-md)` |
| 740 | `@media (min-width: 1024px)` | `(media query)` | C | No change — media query |
| 768 | `top: 86px;` | `.pdp-buy-box` | C | No change — specific sticky offset |
| 774 | `grid-template-columns: minmax(0, 1.18fr) ...` | `.pd-layout` | C | No change — structural grid ratio |
| 775 | `gap: 48px;` | `.pd-layout` | A | `var(--ds-space-xl)` (approx 48px base) |
| 780 | `min-height: 640px;` | `.pdp-gallery-frame-desktop` | C | No change — gallery dimension bounds |
| 784 | `max-height: 320px;` | `.pdp-summary-description` | C | No change — read-more clipping bound |
| 789 | `grid-template-columns: minmax(0, 1.55fr) ...` | `.pdp-detail-grid` | C | No change — structural grid ratio |
| 790 | `gap: 44px;` | `.pdp-detail-grid` | C | No change — custom desktop gap |
| 792 | `margin-top: 56px;` | `.pdp-detail-grid` | C | No change — custom section gap |
| 797 | `top: 86px;` | `.pdp-review-sidebar` | C | No change — specific sticky offset |
| 806 | `border-radius: 8px 8px 0 0;` | `.pdp-sticky-bar` | A | `var(--ds-radius-md) var(--ds-radius-md) 0 0` |
