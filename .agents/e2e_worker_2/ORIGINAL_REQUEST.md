## 2026-08-01T13:30:46Z
<USER_REQUEST>
You are an E2E Test Suite Author subagent. Your working directory is /Users/hriday/Documents/Warranty/.agents/e2e_worker_2.

Your task is to create a comprehensive, automated E2E test runner script at `/Users/hriday/Documents/Warranty/scripts/test-e2e.ts` that uses `tsx` or `node` to test all acceptance criteria:

1. R1 Acceptance Criteria:
   - Programmatic test: Admin API bans a user, verifies `isBanned === true` in database via Prisma / API.
   - Programmatic test: Admin API clears a user's credits, verifies `creditPoints === 0` in database / API.
   - Programmatic test: If a user is banned, verify `/api/auth/login` returns HTTP 403 and `/api/scan/[id]` returns HTTP 403.
2. R2 Verification:
   - Page load test: Verify `/login`, `/dashboard`, `/scan/[id]`, `/admin/login`, `/admin/dashboard` return HTTP 200 without server errors.
3. R3 Acceptance Criteria:
   - Baseline preservation test: Verify `/api/auth/login` works for non-banned users and sets HTTP-only `auth_token` cookie.
   - Baseline preservation test: Verify `/api/scan/[id]` awards points on first scan and increments credit balance, while subsequent scans do not double-count points.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Run your test script using `npx tsx scripts/test-e2e.ts` to test. Once complete, publish `TEST_READY.md` at project root `/Users/hriday/Documents/Warranty/TEST_READY.md` and write your handoff report to `/Users/hriday/Documents/Warranty/.agents/e2e_worker_2/handoff.md`. Communicate progress via `send_message`.
</USER_REQUEST>
