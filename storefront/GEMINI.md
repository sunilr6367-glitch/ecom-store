# Odhvica Storefront — Gemini/IDX Rules
# Paste this context to Gemini before any UI task in IDX.
# Or reference: "Follow rules in GEMINI.md"

## IDENTITY
You are working on Odhvica — an Indian handcraft e-commerce 
storefront built with Next.js + Tailwind CSS v4 + custom 
CSS design tokens.

## MANDATORY FIRST STEPS (every session)
1. Read src/styles/tokens.css — know all available tokens
2. Read DESIGN_SYSTEM.md — understand the system
3. Read the component file you are about to change
4. THEN make changes

## THE ONE RULE
Every visual value MUST come from tokens.css via --ds-* tokens.
No exceptions. No shortcuts.

## PHASE STATUS
- Phases 5A-5D: All complete
- Phase 5E: Visual check complete

## AUDIT FALSE POSITIVES & EXCEPTIONS
- **rgba(var(--ds-*), opacity)**: This pattern is CORRECT and intentional for transparent overlays. Do not flag as a violation.
- **Rule 2**: Blur radius and filter values are NOT spacing. They are intentional and should be left hardcoded.
- **Rule 3**: `48px` and `64px` magic numbers are sometimes intentional to avoid risk with `--ds-space-xl` and `--ds-space-2xl`, as those are fluid `clamp()` values which could cause layout breakage in strict bounds.

## CURRENT STATUS — MAINTENANCE MODE

Design system migration: COMPLETE ✅

All phases done:
- Phase 1-4: Foundation, primitives, homepage, CSS hygiene ✅
- Phase 5A: Content pages TSX ✅
- Phase 5B: pdp.css ✅
- Phase 5C: 17 CSS files ✅
- Phase 5D: 7 TSX components ✅
- Phase 5E: Visual regression check ✅
- Phase 6: Documentation sync ✅

## ONGOING MAINTENANCE RULES

New component banao → follow token rules from day 1
New token chahiye → tokens.css mein add karo only
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
--ds-text-primary: #1A1A1A (main text)
--ds-text-secondary: #666666 (secondary text)
--ds-text-muted: #7f756e (muted/placeholder)
--ds-text-inverse: white (text on dark bg)
--ds-surface-page: #FFFFFF (page background)
--ds-surface-paper: #FFFFFF (card background)
--ds-surface-soft: #F7F7F7 (subtle bg)
--ds-surface-warm: #F5F5F5 (warm tinted bg)
--ds-accent-primary: brand terracotta (buttons, CTAs)
--ds-accent-gold: #B89B5E (gold accents, eyebrows)
--ds-accent-hover: #9E8148 (hover state)
--ds-border-subtle: #E5E5E5 (light borders)
--ds-border-strong: #7f756e (strong borders)

### Spacing
--ds-space-xs: 8px
--ds-space-sm: 16px
--ds-space-md: 24px
--ds-space-lg: 32px
--ds-space-xl: fluid clamp (48px→80px)
--ds-space-2xl: fluid clamp (64px→120px)

### Z-index
--ds-z-dropdown: 50
--ds-z-sticky: 100
--ds-z-overlay: 200
--ds-z-modal: 300

### Typography
--ds-font-display: Libre Caslon Text (headings)
--ds-font-body: Hanken Grotesk (body text)
--ds-font-ui: same as body (buttons, inputs)

### Radius
--ds-radius-sm, --ds-radius-md, --ds-radius-lg, --ds-radius-pill

### Transitions
--ds-transition: cubic-bezier(0.25, 0.46, 0.45, 0.94)
--ds-transition-fast: 150ms ease
--ds-transition-normal: 220ms ease

## DO NOT TOUCH THESE (Shared Primitives)
These CSS classes are intentionally kept as CSS.
Never convert to Tailwind. Never delete. Never modify 
without explicit instruction:

.homepage-container (11 consumers — complex responsive gutters)
.homepage-section (5 consumers — 1100px breakpoint)
.homepage-section-head (4 consumers)
.homepage-eyebrow (6 consumers — modifier rules)
.homepage-hero-scrim (complex gradient)
.homepage-campaign-scrim (shared block)
.homepage-featured-overlay (shared with campaign-scrim)
.kv-* classes (universal primitives in utilities.css)

## JS HOOK — NEVER REMOVE FROM DOM
.homepage-circle-link — used in closest() for keyboard nav
Even if you remove its CSS rule, keep className on element.

## FILE OWNERSHIP
New token → tokens.css ONLY
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
