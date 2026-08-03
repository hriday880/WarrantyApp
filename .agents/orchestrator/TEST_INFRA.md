# E2E Test Infra: Warranty App

## Test Philosophy
- Opaque-box, requirement-driven E2E tests for R1, R2, R3.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Requirement | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-------------|:------:|:------:|:------:|:------:|
| 1 | Admin User List & Data | R1 | 5 | 5 | ✓ | ✓ |
| 2 | Admin Clear Credits API | R1 | 5 | 5 | ✓ | ✓ |
| 3 | Admin Ban / Unban Toggle API | R1 | 5 | 5 | ✓ | ✓ |
| 4 | Banned User Login Restriction | R1 | 5 | 5 | ✓ | ✓ |
| 5 | Banned User Scan Point Restriction | R1 | 5 | 5 | ✓ | ✓ |
| 6 | Premium UI/UX Design System | R2 | 5 | 5 | ✓ | ✓ |
| 7 | Auth Login Preservation | R3 | 5 | 5 | ✓ | ✓ |
| 8 | Scan & Points Preservation | R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: Node.js script executing HTTP API calls & Database validations (e.g. `npx tsx scripts/test-e2e.ts`)
- **Assertions**: HTTP Status codes, JSON payloads, Database model field verification.
