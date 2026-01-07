# Emblém Portfolio
Editorial-grade portfolio with a custom CMS dashboard.

## Frontend (Next.js)
```
npm i
npm run dev
```

Open `http://localhost:3000` and `/admin`.

### Environment
Set `NEXT_PUBLIC_API_URL` to your backend URL in `.env.local` when using the CMS.

## Backend (Node + Express)
The API and CMS live in `server/`.

```
cd server
npm i
cp .env.example .env
npm run dev
```

The admin dashboard is available at `/admin`.
