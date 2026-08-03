## 2026-08-01T13:53:09Z
You are a Worker subagent for Milestone 1 (Admin Database Schema & APIs). Your working directory is /Users/hriday/Documents/Warranty/.agents/m1_worker_3.

Your task is to implement Requirement R1 (Admin User Management Backend):
1. Database Schema Update:
   - Edit `prisma/schema.prisma` to add `isBanned Boolean @default(false)` to the `User` model.
   - Run `npx prisma generate` and `npx prisma db push` to synchronize the database schema.
2. New Admin API Endpoints:
   - Implement `GET /api/admin/users` in `app/api/admin/users/route.ts` (requires Admin auth session, returns customer list with credit points, ban status, scan counts).
   - Implement `POST /api/admin/users/[id]/clear-credits` in `app/api/admin/users/[id]/clear-credits/route.ts` (resets user credit points to 0).
   - Implement `POST /api/admin/users/[id]/toggle-ban` in `app/api/admin/users/[id]/toggle-ban/route.ts` (toggles user `isBanned` state).
3. Auth & Scan Ban Guards (preserving R3 baseline):
   - In `app/api/auth/login/route.ts`, check if user `isBanned === true`. If banned, return HTTP 403 Forbidden (`{ error: 'Your account has been banned. Please contact support.' }`).
   - In `app/api/scan/[id]/route.ts` and `app/api/product-check/[id]/route.ts`, check if authenticated user `isBanned === true`. If banned, return HTTP 403 Forbidden.
4. Verification:
   - Fix function declaration order in `app/scan/[id]/page.tsx` if needed.
   - Run `npm run lint` and `npm run build` to verify there are no compilation or syntax errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your handoff report with build/test results to `/Users/hriday/Documents/Warranty/.agents/m1_worker_3/handoff.md`. Send a message when finished.
