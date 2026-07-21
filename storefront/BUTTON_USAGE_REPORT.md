# Button & Link Usage Report

## Pattern Rules (what SHOULD be)
- Primary CTA (main action): `ButtonLink variant="primary"`
- Secondary navigation ("View All"): Simple `Link` with arrow `→` (e.g. `className="kv-section-link"`)
- Outlined action: `ButtonLink variant="outline"`  
- Text link: Plain `<Link>` or `variant="inline"`

## Violations Found

### BestSellers (`src/components/home/BestSellers.tsx`)
- **Current:** 
  ```tsx
  <ButtonLink href="/collections/best-sellers" variant="primary" size="md">
    View All Best Sellers
  </ButtonLink>
  ```
- **Problem:** "View All" is a secondary navigation action, but it is currently styled as a massive Primary CTA button. This breaks the hierarchy of section headers.
- **Fix:** Replace with `<Link href="/collections/best-sellers" className="kv-section-link">View All Best Sellers →</Link>`

### ShopTheLook (`src/components/home/ShopTheLook.tsx`)
- **Current:** 
  ```tsx
  <Link href="/products" className="w-fit inline-flex min-h-[48px] items-center justify-center gap-2 px-8 py-3 bg-[var(--ds-surface-page)] border border-[var(--ds-border-dark)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-soft)] transition-colors rounded-none mt-[40px] uppercase text-body-xs font-ui font-semibold tracking-token-widest w-full">
    Shop All
  </Link>
  ```
- **Problem:** A basic `<Link>` tag is packed with hardcoded utility classes to imitate an outline button, ignoring the design system's Button component.
- **Fix:** Replace with `<ButtonLink href="/products" variant="outline" size="md" fullWidth>Shop All</ButtonLink>`

### CollectionsSection (`src/components/home/CollectionsSection.tsx`)
- **Current:** 
  ```tsx
  <Link href="/collections">View all collections</Link>
  ```
- **Problem:** Missing standard link typography/styling (`kv-section-link`) and the directional arrow.
- **Fix:** Replace with `<Link href="/collections" className="kv-section-link">View all collections →</Link>`

### WatchBuyPreview (`src/components/home/WatchBuyPreview.tsx`)
- **Current:** 
  ```tsx
  <Link href="/reels" className="text-body-sm type-medium tracking-[var(--ds-type-body-tracking)]...">
    View all
  </Link>
  ```
- **Problem:** Using hardcoded typography utility classes instead of the standardized section link class.
- **Fix:** Replace with `<Link href="/reels" className="kv-section-link">View All →</Link>`

## Consistency Rules to enforce
1. "View All / See All" links → always plain Link, never Button. Include the `→` arrow.
2. Primary CTA → always `ButtonLink variant="primary"`.
3. "Shop Now" on collection cards → `ButtonLink variant="outline"` or `categoryOverlay`.
4. No button inside another clickable element.
5. Use `kv-section-link` class for consistent header link styling instead of hardcoded text utilities.

## Fix list ranked by visibility impact

1. **`src/components/home/BestSellers.tsx` (Line 346)**
   - **Current:** `<ButtonLink href="/collections/best-sellers" variant="primary" size="md">View All Best Sellers</ButtonLink>`
   - **Proposed Fix:** `<Link href="/collections/best-sellers" className="kv-section-link">View All Best Sellers →</Link>`

2. **`src/components/home/ShopTheLook.tsx` (Line 98)**
   - **Current:** `<Link href="/products" className="w-fit inline-flex min-h-[48px] ... bg-[var(--ds-surface-page)] ...">Shop All</Link>`
   - **Proposed Fix:** `<ButtonLink href="/products" variant="outline" size="lg" className="mt-[40px] w-full">Shop All</ButtonLink>`

3. **`src/components/home/CollectionsSection.tsx` (Line 20)**
   - **Current:** `<Link href="/collections">View all collections</Link>`
   - **Proposed Fix:** `<Link href="/collections" className="kv-section-link">View all collections →</Link>`

4. **`src/components/home/WatchBuyPreview.tsx` (Line 24)**
   - **Current:** `<Link href="/reels" className="text-body-sm type-medium ...">View all</Link>`
   - **Proposed Fix:** `<Link href="/reels" className="kv-section-link">View All →</Link>`

5. **`src/components/home/ShopTheLook.tsx` (Line 42)**
   - **Current:** `<Link href="/products" className="kv-section-link">View All</Link>`
   - **Proposed Fix:** `<Link href="/products" className="kv-section-link">View All →</Link>`
