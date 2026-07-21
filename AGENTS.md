# Odhvica Engineering Rules

These rules apply to humans and AI agents working in this repository.

## Storefront Master Phase Gate (Mandatory)

- Current state: `ARCHITECTURE_V4_IN_PROGRESS`.
- Read `docs/design-system/storefront-architecture-consistency-plan-v4.md` and `docs/design-system/storefront-visual-art-direction-plan-v5.md` before storefront work.
- V4 is the complete architecture constitution. V5 may not shorten, replace, reinterpret, or begin before an exact V4 SHA has a truthful certificate and explicit user approval.
- V4 work occurs only on `codex/storefront-architecture-v4`. Production deployment and pushes to `main` are locked during V4.
- Generated design-system artifacts must never be edited directly; edit `storefront/design-system/tokens.json` and run the generator.
- Frozen architecture direction, audit baselines, route contracts, and exceptions may not be silently changed to make a gate pass.
- Features, CMS behavior, SEO, APIs, URLs, and business logic may be migrated but not removed.
- Green tests alone are not completion evidence. The implementing agent cannot approve its own certificate or claim `100% complete` before certificate evidence and user screenshot approval.
- Rejected screenshots keep the phase incomplete. V5 architecture-freeze failures set `BLOCKED_FOR_ARCHITECTURE_REVIEW`.
- Only after both user approvals may the certified result merge once to `main`; deployment remains GitHub Actions-only.

## Canonical Sources

- GitHub source of truth: `origin/main`
- Production checkout: `/root/odhvica-ecommerce`
- Storefront tokens: `storefront/src/styles/tokens.css`
- Storefront design-system specification: `docs/design-system/storefront-design-system-v1.md`
- Production deployment workflow: `.github/workflows/deploy-hostinger.yml`

## Before Editing

1. Run `git fetch origin main`.
2. Confirm the work starts from `origin/main`.
3. Use a fresh feature branch, or push directly to `main` for rapid UI/design iteration.
4. Inspect `git status --short` and preserve unrelated user changes.
5. Do not use an old worktree as a deployment source.
6. Run `npm run setup:repository` once per clone to activate shared Git hooks.

## Storefront Rules

- Use `--ds-*` tokens and shared primitives.
- Do not create broad CSS overrides or a second owner for an existing selector.
- Do not change typography or palette tokens without updating the active design-system specification.
- Empty CMS sections must render nothing, never public admin instructions.
- Hero images should not contain baked-in copy when HTML hero copy is enabled.

## Required Verification

For storefront changes run:

```text
npm.cmd run audit:design-system
npm.cmd run audit:design-system:metrics
npm.cmd run lint
npm.cmd run verify:design-system -- --pool=threads
npm.cmd run build
```

Run Playwright desktop/mobile smoke tests for visual or layout changes.

## Publishing

- Do not deploy with a manual `docker compose up` command.
- Do not deploy from any path except `/root/odhvica-ecommerce`.
- Production deploys only through `.github/workflows/deploy-hostinger.yml`.
- Verify the deployed Git SHA through `/health` after deployment.

## Prohibited

- Resetting or deleting unrelated user work
- Deploying from `/root/odhvica-platform` or any alternate checkout
- Running multiple Compose projects against the same production ports
- Silently changing the design-system typography or accent contract

## Deployment workflow — MANDATORY, no exceptions

This project deploys via GitHub Actions CI/CD. The correct and ONLY workflow is:

1. Make code changes locally.
2. Test locally (and in a local Docker build if relevant).
3. Commit and push to the `main` branch on GitHub.
4. The GitHub Actions workflow automatically builds and deploys to the VPS.

NEVER SSH directly into the VPS to:
- Manually run `docker compose up --build`, `docker compose restart`, or any 
  deployment command.
- Manually edit files, environment variables, or configs on the server.
- Manually tag/swap Docker images as a "fix."

If production is broken and needs an emergency rollback, the correct action is to 
revert the problematic commit(s) on GitHub and let the CI/CD pipeline redeploy the 
reverted code — not to manually intervene on the VPS. Manual VPS changes create 
drift between what's in GitHub and what's actually running, which is exactly what 
caused confusion in this incident (the running production code no longer matched 
any commit in git history).

If manual VPS access is absolutely unavoidable (e.g. reading logs for debugging), 
it must be read-only investigation only — no state-changing commands — and must be 
reported back before any follow-up action is taken.

## Feature Development & Coding Standards

- **Pre-Audit First:** Always pre-audit the codebase (via reading schemas, routes, and configs) where new code will be injected. Do not blindly append code without understanding the surrounding architecture.
- **Clean Code & Professional Architecture:** Write clean, modular, and DRY (Don't Repeat Yourself) code. Avoid messy or dirty hacks. Follow the existing patterns used in the Hono/Drizzle backend or Next.js storefront.
- **Step-by-Step Verification:** Test each feature independently as it is built. Do not write monolithic features without validating the intermediate steps.
- **Codebase Re-verification:** After finishing a task, re-verify the codebase functionality (by running tests, linters, or manual endpoints) rather than relying only on theoretical walkthroughs. Ensure the actual implementation holds up.

## Project Features Guide Maintenance

- **Preservation Mandatory**: The [Project Features Guide](file:///e:/Kvastram%20projects/docs/project_features_guide.md) must **NEVER** be deleted, moved, or truncated under any condition.
- **Continuous Documentation**: Whenever a new feature (no matter how small or large) is introduced or modified in this codebase, the agent **MUST** update `docs/project_features_guide.md` with a detailed explanation containing:
  - Technical functionality and flow
  - User requirements, settings, credentials, DLT setups, or configurations
  - Edge cases, dependencies, and operational commands.
