# Original User Request

## Initial Request — 2026-08-01T13:04:20Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

An admin dashboard for user management (checking data, clearing credits, banning/blacklisting) and a comprehensive, premium UI redesign across all pages, while strictly preserving existing backend functionality.

Working directory: /Users/hriday/Documents/Warranty
Integrity mode: demo

## Requirements

### R1. Admin User Management Dashboard
A dedicated admin page to view a list of users, their credit balances, and their ban status. Must include functional controls to clear a user's credits to 0 and toggle their ban status. You may add the necessary database fields (e.g., `isBanned`) and new admin API endpoints.

### R2. Premium UI/UX Redesign
Redesign all pages (Login, Dashboard, Scan, Admin) with a cohesive, modern aesthetic (e.g., glassmorphism, dynamic animations, modern typography). The UI must feel premium, state-of-the-art, and responsive across devices. Do not use generic plain colors; use polished design systems.

### R3. Strict Backend Preservation
Safely add new fields and endpoints without breaking or altering any existing backend business logic. The current login and QR scanning flows must continue to work exactly as they do now.

## Acceptance Criteria

### Admin User Management
- [ ] Programmatic: A script can successfully ban a user via the new API and verify the `isBanned` field is updated in the database.
- [ ] Programmatic: A script can successfully clear a user's credits via the new API and verify their balance is 0.
- [ ] Programmatic: If a user is banned, they are prevented from logging in or claiming new points.

### UI Redesign
- [ ] Agent-as-judge: All pages (Login, Dashboard, Scan, Admin) share a unified, premium design system (consistent typography, colors, spacing).
- [ ] Agent-as-judge: The UI includes interactive micro-animations (e.g., hover states, smooth transitions) on buttons and cards.

### Backend Preservation
- [ ] Programmatic: The existing `app/api/auth/login` and `app/api/scan/[id]` endpoints continue to function correctly and pass their baseline behavior tests without modification to their core logic.
