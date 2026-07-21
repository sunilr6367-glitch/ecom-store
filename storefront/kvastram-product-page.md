# Odhvica — Product Page Redesign
**Target CVR:** 10%+ · **Brand:** Handmade artisan, Jaipur · **Stack:** Shopify Liquid

---

## Wireframe

### Mobile layout (≤768px)

```
┌─────────────────────────────────┐  ← 390px wide
│████████████ NOTCH ██████████████│
├─────────────────────────────────┤  [1] STICKY NAV
│ ←  Block Print Quilt     ⎗  🛒²│      back · title · share · cart count
├─────────────────────────────────┤  [2] TRUST STRIP (green bg)
│ ✓ Free shipping ₹2000+  ✓ 7-day│      kills hesitation before image
├─────────────────────────────────┤  [3] FULL-BLEED GALLERY
│                                 │      swipeable carousel
│  [Only 4 left]   [ product img ]│      scarcity badge top-left
│                            [♡] │      wishlist heart top-right
│              ● ○ ○ ○            │      dot indicators bottom-center
├─────────────────────────────────┤  [4] PRODUCT INFO + URGENCY
│ ODHVICA                        │      brand name (blue, caps)
│ Block Print Reversible Kantha   │      title (Cormorant Garamond)
│ Quilt — Double                  │
│ ★★★★★ 4.9  2,412 reviews  430↑ │      ratings + social proof inline
│ ₹3,499  ~~₹4,099~~  [Save ₹600]│      anchored price + save badge
│ 🔥 17 viewing · 4 left in stock │      urgency bar (amber bg)
├─────────────────────────────────┤  [5] VARIANT SELECTORS
│ Color — Indigo Blue             │      color: dot swatches 22px circles
│ 🔵 🟤 🟢 🟫 🟣              │      selected = ink border ring
│ Size — Double                   │      size: pill buttons
│ [Single] [Double●] [King] [~~Q~~]│     OOS = strikethrough + 40% opacity
├─────────────────────────────────┤  [6] CTA STACK
│ ████ 🛒 Add to cart ██████████ │      PRIMARY — ink bg, full width 48px
│ ──── ⚡ Buy now — UPI/Card ──── │      SECONDARY — outline
│ ···· 💬 Ask on WhatsApp ······ │      MOBILE ONLY — teal bg
│ [🚚 Free] [↩ Returns] [🔒] [✋] │      micro-trust 2×2 grid
│ 👥 23 people bought in last 24h │      social proof bar with avatars
├─────────────────────────────────┤  [7] ICON ACCORDION ← KEY REDESIGN
│ PRODUCT DETAILS                 │
│ ┌──────────────────────────────┐│      BEFORE: plain "DESCRIPTION +"
│ │[📋] Description          [−]││      AFTER:  icon + title + hint text
│ │     100% cotton · Reversible ││      First item expanded by default
│ │     · Kantha stitched        ││
│ ├──────────────────────────────┤│
│ │[🌿] Fabric care rules    [+]││      hint: "Machine wash cold · Gentle"
│ ├──────────────────────────────┤│
│ │[↩] Return policy         [+]││      hint: "7 days · Unused condition"
│ ├──────────────────────────────┤│
│ │[🚚] Shipping policy      [+]││      hint: "Free ₹2000+ · 4–8 days"
│ └──────────────────────────────┘│
├─────────────────────────────────┤  [8] REVIEWS
│ Customer reviews                │      overall rating + star histogram
│ 4.9 ★★★★★                      │      5★ ████████████░  88%
│ 5★ ████████████░  88%          │      verified badge per card
│ "Better than photos." ✓Verified │
│ Priya M. · Delhi · 3 days ago  │
├─────────────────────────────────┤  [9] STICKY BOTTOM BAR
│ Block Print Quilt  ₹3,499  [ATC]│      fixed, above iOS home bar
├─────────────────────────────────┤
│▄▄▄▄▄▄▄▄▄ HOME BAR ▄▄▄▄▄▄▄▄▄▄│
└─────────────────────────────────┘
```

---

