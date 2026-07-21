# Kvastram Commerce Template Engineering Rules

These rules apply to humans and AI agents working in this reusable template.

## Safety boundary

- This repository is a product template, not a configured production store.
- No production deployment target is enabled by default.
- Every client must use an independent repository, database, media store, secrets,
  payment accounts, email sender, Docker project name, volumes, and deployment path.
- Never copy real credentials or customer/order data into this template.
- Do not add automatic production deployment until a client-specific review approves
  the exact repository, domains, server path, secrets, rollback, and health checks.

## Before editing

1. Inspect `git status --short` and preserve unrelated work.
2. Work on a feature branch.
3. Read the surrounding schemas, routes, configuration, and tests before changing code.
4. Run `npm run setup:repository` once per clone to activate shared Git hooks.

## Architecture

- Storefront runtime design tokens are generated from
  `storefront/design-system/tokens.json`; never edit generated artifacts directly.
- Use the shared storefront design-system primitives and `--ds-*` tokens.
- Do not introduce broad CSS overrides or duplicate selector ownership.
- Preserve CMS behavior, SEO, APIs, URLs, business logic, accessibility, and empty-state
  behavior during branding or client customization.
- Empty CMS sections render nothing and never expose admin instructions publicly.
- Brand identity and contact details come from environment-backed configuration, not
  hardcoded client names, domains, emails, phone numbers, or addresses.

## Required verification

For storefront changes run:

```text
npm.cmd run audit:design-system
npm.cmd run audit:design-system:metrics
npm.cmd run lint
npm.cmd run verify:design-system -- --pool=threads
npm.cmd run build
```

For backend and admin changes run their lint, tests where available, and production
builds. Run Playwright desktop/mobile smoke tests for visual or layout changes.

## Documentation

- `docs/project_features_guide.md` must never be deleted, moved, or truncated.
- Update it whenever functionality, configuration, dependencies, operational commands,
  or onboarding requirements change.

## Publishing

- Do not push or deploy unless the user explicitly requests it.
- Deployment must use a reviewed client-specific CI/CD workflow.
- Never deploy manually from a local development checkout.
- Verify the deployed Git SHA through `/health` after every deployment.
