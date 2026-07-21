# Odhvica Storefront — Codex Agent Rules
# Auto-loaded by ChatGPT Codex. Read fully before any task.

## IDENTITY
You are working on Odhvica — an Indian handcraft e-commerce 
storefront built with Next.js + Tailwind CSS v4 + custom 
CSS design tokens.

## MANDATORY FIRST STEPS (every session)
1. Read `../docs/design-system/storefront-architecture-consistency-plan-v4.md`.
2. Read `../docs/design-system/storefront-visual-art-direction-plan-v5.md`.
3. Read `design-system/tokens.json`; generated token artifacts are read-only.
4. Read the target component and its route contract before editing.

## THE ONE RULE
Every visual value MUST come from tokens.css via --ds-* tokens.
No exceptions. No shortcuts.

## PHASE STATUS
- Current state: `ARCHITECTURE_V4_IN_PROGRESS`.
- All earlier migration-complete and 100%-consistency claims are revoked.
- V5 is locked until an exact V4 SHA has a truthful certificate and explicit user approval.
- No production deployment or `main` push is allowed during V4.

## AUDIT FALSE POSITIVES & EXCEPTIONS
- **rgba(var(--ds-*), opacity)**: This pattern is CORRECT and intentional for transparent overlays. Do not flag as a violation.
- **Rule 2**: Blur radius and filter values are NOT spacing. They are intentional and should be left hardcoded.
- **Rule 3**: `48px` and `64px` magic numbers are sometimes intentional to avoid risk with `--ds-space-xl` and `--ds-space-2xl`, as those are fluid `clamp()` values which could cause layout breakage in strict bounds.

## CURRENT STATUS — ARCHITECTURE RECOVERY

The storefront is not certified. The implementing agent owns migration accuracy,
feature preservation, verification, and evidence truth, but cannot self-approve.
Generated artifacts, protected architecture surfaces, baselines, and typed exceptions
cannot be edited to hide regressions. Rejected screenshots mean incomplete work.

## ONGOING MAINTENANCE RULES

New component banao → follow token rules from day 1
New token chahiye → `design-system/tokens.json` edit karo, generator run karo
Audit scripts CI pe run hote hain automatically
Koi bhi hardcoded value → Rule 1 dekho

## NEXT CODEX SESSION

Koi naya kaam aaye toh:
1. AGENTS.md padho pehle
2. tokens.css padho
3. Target file padho
4. Audit karo → categorize karo → fix karo → verify karo → commit karo

## NEVER DO THIS
- Hardcoded hex: color: #1A1A1A ❌
- Raw values: padding: 16px ❌  
- Legacy aliases: var(--ink), var(--cream), var(--line) ❌
- Old Tailwind: text-brand-gold, text-brand-ink ❌
- New BEM classes: className="my-new-section" ❌
- Inline z-index: z-index: 999 ❌
- Skip audit scripts ❌

## ALWAYS DO THIS
- Colors: text-[var(--ds-text-primary)] ✅
- Backgrounds: bg-[var(--ds-surface-soft)] ✅
- Spacing: p-[var(--ds-space-md)] ✅
- Fonts: font-display, font-body, font-ui ✅
- Z-index: z-[var(--ds-z-modal)] ✅
- Transitions: motion-safe:transition-[var(--ds-transition)] ✅
- Focus: focus-visible:outline-[var(--ds-accent-primary)] ✅

## TOKEN QUICK REFERENCE

### Colors
--ds-text-primary: #000000
--ds-text-secondary: #333333
--ds-text-muted: #666666
--ds-text-inverse: #FFFFFF
--ds-surface-page: #FFFFFF
--ds-surface-paper: #FFFFFF
--ds-surface-soft: #F7F7F7
--ds-accent-primary: #000000
--ds-accent-hover: #1A1A1A
--ds-border-subtle: #E5E5E5
Gold is restricted to ratings and approved heritage metadata.

### Spacing
--ds-space-xs: 8px
--ds-space-sm: 16px
--ds-space-md: 24px
--ds-space-lg: 40px
--ds-space-xl: fluid clamp (48px→80px)
--ds-space-2xl: fluid clamp (64px→120px)

### Z-index
--ds-z-dropdown: 50
--ds-z-sticky: 100
--ds-z-overlay: 200
--ds-z-modal: 300

### Typography
--ds-font-display: Amiri bridged through next/font (headings)
--ds-font-body: Cardo bridged through next/font (body text)
--ds-font-ui: same as body (buttons, inputs)

### Homepage layout
--ds-home-gutter-mobile: 20px
--ds-home-gutter-tablet: 32px
--ds-home-gutter-desktop: 48px
--ds-home-section-space-mobile: 48px
--ds-home-section-space-desktop: 80px
Homepage sections should use HomepageContainer/HomepageSection primitives instead of ad-hoc width formulas.
Horizontal homepage rails must use homepageScrollRailClassName so flex row and overflow behavior stay inseparable.

### Radius
--ds-radius-sm, --ds-radius-md, --ds-radius-lg, --ds-radius-pill

### Transitions
--ds-transition: cubic-bezier(0.25, 0.46, 0.45, 0.94)
--ds-transition-fast: 150ms ease
--ds-transition-normal: 220ms ease

## MIGRATION-SENSITIVE SHARED PRIMITIVES
Preserve behavior and JS hooks while migrating consumers. Legacy layout classes
may be removed only after consumer count reaches zero and replacement coverage is proven:

.homepage-container (11 consumers — complex responsive gutters)
.homepage-section (5 consumers — 1100px breakpoint)
.homepage-section-head (4 consumers)
.homepage-eyebrow (6 consumers — modifier rules)
.homepage-hero-scrim (complex gradient)
.homepage-campaign-scrim (shared block)
.homepage-featured-overlay (shared with campaign-scrim)
.kv-* classes (legacy universal primitives; migrate consumer-first)

## JS HOOK — NEVER REMOVE FROM DOM
.homepage-circle-link — used in closest() for keyboard nav
Even if you remove its CSS rule, keep className on element.

## FILE OWNERSHIP
New token → `design-system/tokens.json` ONLY; regenerate artifacts
New typography → typography.css
New animation → animations.css  
Home section primitive → home-sections.css
Component CSS → component's own scoped CSS file
NEVER mix component CSS into wrong file

## BEFORE EVERY COMMIT — RUN THESE
npm run audit:design-system
npm run audit:css-ownership  
npm run build

All three must pass. If any fails — fix before committing.

## VERIFICATION CHECKLIST
[ ] Zero hardcoded hex values added
[ ] Zero legacy aliases used
[ ] Zero new BEM classes created
[ ] Shared primitives untouched
[ ] JS hook classes still on DOM
[ ] Both audits pass
[ ] Build: 57/57 pages

## WHEN ADDING NEW COMPONENT
1. Read tokens.css first
2. Tailwind utilities for layout only
3. var(--ds-*) for all visual values
4. No new CSS unless gradient/complex animation
5. Run audits

## WHEN MODIFYING EXISTING COMPONENT  
1. Read full file first
2. Identify shared primitives (keep them)
3. Identify JS hook classes (keep on DOM)
4. Change using tokens only
5. Run audits
