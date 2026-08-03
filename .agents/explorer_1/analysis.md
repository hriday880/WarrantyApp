# Codebase Analysis & Requirements Mapping Report

**Project**: Warranty & Loyalty Scanning Application (`warranty-app`)  
**Date**: August 1, 2026  
**Author**: Explorer Agent (`explorer_1`)  
**Target Path**: `/Users/hriday/Documents/Warranty`  

---

## 1. Executive Summary

The **Warranty Application** is a Next.js (App Router) web application designed for a dual-user workflow:
1. **Factory / Admin Users**: Mass-generate QR codes for manufactured products with custom serial number prefixes, warranty durations (in months), and credit point values.
2. **Customer / Electrician Users**: Scan QR codes on products to claim credit points (awarded on the first scan), activate product warranties, track expired/active warranties, and view earned points on a customer dashboard.

The application uses **Next.js 16.2.10**, **React 19.2.4**, **Prisma ORM 6.19.3** with **LibSQL / Turso** database adapter, **JWT authentication** via `jose` stored in `auth_token` HTTP-only cookies, and **CSS Modules + Tailwind CSS v4** for styling.

---

## 2. Tech Stack & Infrastructure

| Layer / Aspect | Technology / Package | Details & Configuration |
|---|---|---|
| **Framework** | Next.js `16.2.10` | App Router (`/app`), React Server Components & Client Components |
| **UI Library** | React `19.2.4` & React DOM `19.2.4` | Uses React 19 hooks including `use(params)` for async route params |
| **Language** | TypeScript `^5` | Strict mode enabled (`tsconfig.json`), `@types/node` `^20` |
| **Styling** | Tailwind CSS `^4` & CSS Modules | `@tailwindcss/postcss` setup in `postcss.config.mjs`, CSS Modules (`*.module.css`) for all pages |
| **Fonts & Icons** | Inter & Geist Fonts | Google Font Inter imported in CSS, Geist & Geist_Mono loaded in root `layout.tsx` |
| **Database ORM** | Prisma ORM `^6.19.3` | Schema located at `prisma/schema.prisma` |
| **Database Engine** | SQLite / LibSQL (Turso) | `@prisma/adapter-libsql` `^7.9.0` & `@libsql/client` `^0.17.4` instantiated in `lib/prisma.ts` |
| **Auth & Security** | JWT (`jose` `^6.2.3`), `bcryptjs` `^3.0.3` | Token payload `{ id, role }`, stored in HTTP-only `auth_token` cookie |
| **Utilities** | `qrcode` `^1.5.4` | Data URL QR code generation in `app/api/admin/product/route.ts` |
| **Execution Scripts** | `tsx` `^4.23.1` | Used for Prisma seeding (`prisma/seed.ts`) and scratch scripts |

---

## 3. Directory Structure & File Layout

```
/Users/hriday/Documents/Warranty/
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.css    # Admin batch QR generator styles
│   │   │   └── page.tsx                # Admin batch QR generation page & print view
│   │   └── login/
│   │       ├── login.module.css        # Factory portal login styles
│   │       └── page.tsx                # Admin login form (Name & PIN)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── route.ts            # Admin login API handler (POST)
│   │   │   └── product/
│   │   │       └── route.ts            # Batch product & QR generation API handler (POST)
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts            # Customer login API handler (POST)
│   │   ├── product-check/
│   │   │   └── [id]/
│   │   │       └── route.ts            # Alternative product fetch & scan API (GET/POST)
│   │   ├── scan/
│   │   │   └── [id]/
│   │   │       └── route.ts            # Core scan & warranty claim API handler (GET/POST)
│   │   └── test-db/
│   │       └── route.ts                # DB test endpoint returning products with scans
│   ├── dashboard/
│   │   ├── dashboard.module.css        # Customer dashboard styles
│   │   └── page.tsx                    # Customer dashboard (Credit points hero, Scan history cards)
│   ├── login/
│   │   ├── login.module.css            # Customer login styles (Glassmorphism card)
│   │   └── page.tsx                    # Customer login form (Full Name & Phone Number)
│   ├── scan/
│   │   └── [id]/
│   │       ├── page.tsx                # Dynamic scan page (uses React 19 `use(params)`)
│   │       ├── ScanClient.tsx          # Client Component for scanning & countdown timer
│   │       └── scan.module.css         # Scan page layout, badges, timers, and button styles
│   ├── globals.css                     # Global CSS rules (Inter font, body reset)
│   ├── layout.tsx                      # Root HTML layout with Geist font variables
│   └── page.tsx                        # Root index route with session-based redirect
├── lib/
│   ├── auth.ts                         # JWT token signing, verification, and cookie helpers
│   └── prisma.ts                       # Prisma Client instantiation with LibSql driver adapter
├── prisma/
│   ├── migrations/                     # Prisma migration history
│   ├── dev.db                          # Local SQLite database fallback
│   ├── schema.prisma                   # Database schema definitions
│   └── seed.ts                         # Seed script creating initial Admin user
├── public/                             # Public static assets
├── schema.sql                          # Raw SQL DDL file
├── package.json                        # Node dependencies & npm scripts
└── tsconfig.json                       # TypeScript configuration
```

