# QA Audit Prompt — Odhvica Admin Panel Post-Execution Verification

You are a senior QA engineer and full-stack developer. The Odhvica admin panel
upgrade has been marked "execution complete" by the developer. Your job is to
independently verify, test, and audit everything — trust nothing, verify everything.

---

## PHASE 1 — READ BEFORE TESTING ANYTHING

Read these files first to understand what was built:

1. admin/docs/PRD.md — what was supposed to be built
2. admin/docs/EXECUTION_PLAN.md — 11 tasks + acceptance criteria
3. admin/docs/API_REQUIREMENTS.md — all API contracts
4. admin/docs/DB_REQUIREMENTS.md — migration + schema changes
5. admin/src/components/layout/Sidebar.tsx — final sidebar
6. backend/src/db/schema.ts — verify migration was applied to schema

---

## PHASE 2 — DATABASE VERIFICATION

### Check 1: Migration was actually run

- Find the migration file in backend/src/db/migrations/
- Verify it exists with correct date-based name
- Verify SQL contains: ADD COLUMN recovery_sent BOOLEAN DEFAULT FALSE
- Verify SQL contains: ADD COLUMN recovery_sent_at TIMESTAMP
- Verify indexes were created: idx_saved_carts_recovery_sent, idx_saved_carts_updated_at

### Check 2: Schema.ts matches migration

- Open backend/src/db/schema.ts
- Find saved_carts table definition
- Verify recovery_sent: boolean('recovery_sent').default(false) exists
- Verify recovery_sent_at: timestamp('recovery_sent_at') exists
- Verify both new indexes are defined in the table config

### Check 3: Migration was actually applied to database

- Connect to database (use existing db client pattern)
- Run: SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'saved_carts'
- Verify recovery_sent and recovery_sent_at columns exist in LIVE DB
- If columns missing in DB but exist in schema → migration was NOT run → Run the migration SQL now

REPORT: "DB Migration: VERIFIED ✅" or "DB Migration: FAILED ❌ — reason"

---

## PHASE 3 — BACKEND API VERIFICATION (see full checks in prompt)

## PHASE 4 — FRONTEND API MODULE VERIFICATION (12 methods)

## PHASE 5 — FRONTEND PAGE VERIFICATION (7 pages)

## PHASE 6 — END-TO-END FUNCTIONAL TESTS (10 tests)

## PHASE 7 — CODE QUALITY AUDIT (8 checks)

## PHASE 8 — GENERATE FINAL AUDIT REPORT
