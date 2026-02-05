# Emblém Portfolio
Editorial-grade portfolio with a custom CMS dashboard and a lightweight backend.

**Project Overview**
Emblém is a boutique studio portfolio built to feel like a printed editorial layout while staying fast, minimal, and updateable by non-developers. The public site is a Next.js App Router frontend. Content is served from a small Express + PostgreSQL backend that also powers the admin CMS and media library.

**Why This Architecture**
The design goal is clarity and control: the frontend needs strong typography, motion, and SEO, while the studio needs to update content without editing code. The split frontend/backend keeps the public site fast and static-friendly, while the CMS stays secure and flexible. PostgreSQL provides durable content storage, and the backend filesystem handles media for a simple first production version.

**System Architecture**
```
Browser
  |-- Public site (Next.js) ---> GET /api/public/content
  |-- Admin CMS (Next.js) ----> Auth + CSRF + Admin API

Next.js frontend (src/)
  |-- SiteHome + sections
  |-- AdminApp
  |-- apiFetch wrapper

Express API (server/src/index.js)
  |-- Auth + sessions
  |-- Content CRUD
  |-- Media uploads

PostgreSQL
  |-- settings, services, projects, inquiries, users, sessions, media

Media storage
  |-- /uploads on the backend host
```

**Request Flow (Public Site)**
1. `src/app/page.tsx` renders `SiteHome`.
2. `SiteHome` fetches `/api/public/content` via `apiFetch` in `src/lib/api.ts`.
3. The backend responds with settings, services, and projects.
4. The page renders `Hero`, `Services`, `Work`, `Contact`, `Footer` using the fetched content.

**Request Flow (Admin CMS)**
1. `src/app/admin/page.tsx` renders `AdminApp`.
2. `AdminApp` checks session via `/api/admin/me`.
3. On login, a session cookie is set and a CSRF token is returned.
4. Admin updates content through `/api/admin/settings`, `/api/admin/services`, and `/api/admin/projects`.
5. Media uploads go through `/api/admin/media` and are stored in `/uploads`.

**Repository Map**
- `src/app/` App Router entrypoints for the public site and `/admin`.
- `src/site/` Content defaults and the home page composition.
- `src/sections/` Public UI sections: `Hero`, `Services`, `Work`, `Contact`, `Footer`.
- `src/components/ui/` Shared UI primitives and motion helpers.
- `src/styles/` Design tokens and global utilities.
- `src/index.css` Tailwind v4 base output plus project utilities.
- `server/` Express API, environment config, and database migrations.
- `server/migrations/` Database schema and evolution scripts.

**Frontend Architecture**
- **Framework**: Next.js 15 App Router with React 18.
- **Entry**: `src/app/layout.tsx` loads fonts and global CSS. `src/app/page.tsx` renders `SiteHome`.
- **Composition**: `src/site/SiteHome.tsx` orchestrates all sections and fetches content at runtime.
- **Fallback Content**: `src/site/content.ts` provides defaults if the API is unavailable.
- **UI System**: Utility-driven CSS with editorial typography, motion via Framer Motion, and custom button/section primitives.
- **Fonts**: Instrument Sans, Instrument Serif, IBM Plex Mono loaded from Google Fonts.

**Backend Architecture**
- **Framework**: Node.js + Express in `server/src/index.js`.
- **Security**: Helmet headers, CORS allowlist, rate limits for auth and form endpoints.
- **Auth**: Session cookie + CSRF token. Sessions are stored in Postgres.
- **Content**: Settings, services, and projects stored in Postgres with publish flags.
- **Media**: Multer handles uploads, file-type validates images, records stored in `media` table.
- **Migrations**: Startup applies SQL migrations and seeds defaults if tables are empty.

**Database Model**
- `users`: Admin accounts.
- `sessions`: Session tokens and CSRF data.
- `settings`: Site-wide content (hero, contact, footer, socials).
- `services`: Service cards with ordering and publish flags.
- `projects`: Work items with ordering and publish flags.
- `inquiries`: Contact form submissions.
- `media`: Uploaded media metadata.

**Key Endpoints**
- Public
- `GET /api/public/content`
- `POST /api/public/inquiries`

- Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/csrf`

- Admin
- `GET /api/admin/me`
- `GET /api/admin/content`
- `PUT /api/admin/settings`
- `PUT /api/admin/services`
- `PUT /api/admin/projects`
- `POST /api/admin/media`
- `DELETE /api/admin/media/:id`

**Why the Content Model Looks This Way**
The homepage is a single-scroll narrative. Content is grouped into three major primitives to keep editing fast:
- Settings: global narrative and contact details.
- Services: repeatable cards with ordering and publish status.
- Projects: repeatable cards with ordering and publish status.
This structure keeps the CMS simple and prevents the site from drifting into an unmaintainable page builder.

**Design System Highlights**
- High-contrast editorial palette defined in `src/styles/globals.css`.
- Hard shadows and ink borders to emulate print materiality.
- Compact typographic scale with mono uppercase labels for navigation.
- Motion kept intentional: subtle entrance animations and hover offsets.

**Local Development**
Frontend:
```bash
npm i
npm run dev
```
Open `http://localhost:3000` and `http://localhost:3000/admin`.

Backend:
```bash
cd server
npm i
cp .env.example .env
npm run dev
```

Frontend environment:
- `NEXT_PUBLIC_API_URL` set to the backend URL when running cross-origin.

Backend required environment:
- `DATABASE_URL` (Postgres connection string)
- `SESSION_SECRET` (long random string)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`)

Backend optional environment:
- `SESSION_TTL_DAYS`, `SESSION_COOKIE_NAME`
- `CORS_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`
- `TRUST_PROXY`, `UPLOAD_MAX_MB`, `UPLOAD_DIR`

**Deployment Notes**
Recommended split deployment (from `DEPLOYMENT_GUIDE.local.md`):
- Frontend: Vercel
- Backend: Render
- Database: Render Postgres
- Media: backend filesystem `/uploads`

Important note: on free hosting tiers, filesystem storage can be ephemeral. For production media permanence, attach a persistent disk or move uploads to S3-compatible storage.

**Evolution From the Previous Version**
Baseline comparison: commit `0696597` (Vite-only static portfolio).

Before:
- Single Vite SPA.
- All content hardcoded in components.
- No backend, no CMS, no persistent storage.

After:
- Next.js App Router frontend with server-friendly routing.
- Express + Postgres backend with CMS and media library.
- Admin dashboard with login, CSRF, and publish controls.
- Structured content model for long-term maintainability.

**Tradeoffs**
- Backend filesystem storage is simple but not ideal for large-scale media.
- Session cookies are easy to secure but require CSRF handling.
- Content model is intentionally constrained to keep the editorial feel.

**License**
No license is provided. All rights reserved.
