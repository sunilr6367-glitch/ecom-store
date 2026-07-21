# Phase 5 Fix Plan

## 5A: Content Pages
- **List of all affected `page.tsx` files:**
  - `src/app/pages/refund-policy/page.tsx`
  - `src/app/pages/shipping-policy/page.tsx`
- **Current pattern used (raw Tailwind):**
  Uses hardcoded sizing and weight classes like `text-2xl`, `text-4xl`, `text-sm`, `text-base leading-7`, and `font-semibold`.
- **Proposed fix:** 
  Refactor these files to use the shared layout component found in `src/components/content/StaticPolicyPage.tsx` (which imports `ContentPageSystem`). Alternatively, map the hardcoded typography classes to `--ds-*` equivalents (e.g., `text-display-sm`, `text-body-md type-semibold`).
- **Estimated lines to change:** ~20-30 lines across both files.

## 5B: PDP CSS  
- **Top 20 hardcoded values found:**
  `padding-bottom: 96px`, `min-height: 44px`, `padding: 0 20px`, `outline-offset: 2px`, `grid-template-columns: 36px minmax(0, 1fr) auto`, `min-height: 48px`, `padding: 0 12px`, `backdrop-filter: blur(12px)`, `width: 32px`, `height: 32px`, `gap: 2px`, `top: 3px`, `border-radius: 999px`, `padding: 18px 0 0`, `margin: 8px 0 12px`, `font-size: clamp(1rem, 1.15vw, 1.25rem)`, `gap: 8px`.
- **Which can map to existing `--ds-*` tokens:**
  - `border-radius: 999px` -> `var(--ds-radius-pill)`
  - `gap: 8px` -> `var(--ds-space-xs)`
  - `padding: 0 12px` -> Could map to an intermediate space token or `var(--ds-space-sm)` if close enough.
  - `margin: 8px 0 12px` -> `var(--ds-space-xs)` and intermediate combinations.
- **Which need new tokens:**
  - `backdrop-filter: blur(12px)` may need a new `--ds-blur` token.
  - Highly specific layout values like `width: 32px` or `grid-template-columns` should likely remain hardcoded as intentional component constraints.

## 5C: Unused tokens
- **Confirm which are truly unused:**
  The audit flagged tokens like `--ds-font-display`, `--ds-font-body`, `--ds-font-ui`, `--ds-text-display-xl`, `--ds-text-display-lg`, `--ds-text-display-md`, `--ds-text-display-sm`, `--ds-text-body-xl`, and `--ds-text-body-lg` as unused because they didn't appear in `src/**/*.css` or `src/**/*.tsx`.
- **Are they mapped in `tailwind.config.ts`?**
  Yes. A check of `tailwind.config.ts` confirms they are actively mapped to Tailwind utilities (e.g., `font-display`, `text-display-xl`). The previous audit missed them because it only scanned the `src/` directory, while the tailwind config is in the project root.
- **Fix needed: config update or remove token:**
  No fix needed. These tokens are correctly mapped and used globally.

## 5D: Remaining CSS files
- **`pdp.css`, `reels.css`, `content-pages.css`**
  - `pdp.css`: 108 hardcoded values.
  - `reels.css`: 79 hardcoded values.
  - `content-pages.css`: 74 hardcoded values.
- **Count of fixable vs intentional hardcoded values:**
  An estimated 50-60% of these values are fixable layout primitives (`border-radius`, `gap`, `padding`, `margin`). The rest are intentional, component-specific structural constraints (e.g., `height: 48px` for an exact button tap target, `grid-template-columns`, `min-width`) that shouldn't be extracted to a global token.
