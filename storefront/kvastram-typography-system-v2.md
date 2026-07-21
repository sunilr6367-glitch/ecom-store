# Odhvica Typography System — v2 (Complete)
## Claude Code Implementation Guide

> **Status:** Superseded. Use `docs/design-system/storefront-design-system-v1.md` for the active storefront typography system. The active direction is Mulmul-inspired restrained sans commerce, with TERRACOTTA as the final accent token.

> Paste this file as context to Claude Code and say:
> "Implement the Odhvica Typography System v2 across the entire codebase."

---

## 1. FONTS

| Role | Font | Google Fonts Import Name |
|---|---|---|
| Display / Headings / Editorial | `Cormorant Garamond` | `Cormorant_Garamond` |
| Body / UI / Data / Forms | `DM Sans` | `DM_Sans` |

### `app/layout.tsx`

```tsx
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 2. COMPLETE CSS VARIABLES — `globals.css`

Replace or merge into your `:root`. Every single value in the codebase must come from here — no hardcoded font-size, color, or spacing values anywhere.

```css
:root {

  /* ============================================================
     FONTS
  ============================================================ */
  --font-display : 'Cormorant Garamond', Georgia, serif;
  --font-body    : 'DM Sans', system-ui, sans-serif;


  /* ============================================================
     TYPE SCALE — fluid with clamp()
     clamp(MIN, FLUID, MAX)
     MIN  = mobile size
     FLUID = scales between breakpoints (use 2.5vw–4vw range)
     MAX  = desktop size
  ============================================================ */

  /* Display — Cormorant Garamond only */
  --text-display-xl : clamp(2.5rem,  5vw,   4rem);    /* Hero headline */
  --text-display-lg : clamp(2rem,    3.5vw, 3rem);    /* Page hero heading */
  --text-display-md : clamp(1.625rem,2.5vw, 2.25rem); /* Section h2 */
  --text-display-sm : clamp(1.375rem,2vw,   1.75rem); /* Sub-section h3 */

  /* Body — DM Sans only */
  --text-body-xl : clamp(1rem,    1.2vw, 1.125rem); /* Product description */
  --text-body-lg : clamp(0.9375rem,1vw,  1rem);     /* Nav, buttons */
  --text-body-md : clamp(0.875rem, 1vw,  0.9375rem);/* Product card name */
  --text-body-sm : clamp(0.8125rem,0.9vw,0.875rem); /* Price, tags */
  --text-body-xs : clamp(0.6875rem,0.8vw,0.75rem);  /* Meta, badges, counts */


  /* ============================================================
     FONT WEIGHTS
  ============================================================ */
  --weight-light    : 300;
  --weight-regular  : 400;
  --weight-medium   : 500;
  --weight-semibold : 600;
  --weight-bold     : 700;


  /* ============================================================
     LINE HEIGHTS
  ============================================================ */
  --leading-tight   : 1.1;  /* Large display headings */
  --leading-snug    : 1.3;  /* Sub-headings, card titles */
  --leading-normal  : 1.5;  /* Nav, buttons, labels */
  --leading-relaxed : 1.7;  /* Body paragraphs, descriptions */


  /* ============================================================
     LETTER SPACING
  ============================================================ */
  --tracking-tight  : -0.02em; /* Large display headings */
  --tracking-normal :  0em;    /* Body text */
  --tracking-wide   :  0.06em; /* Labels, filter pills */
  --tracking-wider  :  0.12em; /* Eyebrow labels, UPPERCASE badges */


  /* ============================================================
     TEXT COLORS — hierarchy system
     Never use raw hex in components — always use these variables
  ============================================================ */
  --color-text-primary   : #1a1a1a;  /* Product names, headings, body */
  --color-text-secondary : #4a4a4a;  /* Supporting text, descriptions */
  --color-text-muted     : #888888;  /* Meta text, counts, timestamps */
  --color-text-disabled  : #bbbbbb;  /* Placeholder, inactive states */
  --color-text-inverse   : #ffffff;  /* Text on dark backgrounds */
  --color-text-accent    : #8b4513;  /* Brand accent (Odhvica terracotta) */
  --color-text-error     : #c0392b;  /* Form errors, out-of-stock */
  --color-text-success   : #27ae60;  /* In-stock, confirmations */
  --color-text-price     : #1a1a1a;  /* Current price — always primary */
  --color-text-price-old : #888888;  /* Struck-through original price */
  --color-text-sale      : #c0392b;  /* Sale price, discount % */


  /* ============================================================
     TEXT CONTAINERS — max-width rules
     Prevents full-width text stretch on large screens
  ============================================================ */
  --prose-width     : 65ch;   /* Body paragraphs — optimal reading */
  --heading-width   : 20ch;   /* Section headings — don't let them wrap badly */
  --caption-width   : 45ch;   /* Cards, short descriptions */
  --content-width   : 1280px; /* Page container max-width */
  --narrow-width    : 860px;  /* Centered content columns (About, PDP description) */


  /* ============================================================
     SPACING — section breathing room
  ============================================================ */
  --space-xs  : 0.5rem;   /*  8px */
  --space-sm  : 1rem;     /* 16px */
  --space-md  : 2rem;     /* 32px */
  --space-lg  : clamp(2.5rem, 5vw, 4rem);    /* 40px → 64px fluid */
  --space-xl  : clamp(3.5rem, 7vw, 6rem);    /* 56px → 96px fluid */
  --space-2xl : clamp(5rem,   9vw, 8rem);    /* 80px → 128px fluid */

}
```

---

## 3. COMPONENT TYPOGRAPHY RULES

### 3A. Announcement Bar

```css
.announcement-bar {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-medium);     /* 500 */
  letter-spacing : var(--tracking-wide);     /* 0.06em */
  line-height    : var(--leading-normal);
  color          : var(--color-text-inverse);/* white — bar is dark bg */
  text-transform : none;                     /* NOT uppercase — too noisy */
}
```

### 3B. Navigation

```css
.nav-logo {
  font-family    : var(--font-display);
  font-size      : 1.5rem;                   /* Fixed 24px — never scale logo */
  font-weight    : var(--weight-semibold);
  letter-spacing : var(--tracking-tight);
  color          : var(--color-text-primary);
}