---

## 4. Database Schema & Data Structure

The database schema defined in `prisma/schema.prisma` consists of three core models:

### 1. `User` Model
```prisma
model User {
  id           String        @id @default(uuid())
  phoneNumber  String        @unique
  name         String
  password     String?       // Only for admins
  role         String        @default("CUSTOMER") // "ADMIN" or "CUSTOMER"
  creditPoints Int           @default(0)
  createdAt    DateTime      @default(now())
  scans        ScanHistory[]
}
```
- **CUSTOMER users**: Created dynamically on login via `phoneNumber` and `name`. No `password`. Default `role = "CUSTOMER"`, `creditPoints = 0`.
- **ADMIN users**: Created via seed script (`prisma/seed.ts`). Have hashed `password` (PIN/password), `role = "ADMIN"`.

### 2. `Product` Model
```prisma
model Product {
  id             String        @id @default(uuid())
  name           String
  sku            String        @unique
  warrantyMonths Int
  creditPoints   Int           @default(0)
  createdAt      DateTime      @default(now())
  scans          ScanHistory[]
}
```
- Manufactured item created in bulk by admins.
- Each product has a unique `sku` (serial number with optional prefix) and attached `warrantyMonths` and `creditPoints`.

### 3. `ScanHistory` Model
```prisma
model ScanHistory {
  id          String   @id @default(uuid())
  product     Product  @relation(fields: [productId], references: [id])
  productId   String
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  scannedAt   DateTime @default(now())
  latitude    Float?
  longitude   Float?
  isFirstScan Boolean  @default(false)
}
```
- Tracks all scans of a product by users.
- **First Scan Rule**: The first time a product is scanned (`product.scans.length === 0`), `isFirstScan` is set to `true`, and `product.creditPoints` are awarded to the scanning user via an atomic Prisma transaction.
- Subsequent scans log a new `ScanHistory` row with `isFirstScan: false` without awarding extra points.

---

## 5. Test Runner & Build Infrastructure

1. **Scripts in `package.json`**:
   - `npm run dev`: Starts Next.js development server on host `0.0.0.0`.
   - `npm run build`: Compiles production build via Next.js (`next build`).
   - `npm run start`: Runs Next.js production server.
   - `npm run lint`: Runs ESLint check across files (`eslint`).
2. **Testing Framework**:
   - **No formal test framework** (Jest, Vitest, Playwright, Cypress) is currently configured in `package.json`.
3. **Linter Analysis Results (`npm run lint`)**:
   - `npm run lint` reported 25 errors and 11 warnings across the repository.
   - **React Hooks Linter Error** in `app/scan/[id]/page.tsx:19:5`: `fetchProductAndScan` is called in `useEffect` before it is declared.
   - **TypeScript Linter Errors** in root helper scripts (`check-db-users.js`, `check-db.js`, `check-users.js`, `check_db.js`, `create_test_product.js`, `test-api.js`, `test.js`, `test_script.js`, `update_scan_client.js`): `@typescript-eslint/no-require-imports` violations for CommonJS `require()`.

---

## 6. Specific Analysis: Requirement R1 (Admin User & Ban Management)