### Desktop layout (≥769px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ✓ Free shipping ₹2,000+  ·  ✓ 7-day returns  ·  ★ 4.9 (2,412)     │  [A] TRUST BAR
├──────────────────────────────────────────────────────────────────────┤
│ Home / Quilts / Block Print Reversible Quilt                         │  breadcrumb
├───────────────────────────────┬──────────────────────────────────────┤
│                               │ ODHVICA                             │
│   ┌───────────────────────┐   │ Block Print Reversible Kantha Quilt  │
│   │  [New arrival]        │   │ ★★★★★ 4.9  2,412 reviews  430 sold  │
│   │                       │   │                                      │
│   │    product image      │   │ ₹3,499  ~~₹4,099~~  [Save ₹600]     │
│   │              [4 left] │   │ 🔥 Only 4 left · 17 viewing now     │
│   └───────────────────────┘   │                                      │
│   [img] [img] [img] [▶ video] │ Color — Indigo Blue                  │  [B] BUY BOX
│                               │ 🔵 🟤 🟢 🟫                         │
│   ← 55% column →             │ Size — Double  [Size guide ↗]        │
│                               │ [Single] [Double●] [King] [~~Queen~~]│
│                               │                                      │
│                               │ ████████ 🛒 Add to cart █████████   │
│                               │ ──── ⚡ Buy now — UPI / Card / EMI ─│
│                               │                                      │
│                               │ [🚚 Free] [↩ Returns] [🔒] [✋]     │
│                               │ 👥 23 people bought in last 24h     │
│                         ← 45% column →                              │
├───────────────────────────────┴──────────────────────────────────────┤
├─────────────────────────────────────┬────────────────────────────────┤
│                                     │                                │
│  [📋] Description              [−] │  4.9 ★★★★★                    │
│  ┌──────────────────────────────┐  │  5★ ████████████░  88%        │
│  │ Hand-stitched in Jaipur.     │  │  4★ █░              9%        │
│  │ 100% cotton, natural dyes.   │  │  3★ ░               2%        │
│  │ ~2,500 kantha stitches/sqft  │  │  2,412 reviews                │
│  └──────────────────────────────┘  │                                │  [C] ACCORDION
│                                     │  "Better than photos!"        │  [D] REVIEW SIDEBAR
│  [🌿] Fabric care rules       [+]  │  ✓ Verified · Priya M. Delhi  │      (sticky, scrolls with)
│       Machine wash cold · Gentle   │                                │
│                                     │  "Shipped to London, loved it"│
│  [↩] Return policy            [+]  │  ✓ Verified · Sarah K. London │
│       7 days · Unused condition    │                                │
│                                     │  ← 35% sticky sidebar →      │
│  [🚚] Shipping policy         [+]  │                                │
│       Free ₹2000+ · 4–8 days India │                                │
│  ← 65% accordion col →            │                                │
├─────────────────────────────────────┴────────────────────────────────┤
│ Block Print Kantha Quilt · Indigo · Double    ₹3,499   [Add to cart]│  [E] STICKY ATC BAR
└──────────────────────────────────────────────────────────────────────┘
```

---

### Zone reference

| Zone | Label | Description | CVR impact |
|------|-------|-------------|------------|
| 1/A | Sticky nav | Back + title + cart count badge | UX hygiene |
| 2 | Trust strip | Green bg: Free shipping · Returns · Secure | +5% |
| 3/A | Gallery | Swipeable, scarcity badge inside frame, video in thumb 4 | +10% |
| 4/B | Price + urgency | Anchored price, save badge, FOMO bar | +8% |
| 5 | Variants | 44px tap targets, strikethrough OOS, size guide link | -30% returns |
| 6 | CTA stack | ATC → Buy now → WhatsApp (mobile-only) | +15% |
| 7/C | Icon accordion | **Replaces plain text** — icon + hint per item | +8% click-through |
| 8/D | Reviews | Star histogram + verified badges + photo reviews | +6% |
| 9/E | Sticky ATC bar | Follows scroll, iOS safe-area padding | +12% mobile |

---

### Accordion redesign — before vs after

**Before (current site):**
```
DESCRIPTION          +
FABRIC CARE RULES    +
RETURN POLICY        +
SHIPPING POLICY      +
```
Problems: No visual anchor · All caps feels cold · No hint of content · Low click-through

**After (proposed):**
```
[📋] Description                            [−]
     100% cotton · Reversible · Kantha stitched

[🌿] Fabric care rules                      [+]
     Machine wash cold · Gentle cycle

[↩]  Return policy                          [+]
     7 days · Unused · Original condition

[🚚] Shipping policy                         [+]
     Free above ₹2,000 · 4–8 days India