.nav-link {
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);      /* 16px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-normal);
  line-height    : var(--leading-normal);
  color          : var(--color-text-primary);
}

.nav-link:hover {
  color          : var(--color-text-accent);
}

.nav-dropdown-item {
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-secondary);
}

.nav-icon-label {
  /* INR label, currency selector */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wide);
}
```

### 3C. Breadcrumb

```css
.breadcrumb {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-regular);
  letter-spacing : var(--tracking-wide);
  text-transform : uppercase;
  color          : var(--color-text-muted);  /* #888 — not prominent */
  line-height    : var(--leading-normal);
}

.breadcrumb-separator {
  /* The "/" between HOME / COLLECTIONS */
  color          : var(--color-text-disabled);
  margin         : 0 0.4em;
}

.breadcrumb-current {
  /* Last item — current page */
  color          : var(--color-text-secondary);
  font-weight    : var(--weight-medium);
}
```

### 3D. Section Labels + Headings

```css
.section-eyebrow {
  /* "CURATED SERIES", "SHOP ALL", "KEEP BROWSING" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wider);    /* 0.12em */
  text-transform : uppercase;
  color          : var(--color-text-muted);
  line-height    : var(--leading-normal);
}

.section-heading {
  /* "Fresh from the studio", "Customer-loved pieces" */
  font-family    : var(--font-display);
  font-size      : var(--text-display-md);   /* 26px → 36px fluid */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-tight);
  line-height    : var(--leading-tight);
  color          : var(--color-text-primary);
  max-width      : var(--heading-width);     /* Don't let it wrap weirdly */
}

.section-heading-italic {
  /* "Preserving craft, one thread at a time" — editorial */
  font-family    : var(--font-display);
  font-size      : var(--text-display-md);
  font-weight    : var(--weight-light);      /* 300 */
  font-style     : italic;
  letter-spacing : var(--tracking-tight);
  line-height    : var(--leading-snug);
  color          : var(--color-text-primary);
  max-width      : var(--heading-width);
}

.section-subheading {
  /* h3 inside a section */
  font-family    : var(--font-display);
  font-size      : var(--text-display-sm);   /* 22px → 28px fluid */
  font-weight    : var(--weight-regular);
  letter-spacing : var(--tracking-tight);
  line-height    : var(--leading-snug);
  color          : var(--color-text-primary);
}

