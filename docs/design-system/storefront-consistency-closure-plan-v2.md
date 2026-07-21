# Storefront Consistency Closure Plan (v2)

## Goal

Convert the storefront from “major recovery completed” to a measurable consistency-closure state where the runtime uses one design-system contract, homepage layout uses one primitive layer, checkout owns its own chrome mode, and touched interaction patterns no longer depend on legacy local button or chip systems.

## Scope Lock

This closure pass is limited to the consumer storefront runtime in `storefront/src` plus its verification/docs layer. It does not claim every historical selector in the repository is globally unified unless the runtime consumer path is verified green.

## Closure Rules

1. `storefront/src/styles/tokens.css` remains the runtime source of truth.
2. New storefront TSX consumers must use shared `Button`/`IconButton` primitives or documented homepage primitives.
3. No new `--ink`, `--cream`, `--line`, `--soft`, or `--muted` runtime consumers.
4. No new homepage width formulas where `HomepageContainer` and related helpers already exist.
5. No new route-local pagination, filter-chip, or touch-target class systems where shared primitives can express the same pattern.

## Remaining Workstreams

### 1. Primitive Closure

- Replace remaining legacy runtime chip and pagination classes with shared button variants.
- Keep minimum touch targets at `44px` or above for pagination and tappable filter controls.
- Remove dead selector contracts after the runtime no longer consumes them.

### 2. CSS Ownership Reduction

- Remove duplicate ownership only after the runtime consumer is migrated.
- Treat deleted runtime selectors as the first duplicate-owner reduction step.
- Refresh ownership baseline only after audits, lint, verification, and build are all green.

### 3. Verification Noise Cleanup

- Keep design-system checks comment-proof and token-value based.
- Remove avoidable lint noise in helper scripts so the verification surface is easier to trust.
- Treat external-network fallbacks as resilience behavior, not storefront design regressions.

## Acceptance Criteria

- `npm.cmd run audit:design-system` passes.
- `npm.cmd run audit:design-system:metrics` passes with no legacy pagination/button class references in active storefront runtime paths touched by this closure pass.
- `npm.cmd run lint` passes.
- `npm.cmd run verify:design-system -- --pool=threads` passes.
- `npm.cmd run build` passes.
- The following runtime surfaces use shared primitives instead of legacy local chip/page-button systems:
  - bestsellers filters
  - search attribute chips
  - search overlay chips
  - listing pagination
  - catalog pagination
  - account orders pagination
  - mobile filter tag chips
- Any “100% consistency” statement must stay scoped to the verified storefront runtime and its touched design-system surfaces, not the entire repository history.