```
Improvements: Instant visual anchor · Sentence case = warmer · Hint text = reason to click · First item expanded by default

---

## Claude Code prompt

Paste this into Claude Code to implement the redesign:

```
You are redesigning the product page for Odhvica (odhvica.com), a handmade
artisan fashion brand based in Jaipur, India. The tech stack is Shopify Liquid.

The brand tone is: warm, artisan, refined minimal — like a premium Indian craft
brand, not a generic ecommerce store.

BRAND DESIGN TOKENS (use exactly, as CSS custom properties):
  --cream:         #FAF7F2
  --warm-white:    #FFFDF9
  --ink:           #1C1A17
  --ink-muted:     #5C5750
  --ink-faint:     #9C9891
  --terracotta:    #C4613A
  --terracotta-lt: #F0E0D6
  --gold:          #B8924A
  --green:         #3B6D11
  --green-lt:      #EAF3DE
  --amber:         #BA7517
  --amber-lt:      #FAEEDA
  --blue:          #185FA5
  --blue-lt:       #E6F1FB
  --teal:          #0F6E56
  --teal-lt:       #E1F5EE
  --border:        #E8E3DB
  --section-bg:    #F5F1EB

FONTS: Cormorant Garamond (headings) + DM Sans (body/UI) — both already loaded.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 1 — STICKY NAVIGATION BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- height: 48px, position: sticky top: 0, z-index: 100
- background: var(--warm-white), border-bottom: 1px solid var(--border)
- Left: back arrow (←) links to collection
- Center: product title, font-size 14px, truncated with ellipsis
- Right: share icon + cart icon with item count badge
  - badge: background var(--terracotta), color white, 14px circle, font-size 9px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 2 — TRUST STRIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Full width, padding 5px 16px
- background: var(--green-lt), color: #27500A
- Content: "✓ Free shipping ₹2,000+  ·  ✓ 7-day returns  ·  ✓ Secure checkout"
- font-size: 11px, text-align: center, display: flex, gap: 12px
- Desktop: add "✓ 4.9★ · 2,412 reviews" at end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 3 — PRODUCT GALLERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mobile:
- Full-bleed swipeable carousel, aspect-ratio: 1 / 0.9
- Swipe via Pointer Events API (no external library)
- Dot indicators at bottom-center: active dot = wide pill (14px), inactive = circle (5px)
- Scarcity badge (top-left): "Only {{ inventory }} left"
  - Show ONLY if inventory_quantity < 10
  - background: var(--amber-lt), color: #633806, border-radius: 99px, font-size: 11px
- Wishlist heart (top-right): 28px circle, background white, border 0.5px
- Lazy-load all images: loading="lazy"

Desktop:
- Large main image (left column, 55%)
- 4 thumbnail strip below main image in 4-col grid
- Thumbnail 4 slot: video thumbnail with play icon overlay
- Hover on thumbnail → swap main image
- Click main image → lightbox zoom (vanilla JS, no library)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 4 — PRODUCT INFO + URGENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Brand name: "Odhvica" — font-size 11px, font-weight 500, color var(--blue),
  letter-spacing 0.1em, text-transform uppercase
- Product title: font-family Cormorant Garamond, font-size 22px (mobile 18px),
  font-weight 500, line-height 1.3, color var(--ink)