.section-body {
  /* Short paragraph under a section heading */
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);      /* 16px */
  font-weight    : var(--weight-regular);
  line-height    : var(--leading-relaxed);
  color          : var(--color-text-secondary);
  max-width      : var(--prose-width);       /* 65ch — prevents line too long */
}
```

### 3E. Product Cards

```css
.product-card-brand {
  /* "ODHVICA" above the product name */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-regular);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-muted);
}

.product-card-name {
  font-family    : var(--font-body);
  font-size      : var(--text-body-md);      /* 14-15px */
  font-weight    : var(--weight-medium);
  line-height    : var(--leading-snug);
  letter-spacing : var(--tracking-normal);
  color          : var(--color-text-primary);
  max-width      : var(--caption-width);     /* 45ch */
  /* Always clamp to 2 lines */
  display             : -webkit-box;
  -webkit-line-clamp  : 2;
  -webkit-box-orient  : vertical;
  overflow            : hidden;
}

.product-card-price {
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-price);
  letter-spacing : var(--tracking-normal);
}

.product-card-price-original {
  font-family      : var(--font-body);
  font-size        : var(--text-body-xs);    /* 12px */
  font-weight      : var(--weight-regular);
  color            : var(--color-text-price-old);
  text-decoration  : line-through;
}

.product-card-discount {
  /* "40% OFF" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-sale);
  letter-spacing : var(--tracking-wide);
}

.product-badge {
  /* "New", "Almost Gone", "Best Seller" pill */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-semibold);
  letter-spacing : var(--tracking-wide);
  text-transform : uppercase;
  color          : var(--color-text-inverse);
  line-height    : 1;
}
```

### 3F. Product Detail Page (PDP)

```css
.pdp-collection-label {
  /* "ODHVICA COLLECTION" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-accent); /* terracotta */
}

.pdp-title {
  font-family    : var(--font-display);
  font-size      : var(--text-display-sm);   /* 22px → 28px fluid */
  font-weight    : var(--weight-medium);
  line-height    : var(--leading-snug);
  letter-spacing : var(--tracking-tight);
  color          : var(--color-text-primary);
  max-width      : var(--narrow-width);
}

.pdp-price-current {
  font-family    : var(--font-body);
  font-size      : 1.5rem;                   /* Fixed 24px — don't fluid-scale price */
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-price);
}

.pdp-price-original {
  font-family    : var(--font-body);
  font-size      : var(--text-body-md);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-price-old);
  text-decoration: line-through;
}

.pdp-description {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xl);      /* 16-18px fluid */
  font-weight    : var(--weight-regular);
  line-height    : var(--leading-relaxed);   /* 1.7 */
  color          : var(--color-text-secondary);
  max-width      : var(--prose-width);       /* 65ch — critical for readability */
}

.pdp-spec-label {
  /* "SKU:", "In Stock:", "Made in:" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-primary);
  letter-spacing : var(--tracking-normal);
}

.pdp-spec-value {
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-secondary);
}

.pdp-tab-label {
  /* "Description", "Specifications", "Returns", "Reviews" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wide);
  color          : var(--color-text-muted);
}

.pdp-tab-label-active {
  color          : var(--color-text-primary);
  font-weight    : var(--weight-semibold);
}

.pdp-trust-label {
  /* "Free shipping", "Easy returns" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-primary);
}

.pdp-trust-sublabel {
  /* "Above Rs. 999 in India", "30-day return window" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
}

.pdp-delivery-estimate {
  /* "Estimated delivery: 10-18 business days" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
}

.pdp-stock-status-in {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-success);
  letter-spacing : var(--tracking-wide);
}

.pdp-stock-status-out {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-error);
  letter-spacing : var(--tracking-wide);
}
```

### 3G. Collections Page

```css
.collections-hero-eyebrow {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-inverse);
}

.collections-hero-heading {
  font-family    : var(--font-display);
  font-size      : var(--text-display-lg);   /* 32px → 48px fluid */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-tight);
  line-height    : var(--leading-tight);
  color          : var(--color-text-inverse);
}

