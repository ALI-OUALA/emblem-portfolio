import fs from "fs";
import path from "path";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import dotenv from "dotenv";
import multer from "multer";
import pg from "pg";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { fileTypeFromFile } from "file-type";

dotenv.config();

const { Pool } = pg;

const {
  PORT = 8080,
  DATABASE_URL,
  DATABASE_SSL = "true",
  SESSION_SECRET = "change-me",
  SESSION_TTL_DAYS = "7",
  SESSION_COOKIE_NAME = "session",
  ADMIN_EMAIL = "admin@emblem.studio",
  ADMIN_PASSWORD = "change-me",
  ADMIN_PASSWORD_HASH,
  CORS_ORIGIN = "",
  NODE_ENV = "development",
  COOKIE_SECURE = "false",
  COOKIE_SAMESITE = "",
  TRUST_PROXY = "false",
  UPLOAD_DIR = "uploads",
  UPLOAD_MAX_MB = "10",
} = process.env;

const isProduction = NODE_ENV === "production";
const cookieIsSecure = COOKIE_SECURE === "true" || isProduction;
const cookieSameSite = (COOKIE_SAMESITE || "lax").toLowerCase();
const sessionTtlDays = Number(SESSION_TTL_DAYS) || 7;
const sessionTtlMs = sessionTtlDays * 24 * 60 * 60 * 1000;
const uploadMaxBytes = Math.max(Number(UPLOAD_MAX_MB) || 10, 1) * 1024 * 1024;
const allowedOrigins = CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const trustProxy = parseTrustProxy(TRUST_PROXY);
const allowedUploadMime = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

if (!["lax", "strict", "none"].includes(cookieSameSite)) {
  throw new Error("COOKIE_SAMESITE must be lax, strict, or none");
}

if (cookieSameSite === "none" && !cookieIsSecure && isProduction) {
  throw new Error("COOKIE_SAMESITE=none requires COOKIE_SECURE=true in production");
}

if (allowedOrigins.includes("*")) {
  throw new Error("CORS_ORIGIN cannot include * when credentials are enabled");
}

const ssl =
  DATABASE_SSL === "true"
    ? {
        rejectUnauthorized: false,
      }
    : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
});

const uploadRoot = path.join(process.cwd(), UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

function parseTrustProxy(value) {
  if (!value || value === "false") return false;
  if (value === "true") return true;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return false;
  return parsed;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadRoot);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
      cb(null, name);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: uploadMaxBytes, files: 1 },
});

const app = express();
app.set("trust proxy", trustProxy);
app.disable("x-powered-by");
app.use(helmet());

if (allowedOrigins.length > 0) {
  const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const inquiryLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use("/uploads", express.static(uploadRoot, { fallthrough: false, maxAge: "7d" }));

const defaultSettings = {
  heroBadge: "Booking Q2 2026 · 2–6 week sprints",
  heroTitle: "Editorial-grade digital experiences for teams who demand clarity and edge.",
  heroSubtitle:
    "Emblém is a small studio blending identity, product UX, and front-end build. We ship sharp systems that stay minimal, fast, and unmistakably yours.",
  heroNotes: ["Remote · UTC+1", "Design + development", "Built for launch speed"],
  contactTitle: "Tell us what you are building and where the friction is.",
  contactSubtitle:
    "A single doc, a rough prototype, or a brand that needs sharper product work — that is enough to start.",
  contactNotes: ["We respond within 48 hours with next steps and a clear schedule."],
  contactEmail: "hello@emblem.studio",
  footerBlurb: "Emblém studio · design and dev studio · open for new projects.",
  socials: {
    linkedin: "https://www.linkedin.com",
    instagram: "https://www.instagram.com",
  },
};

const defaultServices = [
  {
    title: "Brand Systems",
    desc: "Names, identities, and art direction that translate into real assets and usable templates.",
    meta: "Identity",
    is_published: true,
  },
  {
    title: "Launch & Marketing Sites",
    desc: "High-contrast sites for new products, waitlists, and sharp announcements with real conversions.",
    meta: "Web",
    is_published: true,
  },
  {
    title: "Product UX",
    desc: "Design language, UI flows, and dashboard UI that scales without losing character.",
    meta: "Product",
    is_published: true,
  },
  {
    title: "Design Systems",
    desc: "Tokens, components, and patterns that keep every new screen on-brand and consistent.",
    meta: "Systems",
    is_published: true,
  },
  {
    title: "Studio Retainers",
    desc: "Monthly design and dev support for teams who want a small, focused partner.",
    meta: "Support",
    is_published: true,
  },
  {
    title: "Creative Direction",
    desc: "Visual strategy and art direction for teams working with AI or rapid content pipelines.",
    meta: "Direction",
    is_published: true,
  },
];

const defaultProjects = [
  {
    title: "Fieldnote",
    role: "Identity, marketing site, product UI",
    summary:
      "Concept: a minimal interface for research teams to collect and share findings without the usual noise.",
    year: "2024",
    focus: "Research",
    is_published: true,
  },
  {
    title: "Northline Studio",
    role: "Art direction, portfolio experience",
    summary: "Study: editorial layout for an architecture studio crossing physical and digital spaces.",
    year: "2023",
    focus: "Editorial",
    is_published: true,
  },
  {
    title: "Sora Analytics",
    role: "Dashboard UI, design system",
    summary: "Concept: fast, legible dashboards that help growth teams make daily calls quickly.",
    year: "2023",
    focus: "Data",
    is_published: true,
  },
  {
    title: "Linea",
    role: "Brand refresh, product marketing",
    summary: "Exploration: a refined logotype, palette, and landing page system for a productivity tool.",
    year: "2022",
    focus: "Brand",
    is_published: true,
  },
  {
    title: "Atlas Health",
    role: "Product UI, onboarding flows",
    summary: "Concept: simplified onboarding and care plans for a digital health platform.",
    year: "2022",
    focus: "Health",
    is_published: true,
  },
  {
    title: "Quiet Supply",
    role: "Identity, ecommerce experience",
    summary: "Study: a restrained identity and shopping journey for a small-batch home goods label.",
    year: "2021",
    focus: "Commerce",
    is_published: true,
  },
];

const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
});

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().min(10).max(2000),
  website: z.string().trim().max(200).optional().nullable(),
});

