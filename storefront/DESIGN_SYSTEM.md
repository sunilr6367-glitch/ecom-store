# 1. OVERVIEW

Welcome to the **Odhvica Storefront Design System**. This living document serves as the single source of truth for all developers and designers working on the project.

### The Single-Source-of-Truth Principle
Every color, typography choice, spacing unit, and layout constraint must derive from a centralized design token. By strictly adhering to this principle, we guarantee visual consistency across the entire storefront. 

### Global Updates
Modifying a single token in `tokens.css` (e.g., changing the primary accent color or adjusting a fluid typography scale) safely and instantly cascades the change across every component and page on the site.

### Tech Stack
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS v4 + Vanilla CSS Primitives
- **Tokens:** CSS Custom Properties prefixed with `--ds-*`

## AI Agent Files
- **Codex (ChatGPT):** `AGENTS.md` — auto-loaded each session
- **Gemini (IDX):** `GEMINI.md` — paste or reference in chat
- **Rules summary:** Never use values outside tokens.css

---

# 2. TOKEN REFERENCE

All tokens are defined in `src/styles/tokens.css`. Below is the exhaustive reference of available tokens, their purposes, and how to use them.

## Typography tokens (--ds-font-*, --ds-text-*, --ds-leading-*, --ds-type-*)
Typography defines the hierarchy and readability of the storefront.

- **`--ds-font-display`**: `'Libre Caslon Text', 'Cormorant Garamond', Georgia, serif` — Used for all primary headings, titles, and editorial emphasis.
- **`--ds-font-body`**: `'Hanken Grotesk', 'DM Sans', system-ui, sans-serif` — Used for paragraphs, product descriptions, and general text.
- **`--ds-font-ui`**: Maps to `--ds-font-body` — Used for functional UI elements like buttons and inputs.
- **`--ds-font-label`**: Maps to `--ds-font-ui` — Used for small uppercase tags, kickers, and breadcrumbs.

**Sizes (Fluid & Static):**
- **`--ds-text-display-[xl|lg|md|sm]`**: Fluid heading sizes that scale automatically based on the viewport.
- **`--ds-text-body-[xl|lg|md|sm|xs]`**: Standard body copy sizes.
- **`--ds-text-count-xs`**: Smallest size `0.625rem` used for badges and counters.

**Weights & Leading:**
- **`--ds-weight-[light|regular|medium|semibold|bold]`**: Font weights from 300 to 700.
- **`--ds-leading-[tight|snug|normal|relaxed]`**: Line heights ranging from `1.2` to `1.625`.
- **`--ds-tracking-[tight|normal|wide|wider]`**: Letter spacing values up to `0.025em`.

**Role Contract:**
Components should consume role tokens instead of raw sizes/weights whenever possible (e.g., `--ds-type-heading-font`, `--ds-type-body-weight`, `--ds-type-product-title-size`).

## Color tokens (--ds-text-*, --ds-surface-*, --ds-accent-*, --ds-border-*)
The canonical palette for the application.

- **`--ds-text-primary`**: `#1A1A1A` — Primary high-contrast text.
- **`--ds-text-secondary`**: `#666666` — Secondary text.
- **`--ds-text-muted`**: `#7f756e` — Muted text for low-priority info.
- **`--ds-text-inverse`**: Maps to `--ds-surface-paper` — Used for text on dark backgrounds.
- **`--ds-surface-page` / `--ds-surface-paper`**: `#FFFFFF` — Primary page and card backgrounds.
- **`--ds-surface-soft` / `--ds-surface-warm`**: `#F7F7F7` / `#F5F5F5` — Soft, off-white background regions.
- **`--ds-border-subtle`**: `#E5E5E5` — Light decorative borders.
- **`--ds-border-strong`**: `#7f756e` — High-contrast borders.
- **`--ds-accent-primary` / `--ds-accent-gold`**: `#B89B5E` (TERRACOTTA is canonical intent) — Primary brand action color.
- **`--ds-accent-hover`**: `#9E8148` — Hover state for accent elements.

**RGB Tokens (For Opacity):**
- **`--ds-ink-rgb`**, **`--ds-cream-rgb`**, **`--ds-black-rgb`**, **`--ds-white-rgb`**
- **Usage Pattern:** `rgba(var(--ds-black-rgb), 0.5)` — This is the correct pattern for transparent overlays.

## Spacing tokens (--ds-space-*)
Standardized gaps and padding.

- **`--ds-space-[xs|sm|md|lg]`**: Static spacing from `8px` to `32px`.
- **`--ds-space-[xl|2xl]`**: Fluid spacing (`clamp`) for large sections, ranging from `48px` to `120px` based on viewport.

## Layout tokens (--ds-home-gutter-*, --ds-*-width)
Container restrictions.

