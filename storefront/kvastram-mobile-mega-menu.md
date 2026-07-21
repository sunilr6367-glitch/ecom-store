# Odhvica — Mobile Mega Menu Redesign
**Component:** Mobile navigation drawer · **Stack:** Shopify Liquid + Vanilla JS

---

## Wireframe — 3 states

### State 1 — Closed (normal header)

```
┌─────────────────────────────────┐  390px wide
│████████████ NOTCH ██████████████│
├─────────────────────────────────┤
│ ☰   Odhvica        🔍 ♡ 🛒²  │  [1] HEADER BAR
│                                 │      hamburger · logo · icons
├─────────────────────────────────┤
│                                 │
│        [ homepage content ]     │
│                                 │
└─────────────────────────────────┘
```

---

### State 2 — Menu open (full-screen drawer slides in from left)

```
┌─────────────────────────────────┐
│████████████ NOTCH ██████████████│
├─────────────────────────────────┤
│ ✕            Odhvica    ♡ 🛒² │  [1] HEADER — hamburger → X
├─────────────────────────────────┤
│ 🔍  Search quilts, bags…       │  [2] SEARCH BAR (auto-focused)
├─────────────────────────────────┤
│ 🏷 Free shipping ₹2000+ · KANTHA10 for 10% off │  [3] PROMO STRIP (green bg)
├─────────────────────────────────┤
│ [🛏] Quilts & Throws        >  │  [4] NAV ITEMS
│      Kantha, block print        │      icon box + title + subtitle
│ ─────────────────────────────── │      chevron = drill into submenu
│ [👕] Clothing               >  │
│      Kurtas, jackets, sarees    │
│ ─────────────────────────────── │
│ [👜] Bags & Totes           >  │
│      Block print, kantha, jute  │
│ ─────────────────────────────── │
│ [🧣] Scarves & Dupattas     >  │
│      Cotton, silk blend         │
│ ─────────────────────────────── │
│ [✨] Gift sets               >  │
│      Curated craft bundles      │
│ ─────────────────────────────── │
│ [🏷] Sale              [40%off]│  ← badge instead of chevron
├─────────────────────────────────┤
│ SHOP BY MOOD                    │  [5] VISUAL MOOD ROW
│ [🌞]   [🍃]   [♥]   [🏠]     │      horizontal scroll chips
│ Festive Everyday Gifts  Home    │      image + label, tap = collection
├─────────────────────────────────┤
│ 📦 Track my order               │  [6] FOOTER UTILITY LINKS
│ 💬 Chat on WhatsApp             │      secondary bg, reduces support
│ 👤 My account                   │
│ ℹ️  About Odhvica               │
└─────────────────────────────────┘
```

---

### State 3 — Category submenu (slides in from right on nav item tap)

```
┌─────────────────────────────────┐
│████████████ NOTCH ██████████████│
├─────────────────────────────────┤
│ ← Menu   Quilts & Throws       │  [7] BACK HEADER
│                                 │      ← button returns to State 2
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │      category hero image
│ │   [ category lifestyle img ]│ │      "New arrivals this season"
│ │                New arrivals │ │      label overlaid bottom-left
│ └─────────────────────────────┘ │
│ View all quilts              →  │      quick "view all" link
├─────────────────────────────────┤
│ [All●] [Kantha] [Block print]   │      filter chips (horizontal scroll)
│ [Reversible]                    │      active = filled dark pill
├─────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐     │  [8] SUBCATEGORY PRODUCT GRID
│ │  [img]   │  │  [img]   │     │      2-column
│ │Single    │  │Double    │     │      image + name + count + "from ₹X"
│ │12 styles │  │8 styles  │     │
│ │from ₹2499│  │from ₹3299│     │
│ └──────────┘  └──────────┘     │
│ ┌──────────┐  ┌──────────┐     │
│ │  [img]   │  │  [img]   │     │
│ │King size │  │Throws    │     │
│ │6 styles  │  │15 styles │     │
│ │from ₹4499│  │from ₹1799│     │
│ └──────────┘  └──────────┘     │
├─────────────────────────────────┤
│ QUICK PICKS                     │      featured strip
│ [★ Bestsellers] [🕐 New in]    │
│ [🏷 On sale]                   │
└─────────────────────────────────┘
```

---

### Zone reference