.collections-hero-subtext {
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);
  font-weight    : var(--weight-regular);
  line-height    : var(--leading-relaxed);
  color          : var(--color-text-inverse);
  opacity        : 0.85;
  max-width      : var(--prose-width);
}

.collection-card-name {
  font-family    : var(--font-body);
  font-size      : var(--text-body-md);      /* 15px */
  font-weight    : var(--weight-medium);
  color          : var(--color-text-primary);
}

.collection-card-count {
  /* "0 PRODUCTS", "2 PRODUCTS" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-regular);
  letter-spacing : var(--tracking-wide);
  text-transform : uppercase;
  color          : var(--color-text-inverse);
}

.collection-card-action {
  /* "VIEW COLLECTION" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-primary);
}
```

### 3H. Shop / Filter Page

```css
.shop-page-heading {
  font-family    : var(--font-display);
  font-size      : var(--text-display-lg);
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-tight);
  line-height    : var(--leading-tight);
  color          : var(--color-text-primary);
}

.shop-page-subheading {
  /* "Browse real Odhvica products..." */
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
  max-width      : var(--prose-width);
}

.filter-group-heading {
  /* "CATEGORIES", "COLLECTIONS", "TAGS" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-semibold);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-muted);
}

.filter-option {
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-secondary);
}

.filter-option-active {
  font-weight    : var(--weight-medium);
  color          : var(--color-text-primary);
}

.filter-pill {
  /* Category pills at top of shop page */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wide);
  color          : var(--color-text-primary);
}

.filter-pill-active {
  color          : var(--color-text-inverse);
}

.results-count {
  /* "1-12 of 20 Items" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
}

.sort-label {
  /* "Newest" dropdown */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-secondary);
}
```

### 3I. Buttons & CTAs

```css
.btn-primary {
  /* "Add to Cart", "Out of Stock", "SUBSCRIBE" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);      /* 16px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wide);
  text-transform : uppercase;
  color          : var(--color-text-inverse);
  line-height    : 1;
}

.btn-secondary {
  /* "Ask on WhatsApp", "Save", "Share" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-normal);
  color          : var(--color-text-primary);
}

.btn-ghost {
  /* "VIEW ALL", text-only CTAs */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wide);
  text-transform : uppercase;
  color          : var(--color-text-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.btn-link {
  /* "VIEW COLLECTION", "SHOP NOW →" inline links */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-medium);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-primary);
}
```

### 3J. Forms & Inputs

```css
.input-label {
  /* "Your email", "Enter your email" floating/static labels */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-medium);
  color          : var(--color-text-secondary);
  letter-spacing : var(--tracking-normal);
}

.input-field {
  /* All text inputs: email, search, notify me */
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);      /* 16px — below 16px causes zoom on iOS */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-primary);
  letter-spacing : var(--tracking-normal);
  line-height    : var(--leading-normal);
}

.input-field::placeholder {
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-disabled); /* #bbb */
}

.input-error-message {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-error);
  letter-spacing : var(--tracking-normal);
}

.input-helper-text {
  /* "We'll email you when this item is back in stock" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
}

.quantity-selector {
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);      /* 16px */
  font-weight    : var(--weight-medium);
  color          : var(--color-text-primary);
}

.select-dropdown {
  /* Currency selector, Sort dropdown */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-primary);
}
```

### 3K. Reviews & Testimonials

```css
.review-text {
  font-family    : var(--font-body);
  font-size      : var(--text-body-lg);      /* 16px */
  font-weight    : var(--weight-regular);
  line-height    : var(--leading-relaxed);
  color          : var(--color-text-secondary);
  max-width      : var(--caption-width);     /* 45ch */
}

.review-author {
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);
  font-weight    : var(--weight-semibold);
  color          : var(--color-text-primary);
}

.review-date {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
}

.review-rating-count {
  /* "4.7 | 1,248 reviews" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-muted);
}
```

### 3L. Footer

```css
.footer-watermark {
  /* Large decorative "Odhvica" background text */
  font-family    : var(--font-display);
  font-size      : clamp(5rem, 15vw, 14rem); /* Fluid — 80px → 224px */
  font-weight    : var(--weight-bold);
  color          : var(--color-text-primary);
  opacity        : 0.06;                     /* Very faint */
  line-height    : 1;
  letter-spacing : var(--tracking-tight);
  pointer-events : none;
  user-select    : none;
}

