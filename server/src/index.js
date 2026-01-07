import fs from "fs";
import path from "path";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const {
  PORT = 8080,
  DATABASE_URL,
  DATABASE_SSL = "true",
  SESSION_SECRET = "change-me",
  ADMIN_EMAIL = "admin@emblem.studio",
  ADMIN_PASSWORD = "change-me",
  CORS_ORIGIN = "http://localhost:3000",
  NODE_ENV = "development",
  COOKIE_SECURE = "false",
} = process.env;

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

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);

const cookieIsSecure = COOKIE_SECURE === "true" || NODE_ENV === "production";

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
  },
  {
    title: "Launch & Marketing Sites",
    desc: "High-contrast sites for new products, waitlists, and sharp announcements with real conversions.",
    meta: "Web",
  },
  {
    title: "Product UX",
    desc: "Design language, UI flows, and dashboard UI that scales without losing character.",
    meta: "Product",
  },
  {
    title: "Design Systems",
    desc: "Tokens, components, and patterns that keep every new screen on-brand and consistent.",
    meta: "Systems",
  },
  {
    title: "Studio Retainers",
    desc: "Monthly design and dev support for teams who want a small, focused partner.",
    meta: "Support",
  },
  {
    title: "Creative Direction",
    desc: "Visual strategy and art direction for teams working with AI or rapid content pipelines.",
    meta: "Direction",
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
  },
  {
    title: "Northline Studio",
    role: "Art direction, portfolio experience",
    summary: "Study: editorial layout for an architecture studio crossing physical and digital spaces.",
    year: "2023",
    focus: "Editorial",
  },
  {
    title: "Sora Analytics",
    role: "Dashboard UI, design system",
    summary: "Concept: fast, legible dashboards that help growth teams make daily calls quickly.",
    year: "2023",
    focus: "Data",
  },
  {
    title: "Linea",
    role: "Brand refresh, product marketing",
    summary: "Exploration: a refined logotype, palette, and landing page system for a productivity tool.",
    year: "2022",
    focus: "Brand",
  },
  {
    title: "Atlas Health",
    role: "Product UI, onboarding flows",
    summary: "Concept: simplified onboarding and care plans for a digital health platform.",
    year: "2022",
    focus: "Health",
  },
  {
    title: "Quiet Supply",
    role: "Identity, ecommerce experience",
    summary: "Study: a restrained identity and shopping journey for a small-batch home goods label.",
    year: "2021",
    focus: "Commerce",
  },
];

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
        "insert into services (title, meta, description, position) values ($1, $2, $3, $4)",
        [service.title, service.meta, service.desc, index]
      );
    }
  }

  const projects = await pool.query("select id from projects limit 1");
  if (projects.rows.length === 0) {
    for (const [index, project] of defaultProjects.entries()) {
      await pool.query(
        "insert into projects (title, role, summary, year, focus, position) values ($1, $2, $3, $4, $5, $6)",
        [project.title, project.role, project.summary, project.year, project.focus, index]
      );
    }
  }

  const admin = await pool.query("select id from users where email = $1", [ADMIN_EMAIL]);
  if (admin.rows.length === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      "insert into users (email, password_hash, role) values ($1, $2, $3)",
      [ADMIN_EMAIL, passwordHash, "admin"]
    );
  }
}

function buildSessionCookie(token) {
  return cookie.serialize("session", token, {
    httpOnly: true,
    secure: cookieIsSecure,
    sameSite: cookieIsSecure ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function getSession(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  if (!cookies.session) return null;
  const result = await pool.query(
    `
      select sessions.token, sessions.expires_at, users.id, users.email, users.role
      from sessions
      join users on users.id = sessions.user_id
      where sessions.token = $1 and sessions.expires_at > now()
    `,
    [cookies.session]
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/public/content", async (req, res) => {
  const settings = await pool.query("select data from settings order by id limit 1");
  const services = await pool.query(
    "select id, title, meta, description as desc from services order by position asc"
  );
  const projects = await pool.query(
    "select id, title, role, summary, year, focus from projects order by position asc"
  );
  res.json({
    settings: settings.rows[0]?.data || defaultSettings,
    services: services.rows,
    projects: projects.rows,
  });
});

app.post("/api/public/inquiries", async (req, res) => {
  const { name, email, company, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }
  await pool.query(
    "insert into inquiries (name, email, company, message) values ($1, $2, $3, $4)",
    [name, email, company || null, message]
  );
  res.status(201).json({ status: "ok" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }
  const result = await pool.query("select * from users where email = $1", [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${user.id}-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await pool.query(
    "insert into sessions (user_id, token, expires_at) values ($1, $2, $3)",
    [user.id, token, expiresAt]
  );

  res.setHeader("Set-Cookie", buildSessionCookie(token));
  res.json({ user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/api/auth/logout", async (req, res) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  if (cookies.session) {
    await pool.query("delete from sessions where token = $1", [cookies.session]);
  }
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("session", "", {
      httpOnly: true,
      secure: cookieIsSecure,
      sameSite: cookieIsSecure ? "none" : "lax",
      path: "/",
      maxAge: 0,
    })
  );
  res.status(204).end();
});

app.get("/api/admin/me", requireAuth(), (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/admin/content", requireAuth(), async (req, res) => {
  const settings = await pool.query("select id, data from settings order by id limit 1");
  const services = await pool.query(
    "select id, title, meta, description as desc, position from services order by position asc"
  );
  const projects = await pool.query(
    "select id, title, role, summary, year, focus, position from projects order by position asc"
  );
  const inquiries = await pool.query(
    "select id, name, email, company, message, created_at from inquiries order by created_at desc limit 50"
  );
  res.json({
    settings: settings.rows[0]?.data || defaultSettings,
    services: services.rows,
    projects: projects.rows,
    inquiries: inquiries.rows,
  });
});

app.put("/api/admin/settings", requireAuth(), async (req, res) => {
  const data = req.body || {};
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

app.put("/api/admin/services", requireAuth(), async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from services");
    for (const [index, item] of items.entries()) {
      await client.query(
        "insert into services (title, meta, description, position) values ($1, $2, $3, $4)",
        [item.title || "", item.meta || "", item.desc || "", index]
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

app.put("/api/admin/projects", requireAuth(), async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from projects");
    for (const [index, item] of items.entries()) {
      await client.query(
        "insert into projects (title, role, summary, year, focus, position) values ($1, $2, $3, $4, $5, $6)",
        [
          item.title || "",
          item.role || "",
          item.summary || "",
          item.year || "",
          item.focus || "",
          index,
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

async function start() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  await applyMigrations();
  await ensureSeed();
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