### R1.1 Schema Additions
To support user banning, the `User` model in `prisma/schema.prisma` must be updated with an `isBanned` field:
```prisma
model User {
  id           String        @id @default(uuid())
  phoneNumber  String        @unique
  name         String
  password     String?       // Only for admins
  role         String        @default("CUSTOMER") // "ADMIN" or "CUSTOMER"
  creditPoints Int           @default(0)
  isBanned     Boolean       @default(false)       // <--- NEW FIELD
  createdAt    DateTime      @default(now())
  scans        ScanHistory[]
}
```

### R1.2 Necessary API Endpoints
Three key admin API endpoints are required:
1. `GET /api/admin/users`:
   - Authorization: Admin session required (`getSessionFromRequest` -> `session.role === 'ADMIN'`).
   - Functionality: Fetch all customer users (`role: 'CUSTOMER'`), returning `id`, `name`, `phoneNumber`, `creditPoints`, `isBanned`, `createdAt`, and `_count.scans` (total product activations).
2. `POST /api/admin/users/[id]/clear-credits` (or `POST /api/admin/users/clear-credits`):
   - Authorization: Admin session required.
   - Functionality: Resets the target user's `creditPoints` to `0`.
3. `POST /api/admin/users/[id]/toggle-ban` (or `POST /api/admin/users/toggle-ban`):
   - Authorization: Admin session required.
   - Functionality: Toggles `isBanned` (`true` <-> `false`) for the target user.

### R1.3 Enforcement in Auth & Scan Flows
- **Login Enforcement**: In `/api/auth/login`, before signing token or returning success, check if existing user has `isBanned === true`. If banned, reject with HTTP 403 Forbidden (`{ error: 'Your account has been banned. Please contact support.' }`).
- **Scan Enforcement**: In `/api/scan/[id]` (and `/api/product-check/[id]`), check `dbUser.isBanned`. If true, reject with HTTP 403 Forbidden (`{ error: 'Banned accounts cannot claim warranty or points.' }`).

### R1.4 UI Location for Admin Management
- Currently, `/admin/dashboard` serves as the sole factory admin interface.
- Recommendation: Integrate a tabbed navigation or dual-card layout on `/admin/dashboard`:
  - Tab 1: **QR Generator** (Existing mass creation form & printable QR grid).
  - Tab 2: **User Management** (Customer list, credit points display, "Clear Credits" button, and "Ban / Unban User" toggle).

---

## 7. Specific Analysis: Requirement R2 (UI Component & Styling Setup)

### R2.1 Aesthetic & Styling System
- **Framework**: Tailwind CSS v4 + pure CSS Modules (`*.module.css`).
- **Visual Theme**: Dark Slate / Glassmorphism aesthetic.
  - Primary Backgrounds: `#0f172a` (Slate 900) for Dashboards & Admin.
  - Accent Colors: Indigo (`#4f46e5`), Emerald Green (`#10b981` / `#34d399` / `#22c55e`), Royal Blue (`#3b82f6`), Crimson Red (`#ef4444`).
  - Cards: Semi-transparent backdrop blur `rgba(255, 255, 255, 0.03)` with subtle `1px solid rgba(255, 255, 255, 0.1)` borders.
  - Keyframe Micro-animations:
    - `@keyframes slideUp`: Smooth vertical entrance for cards.
    - `@keyframes spin`: Loading spinner animation.
    - `@keyframes pulse`: Glowing halo effect for point achievement banners.

### R2.2 Existing UI Pages & Component Breakdown
1. **Customer Login (`/login`)**:
   - Component: `CustomerLogin` (`app/login/page.tsx`).
   - Styles: `app/login/login.module.css`.
   - Elements: Centered Glassmorphism card, Name and Phone inputs with border glow on focus, Submit button, error message banner.
2. **Customer Dashboard (`/dashboard`)**:
   - Component: `ElectricianDashboard` (`app/dashboard/page.tsx`).
   - Styles: `app/dashboard/dashboard.module.css`.
   - Elements: Header greeting, hero total credit points card (`4rem` bold typography), scan history responsive grid with Active/Expired badges, SKU display, activation date, warranty expiry calculation.
3. **Scan Landing Page (`/scan/[id]`)**:
   - Components: `ScanPage` (`app/scan/[id]/page.tsx`), `ScanClient` (`app/scan/[id]/ScanClient.tsx`).
   - Styles: `app/scan/[id]/scan.module.css`.
   - Elements: Loading spinner, Unregistered state banner with "Register & Claim Points" action button, Active state banner with dynamic countdown timer (`Y:M:D:H:M`), Expired state banner, redirect link to dashboard.