- **`--ds-prose-width`**: `65ch` — Optimal reading width for text.
- **`--ds-content-width`**: `1280px` — Standard max page width.
- **`--ds-home-content-width`**: `1520px` — Expanded max width for the homepage.
- **`--ds-home-gutter-[desktop|tablet|mobile]`**: Viewport-specific gutters.
- **`--ds-home-section-space-desktop`**: `108px` — Standard vertical section spacing on homepage desktop.

## Shadow & Radius tokens
- **`--ds-radius-[xs|sm|md|lg|pill]`**: Corner radii from `2px` to `999px`.
- **`--ds-shadow`**: Soft floating shadow (`0 10px 34px rgba(26, 23, 20, 0.12)`).

## Z-index tokens (--ds-z-*)
Ensures correct stacking context hierarchy.

- **`--ds-z-dropdown`**: `50`
- **`--ds-z-sticky`**: `100` (Headers, sticky navigation)
- **`--ds-z-overlay`**: `200` (Scrims, backdrops)
- **`--ds-z-modal`**: `300` (Modals, popups, drawers)

## Transition tokens
- **`--ds-transition-fast`**: `150ms ease`
- **`--ds-transition-normal`**: `220ms ease`
- **`--ds-transition`**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — The signature Odhvica UI motion curve.

## State tokens (--ds-success-*, --ds-danger-*, --ds-warning-*, --ds-info-*)
Semantic status colors used for alerts, forms, and validation.

- **Success**: `--ds-success` (`#3e8a5f`), `--ds-success-bg`
- **Danger**: `--ds-danger` (`#c0392b`), `--ds-danger-bg`
- **Warning**: `--ds-warning` (`#ba7517`), `--ds-warning-bg`
- **Info**: `--ds-info` (`#185fa5`), `--ds-info-bg`

## Social & Swatch tokens
- **`--ds-social-[facebook|twitter]`**: Brand-compliant social colors.
- **`--ds-swatch-[navy|blue|off-white|cream|olive|green|red|orange|yellow|beige|brown|pink|purple|grey]`**: Product variant swatches mapped to hex values.
  - **Usage Case:** Used in the product catalog and PDP to render dynamic color swatch buttons for product variants (e.g., `<button className="bg-[var(--ds-swatch-navy)]" />`).

---

# 3. TAILWIND CONFIG

Our `tailwind.config.ts` extends the default Tailwind theme to map tightly to our `--ds-*` tokens.

### Token-Driven Utilities
- **Colors**: The Tailwind palette (slate, amber, green, red, etc.) maps its `50`-`950` variants directly to `--ds-*` semantic state and surface tokens.
- **Fonts**: `font-display`, `font-body`, `font-ui`, and `font-label` map to their respective `--ds-font-*` properties.
- **Sizes**: `text-display-xl`, `text-body-md`, etc., map to `--ds-text-*` along with their designated line-heights and tracking values.
- **Radii / Max-Widths**: `rounded-lg` and `max-w-prose` consume `--ds-radius-lg` and `--ds-prose-width`.

### Arbitrary Values
For tokens that are not explicitly mapped into a named Tailwind utility, use arbitrary value syntax. This is the preferred pattern for direct token consumption:
```html
<div className="text-[var(--ds-text-primary)] bg-[var(--ds-surface-soft)] p-[var(--ds-space-md)]">
```

---

# 4. SHARED CSS PRIMITIVES

While we prefer Tailwind utilities, certain CSS classes are intentionally preserved in `utilities.css` and component files. These "primitives" encapsulate complex logic or heavy multi-property rules that are too verbose for inline Tailwind.

- **`.homepage-container`**: Manages the complex responsive gutters and max-widths for the homepage grid.
- **`.homepage-section`**: Standardizes block padding and viewport boundaries for large sections.
- **`.homepage-section-head`**: A grid layout for section titles and "View All" links.
- **`.homepage-eyebrow`**: Pre-configured label typography with correct margins and tracking.
- **`.homepage-hero-scrim` & `.homepage-campaign-scrim`**: Intricate CSS linear-gradients used to ensure text legibility over photography.
- **`.homepage-featured-overlay`**: Shared overlay treatment for featured content blocks.
- **`.kv-*` classes**: Universal parity classes (e.g., `.kv-tag`, `.kv-title`, `.kv-chip`) found in `utilities.css`.

---

# 5. COMPONENT CONVERSION RULES

When authoring new components or migrating legacy ones, follow these rules:

1. **Prefer Tailwind Utilities**: Use Tailwind for layout (flex, grid, padding, margin) and structural styling.
2. **Use Arbitrary Tokens**: For colors and sizing, use `[var(--ds-*)]` arbitrary values. 
3. **Never Hardcode Hex Values**: Absolutely no `#1A1A1A` or `#FFFFFF` in component CSS or TSX.
4. **Avoid Legacy Aliases**: Do not use the old `--ink`, `--cream`, `--line`, or `text-brand-gold` values.