.footer-brand-name {
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-semibold);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-inverse);
}

.footer-column-heading {
  /* "SHOP", "SUPPORT", "COMPANY" */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);      /* 12px */
  font-weight    : var(--weight-semibold);
  letter-spacing : var(--tracking-wider);
  text-transform : uppercase;
  color          : var(--color-text-inverse);
  opacity        : 0.6;
}

.footer-link {
  font-family    : var(--font-body);
  font-size      : var(--text-body-sm);      /* 14px */
  font-weight    : var(--weight-regular);
  color          : var(--color-text-inverse);
  opacity        : 0.75;
}

.footer-link:hover {
  opacity        : 1;
}

.footer-legal {
  /* "© 2026 Odhvica. All rights reserved." */
  font-family    : var(--font-body);
  font-size      : var(--text-body-xs);
  font-weight    : var(--weight-regular);
  color          : var(--color-text-inverse);
  opacity        : 0.4;
}
```

---

## 4. TAILWIND CONFIG (if using Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl' : ['clamp(2.5rem,5vw,4rem)',     { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg' : ['clamp(2rem,3.5vw,3rem)',     { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md' : ['clamp(1.625rem,2.5vw,2.25rem)',{ lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm' : ['clamp(1.375rem,2vw,1.75rem)',{ lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'body-xl'    : ['clamp(1rem,1.2vw,1.125rem)',  { lineHeight: '1.7' }],
        'body-lg'    : ['clamp(0.9375rem,1vw,1rem)',   { lineHeight: '1.5' }],
        'body-md'    : ['clamp(0.875rem,1vw,0.9375rem)',{ lineHeight: '1.5' }],
        'body-sm'    : ['clamp(0.8125rem,0.9vw,0.875rem)',{ lineHeight: '1.5' }],
        'body-xs'    : ['clamp(0.6875rem,0.8vw,0.75rem)',{ lineHeight: '1.5', letterSpacing:'0.06em' }],
      },
      colors: {
        text: {
          primary   : 'var(--color-text-primary)',
          secondary : 'var(--color-text-secondary)',
          muted     : 'var(--color-text-muted)',
          disabled  : 'var(--color-text-disabled)',
          inverse   : 'var(--color-text-inverse)',
          accent    : 'var(--color-text-accent)',
          error     : 'var(--color-text-error)',
          success   : 'var(--color-text-success)',
          price     : 'var(--color-text-price)',
          'price-old': 'var(--color-text-price-old)',
          sale      : 'var(--color-text-sale)',
        },
      },
      maxWidth: {
        'prose'   : 'var(--prose-width)',
        'heading' : 'var(--heading-width)',
        'caption' : 'var(--caption-width)',
        'content' : 'var(--content-width)',
        'narrow'  : 'var(--narrow-width)',
      },
    },
  },
}
```

### Tailwind usage examples

```jsx
{/* Section heading */}
<h2 className="font-display text-display-md font-medium text-text-primary max-w-heading">
  Fresh from the studio
</h2>

{/* Eyebrow label */}
<p className="font-body text-body-xs font-medium tracking-wider uppercase text-text-muted">
  Curated Series
</p>

{/* Product card name */}
<p className="font-body text-body-md font-medium text-text-primary line-clamp-2 max-w-caption">
  {product.name}
</p>

{/* Price */}
<span className="font-body text-body-sm font-semibold text-text-price">
  ₹{product.price}
</span>

{/* Input field */}
<input
  className="font-body text-body-lg text-text-primary placeholder:text-text-disabled"
  placeholder="Enter your email"
/>

{/* Breadcrumb */}
<nav className="font-body text-body-xs tracking-wide uppercase text-text-muted">
  <span>Home</span>
  <span className="mx-1 text-text-disabled">/</span>
  <span className="text-text-secondary font-medium">Collections</span>
</nav>

{/* Announcement bar */}
<div className="font-body text-body-xs font-medium tracking-wide text-text-inverse">
  Free shipping on orders above ₹999
</div>
```

---

## 5. COMPLETE QUICK REFERENCE TABLE

