const required = ["FRONTEND_URL", "API_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL.replace(/\/$/, "");
const API_URL = process.env.API_URL.replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  capture(headers) {
    const values =
      typeof headers.getSetCookie === "function"
        ? headers.getSetCookie()
        : headers.get("set-cookie")
          ? [headers.get("set-cookie")]
          : [];

    for (const value of values) {
      if (!value) continue;
      const [cookiePart] = value.split(";", 1);
      const separatorIndex = cookiePart.indexOf("=");
      if (separatorIndex === -1) continue;
      const name = cookiePart.slice(0, separatorIndex).trim();
      const cookieValue = cookiePart.slice(separatorIndex + 1).trim();
      if (!name) continue;
      this.cookies.set(name, cookieValue);
    }
  }

  toHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

const jar = new CookieJar();

function buildHeaders(extraHeaders = {}, body) {
  const headers = new Headers(extraHeaders);
  const cookieHeader = jar.toHeader();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  if (body && !(body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return headers;
}

async function request(name, url, options = {}) {
  const { expectedStatus, body, headers: extraHeaders, ...rest } = options;
  const response = await fetch(url, {
    ...rest,
    body,
    headers: buildHeaders(extraHeaders, body),
    redirect: "manual",
  });

  jar.capture(response.headers);

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") && text ? JSON.parse(text) : null;

  if (expectedStatus && response.status !== expectedStatus) {
    throw new Error(
      `${name} expected status ${expectedStatus} but received ${response.status}: ${text || response.statusText}`
    );
  }

  if (!expectedStatus && !response.ok) {
    throw new Error(`${name} failed with ${response.status}: ${text || response.statusText}`);
  }

  console.log(`PASS ${name}`);
  return { response, data, text };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const pixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sQ0S8gAAAAASUVORK5CYII=",
  "base64"
);

async function main() {
  const home = await request("frontend homepage", FRONTEND_URL);
  assert(home.text.includes("Embl"), "Homepage HTML did not contain the site name.");

  await request("frontend admin page", `${FRONTEND_URL}/admin`);

  const health = await request("api health", `${API_URL}/api/health`);
  assert(health.data?.status === "ok", "API health status was not ok.");
  assert(health.data?.checks?.database?.status === "ok", "Database health check failed.");
  assert(health.data?.checks?.uploads?.status === "ok", "Upload directory health check failed.");

  const publicContent = await request("public content", `${API_URL}/api/public/content`);
  assert(publicContent.data?.settings?.heroTitle, "Public settings were missing.");
  assert(Array.isArray(publicContent.data?.services), "Public services were missing.");
  assert(Array.isArray(publicContent.data?.projects), "Public projects were missing.");

  const inquiryId = Date.now();
  await request("public inquiry", `${API_URL}/api/public/inquiries`, {
    method: "POST",
    body: JSON.stringify({
      name: `Smoke Test ${inquiryId}`,
      email: `smoke-${inquiryId}@example.com`,
      company: "Automation",
      message: "Smoke test inquiry from the deployment verification flow.",
      website: "",
    }),
    expectedStatus: 201,
  });

  const login = await request("admin login", `${API_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });
  const csrfToken = login.data?.csrfToken;
  assert(csrfToken, "Login did not return a CSRF token.");

  const me = await request("admin session", `${API_URL}/api/admin/me`);
  assert(me.data?.user?.email === ADMIN_EMAIL, "Admin session user did not match the expected email.");

  const adminContent = await request("admin content", `${API_URL}/api/admin/content`);
  assert(Array.isArray(adminContent.data?.services), "Admin services payload was missing.");
  assert(Array.isArray(adminContent.data?.projects), "Admin projects payload was missing.");

  await request("save settings round trip", `${API_URL}/api/admin/settings`, {
    method: "PUT",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(adminContent.data.settings),
  });

  await request("save services round trip", `${API_URL}/api/admin/services`, {
    method: "PUT",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(
      adminContent.data.services.map((service) => ({
        title: service.title,
        desc: service.desc,
        meta: service.meta,
        is_published: service.is_published ?? true,
      }))
    ),
  });

  await request("save projects round trip", `${API_URL}/api/admin/projects`, {
    method: "PUT",
    headers: { "x-csrf-token": csrfToken },
    body: JSON.stringify(
      adminContent.data.projects.map((project) => ({
        title: project.title,
        role: project.role,
        summary: project.summary,
        year: project.year,
        focus: project.focus,
        is_published: project.is_published ?? true,
      }))
    ),
  });

  const uploadForm = new FormData();
  uploadForm.append("file", new Blob([pixelPng], { type: "image/png" }), "smoke-test.png");
  const upload = await request("media upload", `${API_URL}/api/admin/media`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: uploadForm,
    expectedStatus: 201,
  });
  const mediaId = upload.data?.media?.id;
  assert(mediaId, "Media upload did not return an item id.");

  await request("media delete", `${API_URL}/api/admin/media/${mediaId}`, {
    method: "DELETE",
    headers: { "x-csrf-token": csrfToken },
    expectedStatus: 204,
  });

  await request("admin logout", `${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    expectedStatus: 204,
  });

  await request("admin session revoked", `${API_URL}/api/admin/me`, {
    expectedStatus: 401,
  });

  console.log("Smoke test completed successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
