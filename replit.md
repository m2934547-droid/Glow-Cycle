# GlowCycle – Smart Period Tracker & Women's Health Companion

## Overview

Full-stack women's health web application with cycle tracking, health & wellness guidance, period care store, and admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/glowcycle)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Session auth**: express-session with cookie-based sessions
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Features

- Signup/Login with session-based authentication
- User profile with BMI calculator (shows category: Underweight/Normal/Overweight/Obese)
- Menstrual cycle tracker — log periods, see next period, ovulation, fertile window
- Interactive monthly calendar — period days (dark pink), ovulation (purple), fertile window (light pink), clickable notes
- Health & wellness tips by cycle phase (menstrual/follicular/ovulation/luteal): diet, exercise, self-care, mood
- Period care store with 12 products across 6 categories, add-to-cart, checkout simulation
- Admin panel — user management, platform stats, product management (add/edit/delete)
- Motivational quotes

## Seed Data

- Admin account: `admin@glowcycle.com` / `admin123`
- Test user: `sarah@example.com` / `test123`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project Structure

- `artifacts/glowcycle/` — React + Vite frontend (pink/white feminine theme)
- `artifacts/api-server/` — Express 5 API server
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema and client

## Database Schema

- `users` — id, name, email, password_hash, age, height_cm, weight_kg, is_admin, created_at
- `cycles` — id, user_id, start_date, cycle_length, notes, created_at
- `calendar_notes` — id, user_id, date, note, created_at
- `products` — id, name, description, price, category, image_url, in_stock, created_at
- `cart_items` — id, user_id, product_id, quantity, created_at