```
ELEMENT                          FONT        SIZE (fluid)         WEIGHT    COLOR VAR            CASE     TRACKING
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ANNOUNCEMENT BAR
Ticker text                      DM Sans     12px (xs)            500       --color-text-inverse  none     wide

NAVIGATION
Logo                             Cormorant   24px (fixed)         600       --color-text-primary  none     tight
Nav link                         DM Sans     16px (lg)            500       --color-text-primary  none     normal
Dropdown item                    DM Sans     14px (sm)            400       --color-text-secondary none    normal
Currency/icon label              DM Sans     12px (xs)            500       --color-text-primary  none     wide

BREADCRUMB
All items                        DM Sans     12px (xs)            400       --color-text-muted    UPPER    wide
Current page                     DM Sans     12px (xs)            500       --color-text-secondary UPPER   wide
Separator "/"                    DM Sans     12px (xs)            400       --color-text-disabled  —       —

SECTION LABELS & HEADINGS
Eyebrow ("CURATED SERIES")       DM Sans     12px (xs)            500       --color-text-muted    UPPER    wider
Section h2                       Cormorant   26→36px (display-md) 500       --color-text-primary  none     tight
Section h2 italic                Cormorant   26→36px (display-md) 300 ital  --color-text-primary  none     tight
Section h3                       Cormorant   22→28px (display-sm) 400       --color-text-primary  none     tight
Section body paragraph           DM Sans     16px (lg)            400       --color-text-secondary none    normal  max-width:65ch

PRODUCT CARDS
Brand label ("ODHVICA")         DM Sans     12px (xs)            400       --color-text-muted    UPPER    wider
Product name                     DM Sans     15px (md)            500       --color-text-primary  none     normal  max-width:45ch, 2-line clamp
Current price                    DM Sans     14px (sm)            600       --color-text-price    none     normal
Original price                   DM Sans     12px (xs)            400       --color-text-price-old none    normal  line-through
Discount %                       DM Sans     12px (xs)            600       --color-text-sale     none     wide
Badge ("New", "Almost Gone")     DM Sans     12px (xs)            600       --color-text-inverse  UPPER    wide

PRODUCT DETAIL PAGE (PDP)
Collection label                 DM Sans     12px (xs)            500       --color-text-accent   UPPER    wider
Product title                    Cormorant   22→28px (display-sm) 500       --color-text-primary  none     tight   max-width:narrow
Current price                    DM Sans     24px (fixed)         600       --color-text-price    none     normal
Original price                   DM Sans     15px (md)            400       --color-text-price-old none    normal  line-through
Description body                 DM Sans     16→18px (body-xl)    400       --color-text-secondary none    normal  max-width:65ch, line-height:1.7
Spec label                       DM Sans     14px (sm)            600       --color-text-primary  none     normal
Spec value                       DM Sans     14px (sm)            400       --color-text-secondary none    normal
Tab labels                       DM Sans     14px (sm)            500       --color-text-muted    none     wide
Tab label (active)               DM Sans     14px (sm)            600       --color-text-primary  none     wide
Trust badge label                DM Sans     14px (sm)            600       --color-text-primary  none     normal
Trust badge sublabel             DM Sans     12px (xs)            400       --color-text-muted    none     normal
Delivery estimate                DM Sans     12px (xs)            400       --color-text-muted    none     normal
In stock                         DM Sans     12px (xs)            600       --color-text-success  none     wide
Out of stock                     DM Sans     12px (xs)            600       --color-text-error    none     wide

COLLECTIONS PAGE
Hero eyebrow                     DM Sans     12px (xs)            500       --color-text-inverse  UPPER    wider
Hero heading                     Cormorant   32→48px (display-lg) 500       --color-text-inverse  none     tight
Hero subtext                     DM Sans     16px (lg)            400       --color-text-inverse  none     normal  max-width:65ch
Card name                        DM Sans     15px (md)            500       --color-text-primary  none     normal
Card count ("0 PRODUCTS")        DM Sans     12px (xs)            400       --color-text-inverse  UPPER    wide
Card action ("VIEW COLLECTION")  DM Sans     12px (xs)            500       --color-text-primary  UPPER    wider

SHOP / FILTER PAGE
Page heading                     Cormorant   32→48px (display-lg) 500       --color-text-primary  none     tight
Page subheading                  DM Sans     16px (lg)            400       --color-text-muted    none     normal
Filter group heading             DM Sans     12px (xs)            600       --color-text-muted    UPPER    wider
Filter option                    DM Sans     14px (sm)            400       --color-text-secondary none    normal
Filter option (active)           DM Sans     14px (sm)            500       --color-text-primary  none     normal
Filter pill                      DM Sans     12px (xs)            500       --color-text-primary  none     wide
Filter pill (active)             DM Sans     12px (xs)            500       --color-text-inverse  none     wide
Results count                    DM Sans     12px (xs)            400       --color-text-muted    none     normal
Sort dropdown                    DM Sans     14px (sm)            400       --color-text-secondary none    normal

BUTTONS & CTAs
Primary button                   DM Sans     16px (lg)            500       --color-text-inverse  UPPER    wide
Secondary button                 DM Sans     14px (sm)            500       --color-text-primary  none     normal
Ghost/text button                DM Sans     14px (sm)            500       --color-text-primary  UPPER    wide    underline
Inline link ("VIEW ALL →")       DM Sans     12px (xs)            500       --color-text-primary  UPPER    wider

FORMS & INPUTS
Input label                      DM Sans     14px (sm)            500       --color-text-secondary none    normal
Input field text                 DM Sans     16px (fixed)         400       --color-text-primary  none     normal  MUST be 16px — prevents iOS zoom
Input placeholder                DM Sans     16px (fixed)         400       --color-text-disabled none     normal
Error message                    DM Sans     12px (xs)            400       --color-text-error    none     normal
Helper text                      DM Sans     12px (xs)            400       --color-text-muted    none     normal
Quantity selector                DM Sans     16px (lg)            500       --color-text-primary  none     normal
Select/dropdown                  DM Sans     14px (sm)            400       --color-text-primary  none     normal

REVIEWS
Review text                      DM Sans     16px (lg)            400       --color-text-secondary none    normal  max-width:45ch
Author name                      DM Sans     14px (sm)            600       --color-text-primary  none     normal
Review date                      DM Sans     12px (xs)            400       --color-text-muted    none     normal
Rating count                     DM Sans     14px (sm)            400       --color-text-muted    none     normal

FOOTER
Watermark                        Cormorant   80→224px (fluid)     700       --color-text-primary  none     tight   opacity:0.06
Brand name                       DM Sans     12px (xs)            600       --color-text-inverse  UPPER    wider
Column heading                   DM Sans     12px (xs)            600       --color-text-inverse  UPPER    wider   opacity:0.6
Footer link                      DM Sans     14px (sm)            400       --color-text-inverse  none     normal  opacity:0.75
Legal text                       DM Sans     12px (xs)            400       --color-text-inverse  none     normal  opacity:0.4
```