const settingsSchema = z.object({
  heroBadge: z.string().trim().min(1).max(160),
  heroTitle: z.string().trim().min(1).max(180),
  heroSubtitle: z.string().trim().min(1).max(600),
  heroNotes: z.array(z.string().trim().min(1).max(120)).max(8),
  contactTitle: z.string().trim().min(1).max(160),
  contactSubtitle: z.string().trim().min(1).max(600),
  contactNotes: z.array(z.string().trim().min(1).max(140)).max(6),
  contactEmail: z.string().trim().email().max(200),
  footerBlurb: z.string().trim().min(1).max(200),
  socials: z.object({
    linkedin: z.string().trim().max(200),
    instagram: z.string().trim().max(200),
  }),
});

const serviceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  desc: z.string().trim().min(1).max(400),
  meta: z.string().trim().min(1).max(80),
  is_published: z.boolean().optional().default(true),
});

const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(600),
  year: z.string().trim().min(2).max(12),
  focus: z.string().trim().min(1).max(80),
  is_published: z.boolean().optional().default(true),
});

const servicesSchema = z.array(serviceSchema).max(30);
const projectsSchema = z.array(projectSchema).max(30);

function parseBody(schema, req, res) {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return null;
  }
  return result.data;
}

function createToken() {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(crypto.randomBytes(32))
    .digest("hex");
}

async function applyMigrations() {
  await pool.query(`
    create table if not exists migrations (
      id serial primary key,
      name text not null unique,
      applied_at timestamptz not null default now()
    );
  `);

  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const applied = await pool.query("select name from migrations");
  const appliedSet = new Set(applied.rows.map((row) => row.name));

  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into migrations (name) values ($1)", [file]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}

async function ensureSeed() {
  const settings = await pool.query("select id from settings limit 1");
  if (settings.rows.length === 0) {
    await pool.query("insert into settings (data) values ($1)", [defaultSettings]);
  }

  const services = await pool.query("select id from services limit 1");
  if (services.rows.length === 0) {
    for (const [index, service] of defaultServices.entries()) {
      await pool.query(
        "insert into services (title, meta, description, position, is_published, updated_at) values ($1, $2, $3, $4, $5, now())",
        [service.title, service.meta, service.desc, index, service.is_published]
      );
    }
  }

  const projects = await pool.query("select id from projects limit 1");
  if (projects.rows.length === 0) {
    for (const [index, project] of defaultProjects.entries()) {
      await pool.query(
        "insert into projects (title, role, summary, year, focus, position, is_published, updated_at) values ($1, $2, $3, $4, $5, $6, $7, now())",
        [
          project.title,
          project.role,
          project.summary,
          project.year,
          project.focus,
          index,
          project.is_published,
        ]
      );
    }
  }

  const admin = await pool.query("select id from users where email = $1", [ADMIN_EMAIL]);
  if (admin.rows.length === 0) {
    const passwordHash = ADMIN_PASSWORD_HASH || (await bcrypt.hash(ADMIN_PASSWORD, 10));
    await pool.query(
      "insert into users (email, password_hash, role) values ($1, $2, $3)",
      [ADMIN_EMAIL, passwordHash, "admin"]
    );
  }
}

function buildSessionCookie(token) {
  return cookie.serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieIsSecure,
    sameSite: cookieSameSite,
    path: "/",
    maxAge: Math.floor(sessionTtlMs / 1000),
  });
}