- Rating row: amber stars + "4.9" + review count (links to #reviews) + "· X sold"
  - "X sold" shown only if metafield 'custom.units_sold' exists
- Price row:
  - Sale price: font-size 24px (mobile 20px), font-weight 500
  - Compare-at price: font-size 14px, line-through, color var(--ink-faint)
  - "Save ₹X" badge: background var(--green-lt), color #27500A, border-radius 99px,
    padding 2px 10px, font-size 11px
  - Calculate savings dynamically: compare_at_price - price
- Urgency bar (show ONLY if inventory_quantity < 10):
  - "🔥 X people viewing · Y left in stock"
  - X = random 12–23 generated on page load via JS
  - Y = {{ product.selected_or_first_available_variant.inventory_quantity }}
  - background: var(--amber-lt), border-radius 6px, border: 1px solid #FAC775
  - padding 6px 10px, font-size 12px, color #633806

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 5 — VARIANT SELECTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Color swatches:
- Circular dot buttons, 24px diameter, min tap target 44px (use padding)
- Selected state: 2px solid var(--ink) ring, 2px gap (outline with offset)
- Unavailable: 60% opacity, cursor: not-allowed
- Label updates to show selected color name: "Color — Indigo Blue"

Size pills:
- Pill buttons, font-size 13px, padding 6px 14px, border-radius 6px
- Default: border 1px solid var(--border), color var(--ink-muted)
- Selected: border 1px solid var(--ink), color var(--ink), font-weight 500
- Out of stock: text-decoration line-through, opacity 0.4, pointer-events none
- Add "Size guide" link (opens size chart modal, NOT new page)
- Label updates: "Size — Double"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 6 — CTA STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack vertically, full width, gap: 8px:

1. Add to cart button (PRIMARY):
   - background: var(--ink), color: var(--warm-white)
   - padding: 14px, border-radius: 8px, font-size: 14px, font-weight: 500
   - Icon: cart icon left of text
   - Hover: slight opacity reduction

2. Buy now button (SECONDARY):
   - background: var(--warm-white), color: var(--ink)
   - border: 1.5px solid var(--ink), same sizing as primary

3. WhatsApp button (MOBILE ONLY — hide on desktop with display:none at ≥769px):
   - background: var(--teal-lt), color: var(--teal)
   - border: 1px solid #5DCAA5, border-radius: 8px
   - Text: "💬 Ask on WhatsApp"
   - On click: open wa.me/91XXXXXXXXXX?text=Hi, I'm interested in [product.title] — [canonical_url]
   - Pull product title and URL dynamically via Liquid + JS

4. Micro-trust grid (2×2):
   - "🚚 Free delivery" / "↩ Easy 7-day return" / "🔒 Secure payment" / "✋ Handmade"
   - background: var(--section-bg), border-radius: 6px, font-size: 11px
   - padding: 6px 8px, display: flex, align-items: center, gap: 4px

5. Social proof bar:
   - 3 overlapping avatar initials circles (18px, overlapping -6px)
   - Text: "X people bought this in the last 24 hours" — X = random 18–31
   - background: var(--section-bg), border-radius: 6px, font-size: 12px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 7 — ICON ACCORDION (KEY REDESIGN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This replaces the current plain text accordion.
Current: "DESCRIPTION +" — just uppercase text, no context.
New design: icon + title + subtitle hint, with smooth animation.

Each accordion item structure:
┌─────────────────────────────────────────────┐
│ [ICON BOX]  Title text              [+/−]  │
│             Subtitle hint text             │  ← visible when collapsed
├─────────────────────────────────────────────┤
│ Expanded content panel                      │  ← visible when expanded
└─────────────────────────────────────────────┘

Icon box: 32px × 32px, border-radius: 8px, flex-shrink: 0
Toggle circle: 20px, border-radius: 50%, border: 1px solid var(--border)
Title: font-size 14px, font-weight 500, color var(--ink)
Subtitle hint: font-size 12px, color var(--ink-faint) — SHOW when collapsed, HIDE when expanded
Content panel: background var(--section-bg), padding: 12px 14px, font-size 13px, line-height 1.7

Transition: max-height animation, 0.25s ease, for smooth open/close.
First item (Description) expanded by default on page load.
One item open at a time (accordion pattern).

FOUR ITEMS:

1. Description
   Icon bg: var(--blue-lt) (#E6F1FB), icon: 📋
   Hint: "100% cotton · 3-layer kantha · Reversible"
   Content: {{ product.description }}

2. Fabric care rules
   Icon bg: var(--green-lt) (#EAF3DE), icon: 🌿
   Hint: "Machine wash cold · Gentle cycle · No bleach"
   Content: from metafield custom.fabric_care
   Fallback: "Machine wash cold on gentle cycle. Do not bleach. Tumble dry low or
   line dry in shade. Iron on medium heat, reverse side. Colours may soften with
   washes — this is natural for hand-dyed fabric."

3. Return policy
   Icon bg: var(--terracotta-lt) (#F0E0D6), icon: ↩
   Hint: "7 days from delivery · Unused condition"
   Content: "We accept returns within 7 days of delivery. Item must be unused,
   unwashed, and in original condition with all tags attached. Email
   support@odhvica.com with your order number and photos of the item. See our
   full Return Policy for details."

4. Shipping policy
   Icon bg: var(--amber-lt) (#FAEEDA), icon: 🚚
   Hint: "Free above ₹2,000 · India 4–8 days · Intl 10–20 days"
   Content: "Free shipping on India orders above ₹2,000. Standard delivery 4–8
   business days within India. International shipping available to 50+ countries
   — 10–20 business days. You will receive a tracking email once dispatched.
   See our full Shipping Policy for details."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 8 — REVIEWS SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Section heading: "Customer reviews", Cormorant Garamond 22px
- Rating summary:
  - Large number (overall average, 36px, font-weight 500)
  - Stars row (amber ★)
  - Star histogram: 5★ → 1★ bar chart with percentage labels
    - Bar: background var(--amber), height 5px, border-radius 99px
    - Track: background var(--border)
  - Total review count below
- Review cards (pull from Judge.me or Shopify metafields):
  - Stars + "Verified" teal badge per card
  - Review text (capped at 3 lines with "Read more" expand)
  - Reviewer name + location + relative date
  - Photo review images if available (thumbnail grid)
- Desktop: 2-column card grid
- Mobile: single column
- id="reviews" anchor for rating row link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 9 — STICKY BOTTOM ATC BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- position: fixed, bottom: 0, left: 0, right: 0, z-index: 90
- CRITICAL on iOS: padding-bottom: calc(env(safe-area-inset-bottom) + 12px)
- background: var(--warm-white), border-top: 1px solid var(--border)
- Left: product title (truncated, 12px) + price (14px, font-weight 500)
- Right: "Add to cart" button — background var(--ink), color var(--warm-white),
  padding: 10px 20px, border-radius: 7px, font-size: 13px
- Behaviour (vanilla JS):
  - Hidden by default (transform: translateY(100%), transition 0.2s)
  - Show: when user scrolls PAST the main ATC button (use IntersectionObserver)
  - Hide: when main ATC button scrolls back into view
  - Clicking sticky bar triggers same add-to-cart logic as main button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESKTOP-SPECIFIC LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Hero zone: CSS Grid, 55% (gallery) / 45% (buy box), no gap
- Below fold: CSS Grid, 65% (accordion + FAQ) / 35% (reviews sidebar)
  - Reviews sidebar: position: sticky, top: 80px (below sticky nav)
  - This keeps reviews visible as user reads accordion content
- Cross-sell row: 3-column grid (use Shopify product recommendations API)
- WhatsApp button: display: none at min-width: 769px
- Breadcrumb navigation: above hero, font-size 12px, color var(--ink-faint)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Shopify Liquid syntax throughout
- Mobile-first CSS (base = mobile, breakpoint ≥769px = desktop)
- Vanilla JS only — NO jQuery, NO external JS libraries
- Gallery swipe: use Pointer Events API (pointerdown, pointermove, pointerup)
- Accordion: max-height transition, JS toggles class, no jQuery slideToggle
- Sticky bar: IntersectionObserver on main ATC button
- Lazy-load images: loading="lazy" on all img tags
- Schema markup: include Product + FAQPage + BreadcrumbList JSON-LD
- Accessible: aria-expanded on accordion toggles, aria-label on icon buttons,
  keyboard navigation (Enter/Space on accordion headers)
- CSS custom properties for all brand colors (already listed above)
- Fonts: Cormorant Garamond + DM Sans via Google Fonts (already in theme.liquid)

OUTPUT FORMAT:
Single file: sections/main-product.liquid
- CSS in {% stylesheet %} block at top
- Liquid + HTML in section body
- JS in {% javascript %} block at bottom
- No inline styles (use CSS classes)
- No external CSS/JS CDN dependencies
```

---

## Implementation priority

| # | Change | Time | CVR impact |
|---|--------|------|-----------|
| 1 | Icon accordion (Zone 7) | 2–3 hrs | +8% click-through |
| 2 | WhatsApp button (Zone 6) | 30 min | +15% India CVR |
| 3 | Sticky bottom ATC bar (Zone 9) | 1–2 hrs | +12% mobile |
| 4 | Trust strip (Zone 2) | 30 min | +5% |
| 5 | Urgency bar (Zone 4) | 1 hr | +8% when triggered |
| 6 | Social proof bar (Zone 6) | 1–2 hrs | +6% |
| 7 | Star histogram reviews (Zone 8) | 3–4 hrs | +5% trust |

> **Start with items 1–3.** Combined estimated lift: +35% on mobile India traffic.
