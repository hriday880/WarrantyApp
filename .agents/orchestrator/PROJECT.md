# Project: Warranty App (Admin User Management & Premium UI Redesign)

## Architecture
- **Framework**: Next.js 16.2.10 (App Router), React 19.2.4
- **ORM & DB**: Prisma ORM 6.19.3 + LibSQL (`@prisma/adapter-libsql`)
- **Auth**: JWT via `jose` stored in HTTP-only `auth_token` cookie
- **Styling**: CSS Modules + Tailwind CSS v4

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Create automated E2E test runner covering R1, R2, R3 (Tiers 1-4) | None | IN_PROGRESS |
| M1 | Admin Schema & APIs | Add `isBanned` field to `User`, create 3 admin endpoints, enforce ban guards | E2E setup | PLANNED |
| M2 | Premium UI/UX Redesign | Redesign Login, Dashboard, Scan, Admin pages & integrate Admin User Management UI | M1 | PLANNED |
| M3 | Final Integration & Gate | 100% E2E tests passing + Adversarial audit & Forensic audit | M1, M2, E2E | PLANNED |

## Interface Contracts

### Admin User Management APIs
- `GET /api/admin/users`:
  - Auth: Admin session required (`role === 'ADMIN'`).
  - Response: `{ users: Array<{ id, phoneNumber, name, creditPoints, isBanned, createdAt, _count: { scans } }> }`
- `POST /api/admin/users/[id]/clear-credits`:
  - Auth: Admin session required.
  - Response: `{ success: true, user: { id, creditPoints: 0 } }`
- `POST /api/admin/users/[id]/toggle-ban`:
  - Auth: Admin session required.
  - Response: `{ success: true, user: { id, isBanned: boolean } }`

### Preservation Contracts (R3)
- `POST /api/auth/login`:
  - Input: `{ phoneNumber: string, name: string }`
  - Output: HTTP 200 `{ success: true }` + `auth_token` cookie (or HTTP 403 `{ error: string }` if user is banned).
- `POST /api/scan/[id]`:
  - Auth: Valid user session required.
  - Output: HTTP 200 `{ product, scan, isFirstScan }` (or HTTP 403 if user is banned).

## Code Layout
- `prisma/schema.prisma`: Database models (`User`, `Product`, `ScanHistory`)
- `lib/prisma.ts`: Prisma Client initialization with LibSql adapter
- `lib/auth.ts`: JWT auth helpers
- `app/api/admin/users/`: Admin user management routes
- `app/api/auth/login/route.ts`: Customer login endpoint
- `app/api/scan/[id]/route.ts`: Scan claim endpoint
- `app/admin/dashboard/`: Admin dashboard page & user management UI
- `app/dashboard/`: Customer dashboard page
- `app/login/`: Customer login page
- `app/scan/[id]/`: Scan page & ScanClient
