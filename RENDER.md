# Deploy Glow-Cycle on Render

This repo is configured for a single Render web service that serves:

- frontend SPA (`artifacts/glowcycle/dist/public`)
- backend API (`/api/*`)

## 1) Push your code

Push this repository to GitHub/GitLab.

## 2) Create services from blueprint

In Render:

1. `New` -> `Blueprint`
2. Select this repo
3. Render will read [`render.yaml`](./render.yaml)
4. It creates:
   - web service: `glow-cycle`
   - postgres database: `glow-cycle-db`

## 3) Set required secrets

In the `glow-cycle` web service environment:

- `SMTP_EMAIL`
- `SMTP_PASSWORD`

`SESSION_SECRET` is generated automatically.

## 4) Deploy

Render build/start commands are already set:

- Build: `corepack pnpm run render:build`
- Start: `corepack pnpm run render:start`

## 5) Verify

- API health: `https://<your-render-domain>/api/healthz`
- App: `https://<your-render-domain>/`

## Notes

- `NODE_ENV=production` is set in `render.yaml`.
- Backend bootstraps DB schema on startup using `DATABASE_URL`.
- OTP emails require valid Gmail SMTP app-password credentials.
