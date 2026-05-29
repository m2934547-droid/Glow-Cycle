# Render Manual Deploy (Single Web Service)

Use this when you want to create Render services manually (no Blueprint import).

## 1) Create PostgreSQL database

In Render:

1. `New` -> `PostgreSQL`
2. Name: `glow-cycle-db` (any name is fine)
3. Create DB
4. Copy its `External Database URL` (or Internal URL if same region/app setup supports it)

## 2) Create one Web Service

In Render:

1. `New` -> `Web Service`
2. Connect your repo
3. Runtime: `Node`
4. Branch: `main` (or your deploy branch)

Set commands:

- Build Command: `corepack pnpm run render:build`
- Start Command: `corepack pnpm run render:start`

Set health check:

- Health Check Path: `/api/healthz`

## 3) Add environment variables (Web Service)

Add these in Render -> Web Service -> `Environment`:

- `NODE_VERSION=24.15.0`
- `NODE_ENV=production`
- `PORT=10000`
- `API_PORT=10000`
- `BASE_PATH=/`
- `OTP_EXPIRE_MINUTES=5`
- `SESSION_SECRET=<long-random-secret>`
- `DATABASE_URL=<your-render-postgres-url>`
- `EMAILJS_SERVICE_ID=<your-emailjs-service-id>`
- `EMAILJS_TEMPLATE_ID=<your-emailjs-template-id>`
- `EMAILJS_PUBLIC_KEY=<your-emailjs-public-key>`
- `EMAILJS_PRIVATE_KEY=<your-emailjs-private-key>` (optional, but recommended if enabled in EmailJS)

## 4) Deploy and verify

After deploy completes:

- App: `https://<your-service>.onrender.com/`
- API health: `https://<your-service>.onrender.com/api/healthz`

## Notes

- Production backend serves the built frontend from the same service.
- Session cookies work behind Render proxy (`trust proxy` is enabled in production).
- Database schema is bootstrapped on server startup.
- EmailJS templates should include variables such as `to_email`, `otp`, `flow_label`, and `expire_minutes`.
