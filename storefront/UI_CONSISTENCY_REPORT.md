# UI Consistency Report

## 1. Button System
- **How many button components exist?**
  There is 1 core button file (`src/components/ui/Button.tsx`) exporting 5 variations: `Button`, `ButtonLink`, `ButtonAnchor`, `IconButton`, and `UnstyledButton`.
- **What variants are defined?**
  Only 5 variants are defined in `Button.tsx`: `primary`, `secondary`, `outline`, `ghost`, `danger`.
- **What variants are actually used?**
  Across the codebase, at least 12 variants are being requested: `accent`, `categoryOverlay`, `compact`, `danger`, `ghost`, `inline`, `outline`, `pdp`, `primary`, `product-card`, `secondary`, `success`.
- **Inconsistencies found?**
  There is a massive discrepancy between defined and used variants. 7 out of 12 variants used across the storefront (`accent`, `pdp`, `success`, `compact`, `inline`, `categoryOverlay`, `product-card`) **do not exist** in `variantClasses`, meaning they will fallback to undefined/unstyled CSS behavior.

## 2. Color Issues
- **Hardcoded colors found where?**
  No hardcoded hex or raw Tailwind colors (`bg-black`, `text-white`) were found locally in the `components/home` directory outside of standard token usage, meaning the CSS variables are strictly enforced.
- **Token mismatches?**
  The most glaring token mismatch is the **Primary CTA Button**. The recent design-system phase declared: *"Brand identity: Jaipur Terracotta CTA"*. However, `Button.tsx` maps `primary` to:
  `bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)]`
  This incorrectly renders the primary button as Dark Ink (black) instead of Terracotta.

## 3. BestSellers Issue
- **Exact code causing black box + black text:**
  In `src/components/home/BestSellers.tsx`, lines 346-352:
  ```tsx
  <ButtonLink href="/collections/best-sellers" variant="primary" size="md">
    View All Best Sellers
  </ButtonLink>
  ```
- **Root cause:**
  The `primary` variant in `Button.tsx` is bugged. It is styled with `bg-[var(--ds-text-primary)]` (which resolves to dark ink/black). The text color is using `text-[var(--ds-text-inverse)]`, which is supposed to be off-white (`--ds-parchment-50`), but arbitrary Tailwind classes without the `brand` palette map can easily collide or fail to cascade if the specificity is overridden by standard typography layers (like `text-primary` defined at a parent level). Thus, it appears as a black box.

## 4. Link vs Button
- **Where links are used as buttons?**
  `ButtonLink` (an extension of `next/link`) is used heavily (e.g., in `BestSellers.tsx` for the "View All Best Sellers" CTA).
- **Where buttons are used as links?**
  `ButtonAnchor` is defined for standard `<a>` tags but is mixed with `ButtonLink`. This is fundamentally sound as long as they all consume the identical `variantClasses` lookup, but missing variants break them globally.

## 5. Priority Fix List
**Ranked by visual impact:**

1. **[Highest impact] — `src/components/ui/Button.tsx` (Lines 39-40)**
   **Issue:** Primary button ignores brand Terracotta.
   **Fix:** Change `primary` variant to use `bg-[var(--ds-accent-primary)] text-[var(--ds-text-on-accent)]`.

2. **[High impact] — `src/components/ui/Button.tsx` (Line 9)**
   **Issue:** Missing button variants breaking UI across the site.
   **Fix:** Add the missing variants (`accent`, `pdp`, `success`, `compact`, `inline`, `categoryOverlay`, `product-card`) to the `ButtonVariant` type and `variantClasses` mapping to prevent silent styling failures.

3. **[Medium impact] — `src/components/ui/Button.tsx` (Line 41)**
   **Issue:** Secondary button is identical to primary.
   **Fix:** Differentiate `secondary` variant from `primary` (likely needs to be an outline, soft-surface, or muted button).