4. **Admin Dashboard (`/admin/dashboard`)**:
   - Component: `AdminDashboard` (`app/admin/dashboard/page.tsx`).
   - Styles: `app/admin/dashboard/dashboard.module.css`.
   - Elements: Batch registration card (Product Name, SKU Prefix, Warranty Months, Credit Points, Quantity <= 500), interactive generated QR code cards with selection toggle, Select All / Deselect All controls, Print stylesheet support (`@media print`).

---

## 8. Specific Analysis: Requirement R3 (Preservation of Auth & Scan APIs)

### R3.1 Baseline Behavior of `/api/auth/login`
- **Method**: `POST`
- **Request Body**: `{ phoneNumber: string, name: string }`
- **Validation**: If `!phoneNumber || !name` -> HTTP 400 `{ error: 'Phone number and name are required' }`.
- **Database Logic**:
  - `prisma.user.findUnique({ where: { phoneNumber } })`.
  - If user not found, `prisma.user.create({ data: { phoneNumber, name, role: 'CUSTOMER' } })`.
- **Authentication**:
  - `signToken({ id: user.id, role: user.role })`.
  - Sets HTTP-only `auth_token` cookie with 30 days maxAge, Lax sameSite, `/` path.
- **Response**: HTTP 200 `{ success: true }`.
- **Preservation Mandate**:
  - Keep request body schema, field validation, and HTTP-only cookie signature identical.
  - ONLY add `isBanned` check for existing user before setting cookie: if `user.isBanned`, return HTTP 403 `{ error: 'Account is banned' }`.

### R3.2 Baseline Behavior of `/api/scan/[id]`
- **Authentication**: Checks `getSessionFromRequest(req)`. If null, returns HTTP 401 `{ error: 'Unauthorized' }`.
- **GET Request**:
  - Resolves `params` Promise: `const { id: productId } = await params`.
  - Queries `prisma.product.findUnique` including `scans` ordered by `scannedAt: 'asc'`.
  - Returns HTTP 404 `{ error: 'Product not found' }` if missing.
  - Returns HTTP 200 `{ product }`.
- **POST Request**:
  - Body: `{ latitude?: number, longitude?: number }`.
  - Executes Prisma `$transaction`:
    - Finds product by ID with scans.
    - If missing, throws `'PRODUCT_NOT_FOUND'`.
    - `isFirstScan = product.scans.length === 0`.
    - Creates `ScanHistory` record.
    - If `isFirstScan === true`, updates user's `creditPoints` by `increment: product.creditPoints`.
  - Refreshes product data.
  - Returns HTTP 200 `{ product: updatedProduct, scan: transactionResult.scan, isFirstScan: transactionResult.isFirstScan }`.
- **Preservation Mandate**:
  - Do NOT alter transaction isolation logic, `isFirstScan` determination, or return JSON key names (`product`, `scan`, `isFirstScan`).
  - ONLY add check for `isBanned` on the user account before performing the transaction.

---

## 9. Risk Assessment & Recommendations

1. **Database Schema Migration**:
   - Updating `schema.prisma` to include `isBanned Boolean @default(false)` requires generating a Prisma migration (`npx prisma migrate dev` or `npx prisma db push`).
   - SQLite / LibSQL schema sync should be executed carefully to preserve existing dev DB data.
2. **Next.js 16 Route Params**:
   - `params` in Next.js 16 dynamic route handlers (`/api/scan/[id]`) and page components are Promises (`await params`). Keep this pattern intact.
3. **Double API Endpoints (`api/scan/[id]` vs `api/product-check/[id]`)**:
   - Both routes exist in the codebase (`app/api/scan/[id]/route.ts` and `app/api/product-check/[id]/route.ts`).
   - Any auth/ban enforcement added to `api/scan/[id]` should also be applied to `api/product-check/[id]` to maintain consistency.
4. **Existing Linter Errors**:
   - `app/scan/[id]/page.tsx` needs function ordering fix (`fetchProductAndScan` moved above `useEffect`).
   - Root scratch `.js` scripts use CommonJS `require()`.