async function getSession(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (!sessionToken) return null;
  const result = await pool.query(
    `
      select sessions.token, sessions.expires_at, sessions.csrf_token, users.id, users.email, users.role
      from sessions
      join users on users.id = sessions.user_id
      where sessions.token = $1 and sessions.expires_at > now()
    `,
    [sessionToken]
  );
  return result.rows[0] || null;
}

function requireAuth() {
  return async (req, res, next) => {
    try {
      const session = await getSession(req);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user = session;
      next();
    } catch (error) {
      res.status(500).json({ error: "Auth failed" });
    }
  };
}

async function ensureCsrfToken(session) {
  if (session?.csrf_token) return session.csrf_token;
  const token = createToken();
  await pool.query("update sessions set csrf_token = $1 where token = $2", [
    token,
    session.token,
  ]);
  session.csrf_token = token;
  return token;
}

function requireCsrf() {
  return async (req, res, next) => {
    const token = req.get("x-csrf-token");
    if (!token) {
      return res.status(403).json({ error: "Missing CSRF token" });
    }
    if (!req.user || req.user.csrf_token !== token) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    next();
  };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/public/content", async (req, res) => {
  const settings = await pool.query("select data from settings order by id limit 1");
  const services = await pool.query(
    "select id, title, meta, description as desc from services where coalesce(is_published, true) = true order by position asc"
  );
  const projects = await pool.query(
    "select id, title, role, summary, year, focus from projects where coalesce(is_published, true) = true order by position asc"
  );
  res.json({
    settings: settings.rows[0]?.data || defaultSettings,
    services: services.rows,
    projects: projects.rows,
  });
});

app.post("/api/public/inquiries", inquiryLimiter, async (req, res) => {
  const data = parseBody(inquirySchema, req, res);
  if (!data) return;
  const { name, email, company, message, website } = data;
  if (website) {
    return res.status(201).json({ status: "ok" });
  }
  await pool.query(
    "insert into inquiries (name, email, company, message) values ($1, $2, $3, $4)",
    [name, email, company || null, message]
  );
  res.status(201).json({ status: "ok" });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const data = parseBody(loginSchema, req, res);
  if (!data) return;
  const { email, password } = data;
  const result = await pool.query("select * from users where email = $1", [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = createToken();
  const csrfToken = createToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs);
  await pool.query(
    "insert into sessions (user_id, token, csrf_token, expires_at) values ($1, $2, $3, $4)",
    [user.id, token, csrfToken, expiresAt]
  );

  res.setHeader("Set-Cookie", buildSessionCookie(token));
  res.json({ user: { id: user.id, email: user.email, role: user.role }, csrfToken });
});

app.post("/api/auth/logout", requireAuth(), requireCsrf(), async (req, res) => {
  await pool.query("delete from sessions where token = $1", [req.user.token]);
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: cookieIsSecure,
      sameSite: cookieSameSite,
      path: "/",
      maxAge: 0,
    })
  );
  res.status(204).end();
});

app.get("/api/auth/csrf", requireAuth(), async (req, res) => {
  const csrfToken = await ensureCsrfToken(req.user);
  res.json({ csrfToken });
});

app.get("/api/admin/me", requireAuth(), async (req, res) => {
  const csrfToken = await ensureCsrfToken(req.user);
  res.json({ user: req.user, csrfToken });
});

app.get("/api/admin/content", requireAuth(), async (req, res) => {
  const settings = await pool.query("select id, data from settings order by id limit 1");
  const services = await pool.query(
    "select id, title, meta, description as desc, position, is_published, updated_at from services order by position asc"
  );
  const projects = await pool.query(
    "select id, title, role, summary, year, focus, position, is_published, updated_at from projects order by position asc"
  );
  const inquiries = await pool.query(
    "select id, name, email, company, message, created_at from inquiries order by created_at desc limit 50"
  );
  const media = await pool.query(
    "select id, filename, original_name, mime, size, created_at from media order by created_at desc limit 100"
  );
  res.json({
    settings: settings.rows[0]?.data || defaultSettings,
    services: services.rows,
    projects: projects.rows,
    inquiries: inquiries.rows,
    media: media.rows.map((item) => ({
      ...item,
      url: `/uploads/${item.filename}`,
    })),
  });
});

