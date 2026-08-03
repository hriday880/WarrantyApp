## 2026-08-01T14:07:24Z
You are a Worker subagent for Milestone 2 (UI/UX Redesign & Admin User Management UI). Your working directory is /Users/hriday/Documents/Warranty/.agents/m2_worker_1.

Your task is to implement Requirement R2 (Premium UI/UX Redesign across all pages and Admin User Management UI):

1. **Admin User Management UI Integration (`app/admin/dashboard/page.tsx`)**:
   - Add a tabbed interface or dual-section layout on `/admin/dashboard`:
     - **Tab 1: QR Batch Generator** (Mass QR generation form, batch cards, print stylesheet layout).
     - **Tab 2: User Management** (Fetch customer users from `GET /api/admin/users`, display user card grid/table with Name, Phone, Credit Points, Status badge [Active / Banned], "Clear Credits" button calling `POST /api/admin/users/[id]/clear-credits`, and "Ban User" / "Unban User" button calling `POST /api/admin/users/[id]/toggle-ban`).
   - Add responsive action states, instant state refresh on clear/ban toggle, and user-friendly error/success banners.

2. **Cohesive Premium Design System Across All Pages**:
   - Customer Login (`app/login/page.tsx` & CSS Module): Glassmorphism card, glowing focus borders, micro-animations on hover/click.
   - Customer Dashboard (`app/dashboard/page.tsx` & CSS Module): Dark slate theme (`#0f172a`), emerald hero points counter (`#10b981`), glassmorphism scan history cards with active/expired badges.
   - Scan Page (`app/scan/[id]/ScanClient.tsx` & `page.tsx`): Dynamic countdown timer, animated registration status badge, polished claim buttons. Fix function declaration order in `app/scan/[id]/page.tsx` so `fetchProductAndScan` is declared before use in `useEffect`.
   - Admin Login (`app/admin/login/page.tsx` & CSS Module): Factory portal dark theme, secure PIN input, smooth transitions.
   - Admin Dashboard (`app/admin/dashboard/page.tsx` & CSS Module): Dual-tab navigation (QR Batch Generator & User Management), polished dark theme, responsive grid.

3. **Build & Syntax Verification**:
   - Run `npm run lint` and `npm run build` using `run_command` in worker.