| Zone | Element | Design detail | Why it converts |
|------|---------|---------------|-----------------|
| 1 | Header bar | Hamburger → X on open. Cart count always visible. | Users always know cart state |
| 2 | Search bar | First element in open menu. Auto-focus on open. | 40% of menu visitors search directly |
| 3 | Promo strip | Green bg. Scrolling text: offer + free shipping. | Impulse trigger at navigation moment |
| 4 | Nav items | 32px icon box (colored) + title + 1-line subtitle + chevron. 48px tap target. | 3x click-through vs plain text links |
| 5 | Mood row | Horizontal scroll chips: image + intent label. | Discovery navigation, not just category |
| 6 | Footer links | Track order · WhatsApp · Account · About. | Reduces support load, builds trust |
| 7 | Back header | ← Menu label + category title centred. Slide animation. | Clear wayfinding in nested state |
| 8 | Product grid | 2-col subcategory grid. Count + starting price per tile. | Price anchoring starts in navigation |

---

## Claude Code prompt

Paste this into Claude Code to build the component:

```
You are building the mobile navigation mega menu for Odhvica (odhvica.com),
a handmade artisan fashion brand from Jaipur, India. Stack: Shopify Liquid.

The menu is a full-height drawer that slides in from the LEFT on hamburger tap.
It has 3 states: closed → open menu → category submenu (slides in from right).

BRAND TOKENS (use as CSS custom properties):
  --cream:         #FAF7F2
  --warm-white:    #FFFDF9
  --ink:           #1C1A17
  --ink-muted:     #5C5750
  --ink-faint:     #9C9891
  --terracotta:    #C4613A
  --terracotta-lt: #F0E0D6
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

FONTS: Cormorant Garamond (brand logo only) + DM Sans (all nav text)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 1 — SITE HEADER (always visible)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Height: 52px, position: sticky, top: 0, z-index: 200
background: var(--warm-white), border-bottom: 1px solid var(--border)

Layout (3 zones):
- Left: hamburger icon button (24px, aria-label="Open menu")
- Center: "Odhvica" in Cormorant Garamond, 20px, letter-spacing 0.04em
- Right: search icon + wishlist icon + cart icon with count badge
  - Cart badge: background var(--terracotta), color white, 14px circle,
    font-size 9px, position absolute top-right of cart icon

When menu is open:
- Hamburger icon swaps to X (✕) icon, aria-label="Close menu"
- Everything else stays the same

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 2 — SEARCH BAR (inside open menu)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Full-width pill input: background var(--section-bg), border-radius 8px
- border: 1px solid var(--border), padding 10px 12px
- Search icon (left), placeholder: "Search quilts, jackets, bags…"
- font-size: 14px, color var(--ink)
- AUTO-FOCUS this input when menu opens (use JS setTimeout 50ms after
  transition starts, so keyboard doesn't interrupt slide animation)
- On input: show instant search suggestions below (Shopify Predictive Search API)
  - Suggestions: product name + image thumbnail + price
  - Max 5 results, font-size 13px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 3 — PROMO STRIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Full width, height 32px, background var(--green-lt)
- border-bottom: 1px solid #C0DD97, color #27500A, font-size 12px
- Rotating marquee (CSS animation, no JS):
  - Message 1: "🏷 Free shipping on orders above ₹2,000"
  - Message 2: "✨ Use code KANTHA10 for 10% off your first order"
  - Message 3: "🤝 Handmade by artisans in Jaipur, Rajasthan"
- Pause on hover

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 4 — NAV ITEMS (main category list)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each nav item is a row with:
- Min height: 56px (accessible tap target)
- border-bottom: 1px solid var(--border)
- padding: 0 16px
- display: flex, align-items: center, gap: 12px

Left: colored icon box
- Size: 36px × 36px, border-radius: 8px
- Icon: Tabler outline icon, 18px
- Each category has its own bg color (see below)

Middle: text stack
- Title: font-size 15px, font-weight 500, color var(--ink)
- Subtitle: font-size 12px, color var(--ink-faint), margin-top 2px

Right: chevron OR badge
- Normal categories: chevron-right icon, 16px, color var(--ink-faint)
- Sale: red badge pill instead of chevron

SIX CATEGORIES (in this order):
1. Quilts & Throws
   Icon bg: var(--terracotta-lt), icon: ti-bed
   Subtitle: "Kantha, block print, reversible"
   Links to: /collections/quilts

2. Clothing
   Icon bg: var(--green-lt), icon: ti-shirt
   Subtitle: "Kurtas, jackets, sarees, lehengas"
   Links to: /collections/clothing

3. Bags & Totes
   Icon bg: var(--blue-lt), icon: ti-briefcase
   Subtitle: "Block print, kantha, jute"
   Links to: /collections/bags

4. Scarves & Dupattas
   Icon bg: #FBEAF0 (pink light), icon: ti-wind
   Subtitle: "Cotton, silk blend, printed"
   Links to: /collections/scarves

5. Gift sets
   Icon bg: var(--amber-lt), icon: ti-sparkles
   Subtitle: "Curated craft bundles"
   Links to: /collections/gifts

6. Sale
   Icon bg: #FCEBEB (red light), icon: ti-rosette-discount
   Subtitle: "Up to 40% off selected items"
   RIGHT side: red badge pill "40% off" instead of chevron
   Links to: /collections/sale (direct link, no submenu)

On tap of categories 1–5: slide in the SUBMENU (State 3).
Sale taps directly to collection page (no submenu).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 5 — SHOP BY MOOD (visual row)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Section label: "Shop by mood", font-size 11px, uppercase, letter-spacing 0.08em
- Horizontal scroll row (overflow-x: auto, scrollbar hidden)
- Each chip: 60px wide, flex-direction column, gap 4px
  - Image: 48px × 48px square, border-radius 8px, object-fit cover
    - Use real product images via Shopify metafields or hardcoded collection images
  - Label: font-size 11px, color var(--ink-muted), text-align center

FOUR MOODS:
1. Festive — image from Diwali/festive collection, label "Festive"
2. Everyday — image from casual collection, label "Everyday"
3. Gifts — image from gift sets, label "Gifts"
4. Home — image from home decor, label "Home"

Each chip links to a collection filtered by tag.
No scrollbar visible (scrollbar-width: none in CSS).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 6 — FOOTER UTILITY LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- background: var(--section-bg), border-top: 1px solid var(--border)
- Each row: 44px height, display flex, align-items center, gap 10px
- Icon (Tabler, 16px, color var(--ink-faint)) + label (14px, var(--ink-muted))
- border-bottom: 1px solid var(--border), last row no border

FOUR LINKS:
1. ti-package icon · "Track my order" → /pages/track-order
2. ti-brand-whatsapp icon · "Chat on WhatsApp" → wa.me/91XXXXXXXXXX
3. ti-user icon · "My account" → /account
4. ti-info-circle icon · "About Odhvica" → /pages/about

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 7 — SUBMENU HEADER (State 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Same height as main header: 52px
- Left: "← Menu" back button (ti-arrow-left icon + "Menu" text, 13px)
  - On tap: slide submenu back out (translateX to +100%), show main menu
- Center: category title, font-size 16px, font-weight 500
- Right: empty spacer div (same width as back button, for centering)
- border-bottom: 1px solid var(--border)

Below header (in order):
a. CATEGORY HERO IMAGE
   - Full-width image, height 100px, object-fit cover, border-radius 0
   - Overlay label bottom-left: category tagline in white text
   - Image pulled from collection.image metafield

b. VIEW ALL LINK
   - "View all [category name]" → collection URL
   - display flex, justify-content space-between, align-items center
   - font-size 13px, color var(--blue), font-weight 500
   - Arrow icon right side, border-bottom 1px

c. FILTER CHIPS (horizontal scroll)
   - "All" + subcategory filter tags as scrollable pill row
   - Active chip: background var(--ink), color var(--warm-white)
   - Inactive: border 1px solid var(--border), color var(--ink-muted)
   - On tap: filter the product grid below (use Shopify AJAX API)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONE 8 — SUBCATEGORY PRODUCT GRID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 2-column grid, gap 8px, padding 10px
- Each card:
  - border: 1px solid var(--border), border-radius 8px, overflow hidden
  - Image: aspect-ratio 1/1, object-fit cover, background var(--section-bg)
  - Info area: padding 8px
    - Name: font-size 12px, font-weight 500, color var(--ink)
    - Meta: font-size 10px, color var(--ink-faint)
      Format: "X styles · from ₹Y" — pull from collection metafields

SUBCATEGORY DATA PER CATEGORY:
Quilts & Throws:
  - Single kantha quilt (12 styles · from ₹2,499) → /collections/single-quilts
  - Double reversible (8 styles · from ₹3,299) → /collections/double-quilts
  - King size quilt (6 styles · from ₹4,499) → /collections/king-quilts
  - Throw blankets (15 styles · from ₹1,799) → /collections/throws

Clothing:
  - Kurtas (20 styles · from ₹1,299) → /collections/kurtas
  - Kantha jackets (10 styles · from ₹2,299) → /collections/jackets
  - Sarees (8 styles · from ₹3,499) → /collections/sarees
  - Lehengas (5 styles · from ₹4,999) → /collections/lehengas

Bags & Totes:
  - Tote bags (18 styles · from ₹699) → /collections/totes
  - Shoulder bags (12 styles · from ₹999) → /collections/shoulder-bags
  - Clutches (8 styles · from ₹599) → /collections/clutches
  - Backpacks (5 styles · from ₹1,499) → /collections/backpacks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURED STRIP (bottom of submenu)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- background: var(--section-bg), padding 8px 10px
- Label: "Quick picks", 11px uppercase
- 3 chips in a row:
  - [★ Bestsellers] → collection tagged 'bestseller'
  - [🕐 New in] → collection sorted by newest
  - [🏷 On sale] → collection with compare_at_price
- Chip style: background var(--warm-white), border 1px solid var(--border),
  border-radius 6px, padding 5px 10px, font-size 12px, display flex, gap 5px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANIMATION SPEC (vanilla JS + CSS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Main menu drawer:
- position: fixed, top: 0, left: 0, height: 100%, width: min(320px, 100%)
- transform: translateX(-100%) when closed
- transform: translateX(0) when open
- transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- background: var(--warm-white)
- overflow-y: auto, -webkit-overflow-scrolling: touch

Overlay (dimmed bg):
- position: fixed, inset: 0, background: rgba(0,0,0,0.4)
- opacity: 0 / pointer-events: none when closed
- opacity: 1 / pointer-events: all when open
- transition: opacity 0.3s ease
- z-index: 150 (below drawer 160, above page 100)
- On tap: close menu

Submenu panel:
- INSIDE the main drawer, same size
- position: absolute, top: 0, left: 0, width: 100%, height: 100%
- transform: translateX(100%) when hidden (off-screen right)
- transform: translateX(0) when visible
- transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)
- background: var(--warm-white)
- overflow-y: auto

JS logic:
- Open menu: add class 'menu-open' to body → drawer slides in, overlay fades in
- Close menu: remove 'menu-open' → drawer slides out, overlay fades out
- Open submenu: add data-category attribute, add class 'submenu-open' → panel slides in
- Close submenu: remove 'submenu-open' → panel slides back out
- body.menu-open: overflow: hidden (prevent background scroll)
- ESC key: close menu / submenu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Shopify Liquid, component in snippets/mobile-menu.liquid
- Include via {% render 'mobile-menu' %} in theme.liquid
- Vanilla JS only (no jQuery, no Swiper, no external libraries)
- Accessible:
  - aria-expanded on hamburger button
  - aria-hidden on closed drawer
  - Focus trap inside open menu (Tab cycles within menu)
  - ESC closes menu
  - role="dialog" on drawer, aria-label="Navigation menu"
- Performance:
  - Lazy-load subcategory images (IntersectionObserver)
  - Predictive search: debounce 300ms before API call
  - CSS animations only (no JS-driven frame loops)
- Only show this component on mobile: use CSS display:none at min-width 769px
  (desktop has its own navigation component)
- Shopify Predictive Search API endpoint:
  /search/suggest.json?q={query}&resources[type]=product&resources[limit]=5

OUTPUT: Single file snippets/mobile-menu.liquid with:
- Liquid template in body
- CSS in <style> block
- JS in <script> block at bottom
- No external dependencies
```

---

## Implementation notes

The biggest conversion impact comes from two changes:

**Search inside the menu** — most Shopify mobile menus have no search. 40% of mobile visitors who open the menu are looking for something specific. Adding autofocused search here captures that intent immediately instead of making them close the menu and find the search bar.

**Submenu product grid instead of links** — instead of showing "Single Quilts → Double Quilts → King Quilts" as plain links, showing a 2-col image grid with price anchoring ("from ₹2,499") starts the purchase consideration right inside the navigation. Users are 2 taps from a product instead of 3.