---

## 6. UNBREAKABLE RULES

**Rule 1 — No hardcoded values**
Zero `font-size: 16px` or `color: #333` in any component file. Every value from CSS variables or Tailwind tokens.

**Rule 2 — Font assignment is strict**
Cormorant = headings, editorial, hero, brand moments ONLY.
DM Sans = everything else — price, badge, nav, button, input, filter, meta.

**Rule 3 — Input font-size minimum 16px (fixed)**
Never fluid-scale inputs below 16px. iOS Safari zooms in when input font-size < 16px. Use `font-size: 1rem` fixed for all inputs.

**Rule 4 — Uppercase always needs letter-spacing**
Any `text-transform: uppercase` must have `letter-spacing: var(--tracking-wide)` minimum.
Uppercase without tracking = cramped and unprofessional.

**Rule 5 — Prose text needs max-width**
Any paragraph, description, or body text > 1 line must have `max-width: var(--prose-width)` (65ch).
Never let body text stretch full-width on large screens.

**Rule 6 — Product card names always 2-line clamp**
No exceptions. Inconsistent card heights from long names breaks grid layout.

**Rule 7 — Colors from variables only**
Never use a hardcoded color for text. If a new semantic color is needed, add it to `:root` and use the variable.

**Rule 8 — clamp() handles all responsive scaling**
Do not write `@media` breakpoints for font sizes. The clamp() values in Section 2 already handle mobile → desktop fluid scaling.
