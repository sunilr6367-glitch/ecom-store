# Odhvica Storefront Design System v1

Status: Active
Date: 2026-06-20

## Source Of Truth

Human-editable token source:

```text
storefront/design-system/tokens.json
```

Generated runtime artifacts (do not edit directly):

```text
storefront/src/styles/tokens.css
storefront/src/styles/theme.generated.css
storefront/src/design-system/tokens.generated.ts
```

Repeatable gate:

```text
npm.cmd run audit:design-system
```

## Typography

Odhvica storefront typography uses an editorial serif display face with a restrained grotesk body:

- `--ds-font-display` uses `Amiri`, with `Cardo` and system serif fallbacks.
- `--ds-font-body` and UI roles use `Cardo`, with system serif fallbacks.
- Hierarchy comes from the display/body contrast plus weight, spacing, scale, and imagery.
- New storefront UI should use `font-display`, `font-body`, `type-*`, and `tracking-token-*` utilities.
- Components must consume typography roles instead of declaring page-local font families.

## Color

The V4 storefront color contract is monochrome editorial so product textiles carry the color:

- Primary text and CTA use `#000000` via semantic tokens.
- Secondary and muted text use `#333333` and `#666666`.
- Page and paper surfaces use `#FFFFFF`; soft and subtle surfaces use `#F7F7F7` and `#E5E5E5`.
- CTA hover uses `#1A1A1A`; inverse text uses `#FFFFFF`.
- Gold is restricted to ratings and approved heritage metadata.

Use:

```text
--ds-text-primary
--ds-surface-page
--ds-surface-paper
--ds-accent-primary
--ds-accent-hover
--ds-accent-soft
--ds-accent-rgb
```

Compatibility bridges are migration-only and accept no new consumers. Do not add alternate accent names or raw visual values outside `tokens.json`.

## CMS Visual Contract

- Hero desktop and mobile media must be previewed before activation.
- Active hero banners require a title, subtitle, CTA label, and valid local or HTTPS destination.
- Do not bake headlines, brand names, subtitles, prices, or CTA labels into hero artwork when HTML copy is enabled.
- Empty homepage collections render nothing; public pages must never show admin instructions or configuration placeholders.
- A content-only hero image is preferred because HTML copy remains accessible, responsive, searchable, and editable.

## Primitives

The only public route-facing UI API is:

```text
storefront/src/design-system/index.ts
```

Use these before adding page-local UI systems:

| Primitive | File | Use |
| --- | --- | --- |
| Button, ButtonLink, ButtonAnchor, IconButton, UnstyledButton | `Button.tsx` | Actions and clickable controls |
| Badge | `Badge.tsx` | Labels and status chips |
| Card | `Card.tsx` | Framed content surfaces |
| Drawer | `Drawer.tsx` | Slide-in panels |
| EmptyState | `EmptyState.tsx` | Empty and error states |
| Input | `Input.tsx` | Text fields |
| Modal | `Modal.tsx` | Dialogs and overlays |
| PopoverPanel | `Popover.tsx` | Floating panels |
| PriceDisplay | `PriceDisplay.tsx` | Commerce pricing |
| RatingDisplay | `RatingDisplay.tsx` | Review stars and counts |
| Section, SectionHeader | `Section.tsx` | Page sections |
| Select | `Select.tsx` | Select fields |
| StatusBanner | `StatusBanner.tsx` | Feedback banners |
| Textarea | `Textarea.tsx` | Multiline fields |
| TrustBadge | `TrustBadge.tsx` | Trust and policy signals |

## Active Rules

- Use `--ds-*` tokens for new CSS.
- Use shared primitives before creating page-local buttons, cards, forms, badges, modals, drawers, sections, or empty states.
- Keep default Tailwind palette utilities out of runtime TSX.
- Keep raw UI hex values inside `tokens.css`.
- Use `--ds-*-rgb` channels for transparent overlays and shadows.
- Do not add named surface/text color declarations; use tokens.
- Do not add old-prefixed CSS selectors.
- Keep page-local CTA class systems out of TSX.
- Keep priority overrides limited to documented accessibility resets.
- Keep inline styles limited to runtime data, measured dimensions, stagger timing, third-party SDK config, or product swatches.

## Homepage Layout Contract

- Homepage content width: `--ds-home-content-width` (`1520px`).
- Homepage gutters: `48px` desktop, `32px` tablet, and `20px` mobile through the `--ds-home-gutter-*` tokens.
- Homepage section rhythm: `96px` desktop and `56px` mobile through the `--ds-home-section-space-*` tokens.
- Hero is full bleed. Other homepage content uses the shared `HomepageContainer` / `HomepageSection` primitives.
- Horizontal homepage rails use the shared `homepageScrollRailClassName`, which owns both `display: flex` and horizontal overflow behavior.
- Homepage media containers must declare an intrinsic aspect ratio or explicit dimensions.

## Runtime Consumption Rules

- Prefer semantic Tailwind utilities bridged from `globals.css`.
- Raw `var(--ds-*)` usage in TSX is allowed only as a Tailwind arbitrary-value escape hatch when no semantic utility exists.
- `--ink`, `--cream`, and `--line` remain compatibility-only aliases and must not be consumed by runtime TSX.

## Current Metrics

Latest verified metrics:

| Metric | Value |
| --- | ---: |
| CSS owner files | 27 |
| Component TSX files | 107 |
| Native styled buttons | 3 |
| Shared Button usages | 88 |
| Shared ButtonLink usages | 33 |
| Shared ButtonAnchor usages | 1 |
| Legacy button class refs | 0 |
| Default palette refs | 0 |
| UI default palette refs | 0 |
| Inline style blocks | 7 |
| Card usages | 40 |
| Modal usages | 8 |
| Drawer usages | 4 |
| Badge usages | 16 |

## Verification

Before marking design-system work complete, run:

```text
npm.cmd run audit:design-system
npm.cmd run audit:design-system:metrics
npm.cmd run lint
npm.cmd run verify:design-system -- --pool=threads
npm.cmd run build
```