app.put("/api/admin/settings", requireAuth(), requireCsrf(), async (req, res) => {
  const data = parseBody(settingsSchema, req, res);
  if (!data) return;
  const current = await pool.query("select id from settings order by id limit 1");
  if (current.rows.length === 0) {
    await pool.query("insert into settings (data) values ($1)", [data]);
  } else {
    await pool.query("update settings set data = $1, updated_at = now() where id = $2", [
      data,
      current.rows[0].id,
    ]);
  }
  res.json({ status: "ok" });
});

app.put("/api/admin/services", requireAuth(), requireCsrf(), async (req, res) => {
  const items = parseBody(servicesSchema, req, res);
  if (!items) return;
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from services");
    for (const [index, item] of items.entries()) {
      await client.query(
        "insert into services (title, meta, description, position, is_published, updated_at) values ($1, $2, $3, $4, $5, now())",
        [item.title, item.meta, item.desc, index, item.is_published ?? true]
      );
    }
    await client.query("commit");
    res.json({ status: "ok" });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: "Failed to save services" });
  } finally {
    client.release();
  }
});

app.put("/api/admin/projects", requireAuth(), requireCsrf(), async (req, res) => {
  const items = parseBody(projectsSchema, req, res);
  if (!items) return;
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from projects");
    for (const [index, item] of items.entries()) {
      await client.query(
        "insert into projects (title, role, summary, year, focus, position, is_published, updated_at) values ($1, $2, $3, $4, $5, $6, $7, now())",
        [
          item.title,
          item.role,
          item.summary,
          item.year,
          item.focus,
          index,
          item.is_published ?? true,
        ]
      );
    }
    await client.query("commit");
    res.json({ status: "ok" });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: "Failed to save projects" });
  } finally {
    client.release();
  }
});

app.get("/api/admin/inquiries", requireAuth(), async (req, res) => {
  const inquiries = await pool.query(
    "select id, name, email, company, message, created_at from inquiries order by created_at desc limit 100"
  );
  res.json({ inquiries: inquiries.rows });
});

app.get("/api/admin/media", requireAuth(), async (req, res) => {
  const media = await pool.query(
    "select id, filename, original_name, mime, size, created_at from media order by created_at desc limit 200"
  );
  res.json({
    media: media.rows.map((item) => ({
      ...item,
      url: `/uploads/${item.filename}`,
    })),
  });
});

app.post(
  "/api/admin/media",
  requireAuth(),
  requireCsrf(),
  uploadLimiter,
  upload.single("file"),
  async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const { filename, originalname, mimetype, size, path: filePath } = req.file;
  const detected = await fileTypeFromFile(filePath);
  if (!detected || !allowedUploadMime.has(detected.mime)) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(400).json({ error: "Unsupported file type" });
  }
  const safeMime = detected?.mime || mimetype;
  const result = await pool.query(
    "insert into media (filename, original_name, mime, size) values ($1, $2, $3, $4) returning id, filename, original_name, mime, size, created_at",
    [filename, originalname, safeMime, size]
  );
  const item = result.rows[0];
  res.status(201).json({ media: { ...item, url: `/uploads/${item.filename}` } });
  }
);

app.delete("/api/admin/media/:id", requireAuth(), requireCsrf(), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  const result = await pool.query(
    "select id, filename from media where id = $1",
    [id]
  );
  const item = result.rows[0];
  if (!item) return res.status(404).json({ error: "Not found" });
  await pool.query("delete from media where id = $1", [id]);
  const filePath = path.join(uploadRoot, item.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large" });
  }
  if (err?.message === "Unsupported file type") {
    return res.status(400).json({ error: "Unsupported file type" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

function isDefaultSecret(value) {
  if (!value) return true;
  return ["change-me", "changeme", "password", "default"].includes(value.toLowerCase());
}

function ensureEnvReady() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (isProduction && isDefaultSecret(SESSION_SECRET)) {
    throw new Error("SESSION_SECRET must be set in production");
  }
  if (isProduction && !ADMIN_PASSWORD_HASH && isDefaultSecret(ADMIN_PASSWORD)) {
    throw new Error("ADMIN_PASSWORD must be set in production");
  }
}

async function pruneExpiredSessions() {
  await pool.query("delete from sessions where expires_at <= now()");
}

async function start() {
  ensureEnvReady();
  await applyMigrations();
  await ensureSeed();
  await pruneExpiredSessions();
  const pruneInterval = 1000 * 60 * 60 * 6;
  setInterval(() => {
    pruneExpiredSessions().catch(() => {});
  }, pruneInterval).unref();
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
