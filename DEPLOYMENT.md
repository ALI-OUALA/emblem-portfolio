# Emblém Deployment

Production topology:

- Frontend: Vercel
- Backend API: Render web service from `server/`
- Database: Neon PostgreSQL
- Media storage: Render persistent disk mounted to `uploads/`

## Frontend

Required environment variable:

```bash
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com
```

Deploy the repo root as a Next.js application.

## Backend

The repository includes a Render blueprint in [`render.yaml`](./render.yaml).

Required backend variables:

```bash
DATABASE_URL=postgresql://...
DATABASE_SSL=true
SESSION_SECRET=<long-random-secret>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
CORS_ORIGIN=https://<your-vercel-app>.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
TRUST_PROXY=true
UPLOAD_DIR=uploads
UPLOAD_MAX_MB=10
```

Notes:

- Prefer `ADMIN_PASSWORD_HASH` over plain `ADMIN_PASSWORD` in production.
- `COOKIE_SAMESITE=none` is required for the cross-origin Vercel + Render session cookie flow.
- The Render service must keep a persistent disk mounted at `/opt/render/project/src/uploads`.

## Health And Verification

Render health checks should target:

```bash
/api/health
```

The endpoint returns `503` if either:

- PostgreSQL is unreachable
- the upload directory is missing or not writable

Run the smoke test after deploy:

```bash
FRONTEND_URL=https://<your-vercel-app>.vercel.app \
API_URL=https://<your-render-service>.onrender.com \
ADMIN_EMAIL=<admin-email> \
ADMIN_PASSWORD=<admin-password> \
npm run smoke
```

The smoke test verifies:

- public site and admin page load
- API health is green
- content API returns data
- inquiry submission works
- admin login, session, and CSRF flow work
- settings, services, and projects can be saved
- media upload and delete work
- logout revokes the session
