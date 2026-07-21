# Storefront Architecture Constitution & 100% Consistency Plan V4

Status: `ARCHITECTURE_V4_CERTIFIED`  
Branch: `codex/storefront-architecture-v4`  
Base: `origin/main` at `b7efe2b48671df8060e595016ad53ba32a740d4f`  
`ARCHITECTURE_V4_CERTIFIED_SHA=7ca181685d8c06d3ebcde703fbbe43526475f35a`  
Certified: 2026-07-08 by user approval (all audits green, 62/62 routes, 15/15 tests, build passed)

This constitution must be executed in full. V5 cannot shorten, replace, or reinterpret it. “100%” is a certification gate, not an agent claim.

## Frozen decisions

- Monochrome editorial palette; Amiri display and Cardo body/UI.
- Human-editable token source: `storefront/design-system/tokens.json`.
- Generated runtime CSS, TypeScript token types/names, and Tailwind bridge; generated files are never edited directly.
- Dedicated development-only component lab, typed route contract, and typed visual-exception registry.
- Screenshot matrix and explicit user sign-off; implementing agent cannot self-certify.
- One final deployment only after V4 and V5 approvals.

## Generated token constitution

The schema is primitive → semantic → component, validates reference direction, and rejects unresolved references. `generate:design-system --check` fails generated drift in CI.

| Role | Value |
|---|---|
| Page / paper | `#FFFFFF` |
| Soft / subtle | `#F7F7F7` / `#E5E5E5` |
| Primary / CTA | `#000000` |
| Secondary | `#333333` |
| Muted | `#666666` |
| CTA hover | `#1A1A1A` |
| Inverse | `#FFFFFF` |
| Gutters | `20 / 32 / 48px` |
| Section rhythm | `48 / 80px` |
| Widths | home `1520px`, standard `1440px`, narrow `860px` |

Gold is restricted to ratings and approved heritage metadata. Palette, font, or spacing changes require plan/spec updates, lab screenshots, and user approval.

## CSS cascade constitution

Global order is `theme → base → components → utilities`. Every stylesheet is explicitly layered; CSS Modules live in `components`. Unlayered runtime CSS, `!important`, broad descendant overrides, duplicate owners, and specificity-budget violations fail. Responsive rules stay with their component owner. Broad theme/responsive/mobile override files are removed after migration.

## Public design-system API

Routes consume only `@/design-system`: `PageShell`, `PageContainer`, `PageHeader`, `Heading`, `Text`, `Section`, `SectionHeader`, `Stack`, `Cluster`, `ScrollRail`, `Button`, `ButtonLink`, `IconButton`, `Card`, form controls, `Modal`, `Drawer`, `EmptyState`, and `StatusBanner`.

Routes may not construct visual classes, raw display sizes, local containers, or styled native controls. Hero/page/section/card headings; body/label/metadata/price; buttons/chips/pagination; and card roles have fixed named variants.

## Typed route and exception contracts

Every `app/**/page.tsx` has a registry entry containing route pattern, page kind, chrome mode, width, surface, heading role, allowed components, required visual states, approved exceptions, and deterministic fixture. Filesystem-to-registry drift fails.

Intentional differences live only in a typed registry with id, route/component, property, allowed value, reason, owner, review date, and test reference. Expired, unreferenced, inline, or markdown-only exceptions fail. Additions require a separate reviewed commit and screenshot evidence.

## Development-only component lab

`/__design-system` renders only when `DESIGN_SYSTEM_LAB=true`; production returns 404. It covers every variant/state, responsive widths, long text, invalid/missing media, empty/one/many data, sale/wholesale/multi-currency pricing, modal/drawer stacking, reduced motion, keyboard order, and focus. Component and route screenshots are versioned separately.

## Gated migration waves

1. Generated tokens, cascade layers, and public API.
2. Header/footer/chrome.
3. Homepage.
4. Products, search, bestsellers, and discovery.
5. Collections and category routes.
6. PDP, cart, and wishlist.
7. Auth and account.
8. Checkout.
9. Reels and editorial/help pages.
10. Wholesale routes.
11. Legacy removal.

Each wave runs component-lab, route tests, build, and visual matrix without production deployment. `kv-container`, `kv-page-container`, legacy `*-prem`, local heading/button/card/form systems, compatibility aliases, and broad overrides are removed only after zero consumers. Features, CMS behavior, SEO, APIs, URLs, and business logic remain.

## Automated enforcement

AST-based gates enforce registered `PageShell`, no route-local styled H1, no visual arbitrary values outside implementation, no route deep imports, no styled native controls, no undocumented radius/surface/gutter, compiled semantic utilities, runtime Amiri/Cardo, 44×44 targets, no overflow/layout-shifting states, zero new legacy consumers/duplicate owners/unlayered CSS/stale generated files/route gaps/expired exceptions. Documentation metrics are code-generated. Baselines only decrease; one commit cannot both fail an audit and increase its baseline.

## Required evidence matrix

Viewports: `375`, `768`, `1024`, `1440`. States: populated, empty, loading, recoverable error, authenticated/unauthenticated, empty/populated cart, standard/sale/wholesale pricing, missing media, and long CMS copy. Coverage includes every route, lab variant, chrome, navigation/search/filter/cart/wishlist, PDP, auth/account, checkout, reels, and wholesale.

Required checks: screenshot difference ≤ `0.1%`; computed fonts/roles/gutters/rhythm/surfaces/radii; touch/focus/overflow/card geometry; no unexpected console/network failure; no layout shift; reduced-motion and keyboard behavior.

The generated architecture certificate records implementation SHA, schema/artifact hashes, registry coverage, exceptions, lab and screenshot results, computed styles, console/network failures, command exits, and legacy counts. A prose summary is not a substitute.

## Responsibility and completion gate

- Implementing agent: migration, feature preservation, verification, evidence truth.
- CI: generated tokens, AST rules, route registry, CSS ownership, visual enforcement.
- User: architecture evidence and screenshot approval.
- Agent cannot approve its own certificate or say “100% complete” beforehand.

V4 is certified only with 100% registered route/state and component-lab architecture coverage; zero legacy layout consumers, local heading systems, unmanaged controls, unlayered/duplicate CSS owners, undocumented exceptions, and unexpected failures; all gates green; and explicit user approval.

Only then may the exact output be declared: `ARCHITECTURE_V4_CERTIFIED_SHA=<exact SHA>`. V5 must branch from that exact SHA.
