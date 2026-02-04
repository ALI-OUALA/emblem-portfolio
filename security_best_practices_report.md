# Security Best Practices Report

Date: 2026-02-04
Scope: server/src/index.js (Express API) + admin/client fetch layer.

## Executive Summary
The backend exposes authenticated, cookie-based state‑changing endpoints without CSRF protection or rate limiting, relies on default secrets in environment fallbacks, and lacks input validation and hardened upload checks. These are fixable with standard middleware, strict validation, and stronger configuration. This report documents the issues as observed before remediation.

## Critical

### [EXPRESS-CSRF-001] Cookie-auth state‑changing endpoints lack CSRF protection
- **Severity:** High
- **Location:** server/src/index.js lines 298–495 (POST/PUT/DELETE endpoints) and auth cookie usage lines 239–247, 249–272
- **Evidence:**
  - pp.post( /api/auth/login ...) sets a session cookie (lines 310–334)
  - No CSRF token or origin validation for state‑changing routes: POST /api/public/inquiries, PUT /api/admin/*, POST /api/admin/media, DELETE /api/admin/media/:id (lines 298–495)
- **Impact:** Authenticated users can be tricked into issuing state‑changing requests via CSRF.
- **Fix:** Add CSRF token issuance and validation for all cookie-authenticated, state‑changing routes.
- **Mitigation:** SameSite cookies reduce risk but are insufficient alone.
- **False positive notes:** If CSRF is enforced at a reverse proxy/WAF, validate there.

### [EXPRESS-AUTH-001] No rate limiting on auth or inquiry endpoints
- **Severity:** Medium
- **Location:** server/src/index.js lines 298–334 (inquiries/login)
- **Evidence:** No rate‑limit middleware applied before POST /api/auth/login or POST /api/public/inquiries.
- **Impact:** Brute‑force password attempts and abuse/spam on inquiry endpoint.
- **Fix:** Add request rate limiting for auth and public write endpoints.
- **Mitigation:** Move enforcement to edge proxy if you can’t in app.
- **False positive notes:** If rate limiting is enforced at infrastructure level, confirm configuration.

## High

### [EXPRESS-INPUT-001] Missing request validation and normalization
- **Severity:** High
- **Location:** server/src/index.js lines 298–308 (inquiries), 310–334 (login), 384–447 (admin updates)
- **Evidence:** Requests only check for presence of fields or accept raw payloads without schema validation.
- **Impact:** Unexpected types/shapes or oversized payloads can lead to data integrity issues, crashes, or security bugs downstream.
- **Fix:** Add schema validation (e.g., Zod) for all request bodies.
- **Mitigation:** Enforce strict JSON body limits and reject unknown types.

### [EXPRESS-UPLOAD-001] File uploads not validated beyond client‑reported mime
- **Severity:** High
- **Location:** server/src/index.js lines 44–56 (multer) and 468–478 (upload route)
- **Evidence:** Upload accepts any file type; uses mimetype from client; no server-side content sniffing.
- **Impact:** Malicious files may be stored and served back; potential XSS or unsafe content exposure.
- **Fix:** Validate file signatures server‑side and allowlist safe image types; remove unsafe uploads.
- **Mitigation:** Store uploads outside web root or serve with safe headers.

## Medium

### [EXPRESS-HEADERS-001] Missing security headers and fingerprinting reduction
- **Severity:** Medium
- **Location:** server/src/index.js lines 58–66
- **Evidence:** No helmet() usage; no pp.disable('x-powered-by').
- **Impact:** Weaker baseline protections; easier fingerprinting.
- **Fix:** Add Helmet and disable x-powered-by.
- **Mitigation:** Ensure edge proxy sets equivalent headers.

### [EXPRESS-ERROR-001] No centralized error handler
- **Severity:** Low
- **Location:** End of server/src/index.js
- **Evidence:** No pp.use((err, req, res, next) => ...) handler.
- **Impact:** Unhandled errors may leak stack traces or create inconsistent responses.
- **Fix:** Add production‑safe error handler and a 404 handler.

## Low

### [EXPRESS-ENV-001] Default secret fallbacks in code
- **Severity:** Low (High if used in production)
- **Location:** server/src/index.js lines 16–27
- **Evidence:** Defaults for SESSION_SECRET and ADMIN_PASSWORD are set to change-me.
- **Impact:** If deployed without overrides, auth is compromised.
- **Fix:** Fail fast in production when defaults are used; document required env vars.

---

Report generated before remediation. Line numbers refer to the pre‑fix code state.
