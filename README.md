# Emblém Portfolio
Editorial-grade portfolio with a custom CMS dashboard.

## Frontend (Next.js)
```
npm i
npm run dev
```

Open `http://localhost:3000` and `/admin`.

### Environment
Set `NEXT_PUBLIC_API_URL` to your backend URL in `.env.local` when the API is hosted on a different origin. For same-origin deployments, you can omit it.

## Backend (Node + Express)
The API and CMS live in `server/`.

```
cd server
npm i
cp .env.example .env
npm run dev
```

The admin dashboard is available at `/admin`.

### Required backend environment
- `DATABASE_URL` (Postgres connection string)
- `SESSION_SECRET` (long random string)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`)

### Optional backend environment
- `SESSION_TTL_DAYS`, `SESSION_COOKIE_NAME`
- `CORS_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`
- `TRUST_PROXY`, `UPLOAD_MAX_MB`, `UPLOAD_DIR`

## License
No license is provided. All rights reserved.