### Good vs Bad Examples

**BAD:** `var(--ink)`
**GOOD:** `var(--ds-text-primary)`

**BAD:** `var(--cream)`
**GOOD:** `var(--ds-surface-page)`

**BAD:** `var(--line)`
**GOOD:** `var(--ds-border-subtle)`

**BAD:** `#1A1A1A`
**GOOD:** `var(--ds-text-primary)`

**BAD:** `text-brand-gold`
**GOOD:** `text-[var(--ds-accent-gold)]`

**BAD:** `className="homepage-slide-title"` (Creating a new BEM class)
**GOOD:** `className="text-[var(--ds-text-inverse)] font-display text-display-xl"`

---

# 6. AUDIT SCRIPTS

We rely on automated audits to enforce design system compliance and prevent regression.

### `npm run audit:design-system`
- **What it checks**: Scans all `css`, `ts`, and `tsx` files for hardcoded hex values, `!important` flags, legacy font classes, legacy accent names, and unauthorized inline styles. It also tracks the total count of legacy Tailwind default palette references.
- **How to read output**: The script will throw an error with the exact file path, line number, and reason for failure.

### `npm run audit:css-ownership`
- **What it checks**: Maps every CSS class to the file that defines it. Prevents the duplication of CSS selectors (e.g., two different files defining `.btn-primary`).
- **Baseline concept**: Expected duplicates are recorded in a `baseline.json`. Any *new* duplicates will fail the build.

### When to run them
Run these scripts locally before pushing any styling or component changes. They are also enforced in the CI/CD pipeline. To intentionally update the baseline after a migration, run `npm run audit:css-ownership -- --write-baseline`.

---

# 7. HOW TO MAKE CHANGES

### Change a color sitewide
1. Open `src/styles/tokens.css`.
2. Modify the target `--ds-*` token value.
3. Verify the change across the application.

### Add a new token
1. Add the token to the appropriate category block in `src/styles/tokens.css`.
2. Follow the `--ds-[category]-[modifier]` naming convention.
3. If applicable, map it in `tailwind.config.ts`.

### Add a new component
1. Write the markup using Tailwind utilities.
2. Consume `--ds-*` tokens via arbitrary syntax (`text-[var(--ds-text-primary)]`).
3. If complex reusable gradients or grids are needed, create a `.kv-*` or primitive class in a scoped CSS file.

### Migrate a legacy component (step by step)
1. Identify the legacy BEM classes in the `.tsx` file.
2. Open the corresponding `.css` file and map the CSS properties to Tailwind utilities.
3. Replace hardcoded colors and legacy aliases (`--ink`, `--cream`) with their `--ds-*` equivalents.
4. Replace the BEM classes in the `.tsx` file with the new Tailwind string.
5. Delete the orphaned CSS classes.
6. Run `npm run audit:design-system` and `npm run audit:css-ownership`.

---

# 8. WHAT NOT TO DO

- **Do NOT** use `#hex` codes in components or component CSS. It breaks dark-mode / theme-switching capability and divorces the component from the design system.
- **Do NOT** use `!important` outside of explicitly documented accessibility overrides. It destroys the cascade.
- **Do NOT** create broad, generic CSS overrides (e.g., `div { margin: 0; }`).
- **Do NOT** use legacy font utilities (`font-serif`) without pairing them to the correct `font-display` or `font-body` token.
- **Do NOT** create new BEM modifiers (`.card--large--blue`). Use Tailwind.

---

# 9. FILE STRUCTURE

A map of the CSS architecture and what each file "owns":

- **`tokens.css`**: The ultimate source of truth. All CSS variables.
- **`typography.css`**: Typography governance layer. Maps elements (h1, p) and utility classes back to tokens.
- **`utilities.css`**: Shared `.kv-*` primitives and prototype parity classes.
- **`animations.css`**: Global keyframes and transition utilities.
- **`effects.css`**: Scrims, gradients, and visual overlays.
- **`responsive.css`**: Global media queries and breakpoint behaviors.
- **`base.css`**: CSS resets and foundational element styling.
- **`components/home-sections.css`**: Primitives specifically shared across homepage sections.
- **`components/footer.css`**: Scoped styles for the global footer.
- **`components/pdp.css`**: Scoped styles for the Product Details Page.

---

# 10. PHASE COMPLETION STATUS
- Phase 5A: ✅
- Phase 5B: ✅
- Phase 5C: ✅
- Phase 5D: ✅
- Phase 5E: ✅
- Phase 6: ✅
