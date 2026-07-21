# Odhvica Spacing System

Phase 1 of the design system overhaul standardizes spacing only. Do not change color, type, radius, imagery, or motion as part of spacing work.

## Scale

Use this 4px base scale, with the 8px rhythm as the primary layout language.

| Token | Value | Use |
| --- | ---: | --- |
| `--space-0` | `0px` | Reset, edge-to-edge media |
| `--space-1` | `4px` | Tight text pairs, tiny offsets |
| `--space-2` | `8px` | Related items, icon/text gaps |
| `--space-3` | `12px` | Small text spacing |
| `--space-4` | `16px` | Default component padding |
| `--space-5` | `20px` | Medium-small spacing |
| `--space-6` | `24px` | Form fields, mobile gutters |
| `--space-8` | `32px` | Component groups, mobile grid rows |
| `--space-10` | `40px` | Large component padding |
| `--space-12` | `48px` | Section header-to-content gap |
| `--space-16` | `64px` | Tablet sections, product grid rows |
| `--space-20` | `80px` | Desktop gutters |
| `--space-24` | `96px` | Desktop section padding |
| `--space-32` | `128px` | Dramatic section spacing |
| `--space-40` | `160px` | Hero-scale spacing |

Tailwind aliases use the same numeric keys: `p-4`, `gap-8`, `py-24`, etc.

## Section Rhythm

Default sections:

```tsx
<section className="py-12 md:py-16 lg:py-24">
  <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20" />
</section>
```

Dramatic sections such as brand story and editorial moments:

```tsx
<section className="py-16 md:py-20 lg:py-32" />
```

## Containers

Use `1440px` for primary ecommerce pages, `1600px` only for wide immersive layouts, and `720px` for reading pages.

Horizontal gutters:

| Viewport | Padding |
| --- | ---: |
| Mobile | `24px` / `px-6` |
| Tablet | `48px` / `md:px-12` |
| Desktop | `80px` / `lg:px-20` |

## Component Rules

Section headers:

```tsx
<div className="mb-8 md:mb-12">
  <p className="mb-3">Eyebrow</p>
  <h2 className="mt-3">Title</h2>
  <p className="mt-4">Description</p>
</div>
```

Product cards:

```tsx
<div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
  <article>
    <div className="aspect-[4/5]" />
    <div className="pt-4">
      <p className="mb-1">Brand</p>
      <h3 className="mt-1">Product name</h3>
      <p className="mt-2">Price</p>
    </div>
  </article>
</div>
```

Forms:

```tsx
<form className="space-y-6">
  <div>
    <label className="mb-2 block">Email</label>
    <input className="w-full px-4 py-4" />
    <p className="mt-2">Helper text</p>
  </div>
  <button className="mt-8 px-8 py-4">Submit</button>
</form>
```

## Responsive Behavior

Reduce spacing on smaller screens:

| Desktop | Mobile |
| ---: | ---: |
| `96px` | `48px` |
| `128px` | `64px` |
| `64px` | `32px` |
| `32px` | `16px` |

Use Tailwind patterns like:

```tsx
className="py-12 md:py-16 lg:py-24"
className="px-6 md:px-12 lg:px-20"
className="gap-4 md:gap-6 lg:gap-8"
className="mb-8 md:mb-12 lg:mb-16"
```

## Do Not

- Do not introduce one-off values like `13px`, `27px`, `35px`, or `py-[18px]`.
- Do not use `max-w-7xl` for primary storefront containers; use `max-w-[1440px]`.
- Do not use the same product grid gap on both axes; vertical rhythm should be roughly 2x horizontal.
- Do not keep desktop section padding on mobile.
- Do not hardcode inline spacing unless the value is a spacing token via `var(--space-*)`.

## Audit Notes

Current phase covered:

- Header height, gutters, nav spacing, menu panel spacing.
- Footer top/bottom padding, column gaps, link spacing, legal row spacing.
- Homepage hero, category strips, product sections, story, stats, trust strip, testimonials, and newsletter.
- Product grid card anatomy and grid gaps.
- Product listing toolbar, grid, and pagination spacing.
- Product detail page top offset, gallery/info gap, trust badges, option panel, and accordion spacing.

Future spacing passes should continue with account, checkout, wholesale, and editorial pages using the same scale.

## Before / After Examples

Header container:

```tsx
// Before
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px]" />

// After
<div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20 h-16 lg:h-20" />
```

Homepage product section:

```tsx
// Before
<section className="py-16 sm:py-20">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4" />
  </div>
</section>

// After
<section className="py-12 md:py-16 lg:py-24">
  <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12 lg:gap-x-8 lg:gap-y-16" />
  </div>
</section>
```

Global product grid:

```css
/* Before */
.product-grid-prem {
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}

/* After */
.product-grid-prem {
  grid-template-columns: repeat(4, 1fr);
  column-gap: var(--space-8);
  row-gap: var(--space-16);
}
```

## Review Checklist

- No new random spacing values.
- Section padding follows `48 / 64 / 96px`.
- Desktop containers use `1440px` with `80px` gutters.
- Mobile gutters use `24px`.
- Product grids use `16 / 24 / 32px` horizontal and `32 / 48 / 64px` vertical gaps.
- Forms use `24px` between fields and `32px` before primary action.
