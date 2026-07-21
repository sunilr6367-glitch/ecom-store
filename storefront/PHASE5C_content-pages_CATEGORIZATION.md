# Phase 5C: content-pages.css Categorization

## Summary
- Total: 73
- Category A: 9
- Category B: 29
- Category C: 35

> *Note: `rgba(var(--ds-*), opacity)` values were excluded from this table per rules.*

## Detailed Categorization

| Line | Current Value | Selector | Category | Proposed Fix |
|------|---------------|----------|----------|--------------|
| 6 | `padding: 0 0 clamp(72px, 8vw, 132px);` | `.content-page-band` | C | *Leave hardcoded (clamp)* |
| 11 | `width: min(100% - 32px, 1180px);` | `.content-shell, .content-layout` | C | *Leave hardcoded (layout calc)* |
| 20 | `padding: clamp(56px, 8vw, 112px) 0 clamp(44px, 6vw, 88px);` | `.content-hero` | C | *Leave hardcoded (clamp)* |
| 33 | `gap: 8px;` | `.content-breadcrumb` | A | `gap: var(--ds-space-xs);` |
| 34 | `margin-bottom: 28px;` | `.content-breadcrumb` | B | `margin-bottom: var(--ds-space-lg);` (nearest to 32px) |
| 69 | `margin: 14px auto 0;` | `.content-hero h1` | B | `margin: var(--ds-space-sm) auto 0;` (nearest to 16px) |
| 83 | `max-width: 720px;` | `.content-hero__intro` | C | *Leave hardcoded (layout)* |
| 84 | `margin: 22px auto 0;` | `.content-hero__intro` | B | `margin: var(--ds-space-md) auto 0;` (nearest to 24px) |
| 98 | `margin: 26px auto 0;` | `.content-hero__meta` | B | `margin: var(--ds-space-md) auto 0;` (nearest to 24px) |
| 100 | `padding-top: 14px;` | `.content-hero__meta` | B | `padding-top: var(--ds-space-sm);` (nearest to 16px) |
| 115 | `gap: 32px;` | `.content-layout` | A | `gap: var(--ds-space-lg);` |
| 116 | `padding-top: clamp(38px, 6vw, 76px);` | `.content-layout` | C | *Leave hardcoded (clamp)* |
| 151 | `scroll-margin-top: 120px;` | `.content-rich h2...` | C | *Leave hardcoded (anchor offset)* |
| 152 | `margin: clamp(48px, 7vw, 84px) 0 18px;` | `.content-rich h2...` | B | `margin: clamp(...) 0 var(--ds-space-sm);` |
| 164 | `scroll-margin-top: 120px;` | `.content-rich h3...` | C | *Leave hardcoded (anchor offset)* |
| 165 | `margin: 36px 0 12px;` | B | `.content-rich h3...` | `margin: var(--ds-space-lg) 0 var(--ds-space-xs);` |
| 175 | `margin: 28px 0 10px;` | `.content-rich h4` | B | `margin: var(--ds-space-lg) 0 var(--ds-space-xs);` |
| 189 | `margin: 0 0 22px;` | `.content-rich p...` | B | `margin: 0 0 var(--ds-space-md);` |
| 196 | `padding-left: 1.25rem;` | `.content-rich ul...` | B | `padding-left: var(--ds-space-sm);` (1.25rem = 20px) |
| 201 | `margin: 10px 0;` | `.content-rich li...` | B | `margin: var(--ds-space-xs) 0;` (nearest to 8px) |
| 202 | `padding-left: 4px;` | `.content-rich li...` | C | *Leave hardcoded (micro offset)* |
| 216 | `text-underline-offset: 4px;` | `.content-rich a...` | C | *Leave hardcoded (micro offset)* |
| 220 | `margin: clamp(34px, 5vw, 58px) 0;` | `.content-rich hr` | C | *Leave hardcoded (clamp)* |
| 227 | `min-width: 620px;` | `.content-rich table` | C | *Leave hardcoded (layout)* |
| 246 | `padding: 16px;` | `.content-rich table th/td` | A | `padding: var(--ds-space-sm);` |
| 256 | `margin: 30px 0;` | `.content-rich :has(> table)...` | B | `margin: var(--ds-space-lg) 0;` (nearest to 32px) |
| 278 | `padding: 16px 18px;` | `.content-toc summary` | B | `padding: var(--ds-space-sm);` (16px and 18px -> 16px) |
| 288 | `gap: 10px;` | `.content-toc ol` | B | `gap: var(--ds-space-xs);` (nearest to 8px) |
| 290 | `padding: 0 18px 18px;` | `.content-toc ol` | B | `padding: 0 var(--ds-space-sm) var(--ds-space-sm);` |
| 307 | `padding-left: 14px;` | `.content-toc .is-nested` | B | `padding-left: var(--ds-space-sm);` |
| 313 | `padding: clamp(34px, 5vw, 58px) 0;` | `.section-block...` | C | *Leave hardcoded (clamp)* |
| 319 | `margin: 0 0 24px;` | `.section-block__intro` | A | `margin: 0 0 var(--ds-space-md);` |
| 327 | `padding-top: 28px;` | `.legal-section` | B | `padding-top: var(--ds-space-lg);` (nearest to 32px) |
| 332 | `gap: 16px;` | `.info-grid` | A | `gap: var(--ds-space-sm);` |
| 339 | `padding: clamp(22px, 3vw, 30px);` | `.info-card` | C | *Leave hardcoded (clamp)* |
| 351 | `transform: translateY(-2px);` | `.info-card--link:hover` | C | *Leave hardcoded (transform)* |
| 355 | `margin: 0 0 8px;` | `.info-card__eyebrow` | A | `margin: 0 0 var(--ds-space-xs);` |
| 375 | `margin-top: 18px;` | `.info-card__cta` | B | `margin-top: var(--ds-space-sm);` |
| 376 | `border-bottom: 1px solid currentColor;` | `.info-card__cta` | C | *Leave hardcoded (border)* |
| 385 | `margin: 34px 0;` | `.highlight-box` | B | `margin: var(--ds-space-lg) 0;` (nearest to 32px) |
| 388 | `padding: 22px 24px;` | `.highlight-box` | B | `padding: var(--ds-space-md);` (22px and 24px -> 24px) |
| 400 | `gap: 24px;` | `.inline-cta` | A | `gap: var(--ds-space-md);` |
| 401 | `margin-top: clamp(44px, 6vw, 78px);` | `.inline-cta` | C | *Leave hardcoded (clamp)* |
| 404 | `padding: clamp(24px, 4vw, 42px);` | `.inline-cta` | C | *Leave hardcoded (clamp)* |
| 408 | `margin: 8px 0 0;` | `.inline-cta h2` | A | `margin: var(--ds-space-xs) 0 0;` |
| 414 | `margin: 12px 0 0;` | `.inline-cta p:not(.content-eyebrow)` | B | `margin: var(--ds-space-xs) 0 0;` (12px to 8px) |
| 422 | `gap: 12px;` | `.inline-cta__links` | B | `gap: var(--ds-space-xs);` |
| 427 | `gap: 14px;` | `.faq-accordion` | B | `gap: var(--ds-space-sm);` (14px to 16px) |
| 437 | `padding: 22px 24px;` | `.faq-accordion summary` | B | `padding: var(--ds-space-md);` |
| 448 | `padding: 0 24px 24px;` | `.faq-accordion p` | A | `padding: 0 var(--ds-space-md) var(--ds-space-md);` |
| 454 | `margin: clamp(42px, 6vw, 72px) 0;` | `.quote-block` | C | *Leave hardcoded (clamp)* |
| 455 | `padding: 0 0 0 clamp(22px, 4vw, 36px);` | `.quote-block` | C | *Leave hardcoded (clamp)* |
| 470 | `margin-top: 18px;` | `.quote-block figcaption` | B | `margin-top: var(--ds-space-sm);` |
| 480 | `gap: clamp(28px, 5vw, 64px);` | `.image-text-split` | C | *Leave hardcoded (clamp)* |
| 482 | `padding: clamp(46px, 7vw, 92px) 0;` | `.image-text-split` | C | *Leave hardcoded (clamp)* |
| 488 | `min-height: 320px;` | `.image-text-split__media` | C | *Leave hardcoded (layout)* |
| 513 | `margin-top: 10px;` | `.craft-story-section h2` | B | `margin-top: var(--ds-space-xs);` (nearest to 8px) |
| 516 | `@media (min-width: 768px) {` | `@media` | C | *Leave hardcoded (media query)* |
| 527 | `@media (min-width: 1024px) {` | `@media` | C | *Leave hardcoded (media query)* |
| 529 | `grid-template-columns: 240px minmax(0, 76ch);` | `.content-layout` | C | *Leave hardcoded (layout)* |
| 532 | `gap: clamp(48px, 6vw, 86px);` | `.content-layout` | C | *Leave hardcoded (clamp)* |
| 537 | `top: 112px;` | `.content-toc` | C | *Leave hardcoded (layout)* |
| 547 | `padding-left: 18px;` | `.content-toc__desktop` | B | `padding-left: var(--ds-space-sm);` |
| 551 | `margin: 0 0 18px;` | `.content-toc__desktop p` | B | `margin: 0 0 var(--ds-space-sm);` |
| 564 | `grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1fr);` | `.image-text-split` | C | *Leave hardcoded (layout)* |
| 568 | `grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);` | `.image-text-split--reverse` | C | *Leave hardcoded (layout)* |
| 576 | `@media (max-width: 767px) {` | `@media` | C | *Leave hardcoded (media query)* |
| 579 | `width: min(100% - 28px, 1180px);` | `.content-shell...` | C | *Leave hardcoded (layout)* |
| 618 | `min-width: 560px;` | `.content-rich table` | C | *Leave hardcoded (layout)* |
| 626 | `@media (min-width: 640px) {` | `@media` | C | *Leave hardcoded (media query)* |
| 628 | `grid-auto-columns: minmax(190px, 30%);` | `.watch-buy-carousel` | C | *Leave hardcoded (layout)* |
| 631 | `grid-auto-columns: minmax(320px, 46%);` | `.collections-carousel` | C | *Leave hardcoded (layout)* |
| 635 | `@media (min-width: 1024px) {` | `@media` | C | *Leave hardcoded (media query)* |
| 637 | `grid-auto-columns: minmax(220px, 23%);` | `.watch-buy-carousel` | C | *Leave hardcoded (layout)* |
| 640 | `grid-auto-columns: minmax(300px, calc((100% - 108px) / 4));` | `.collections-carousel` | C | *Leave hardcoded (layout)* |
