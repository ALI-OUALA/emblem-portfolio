"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";
import { defaultProjects, defaultServices, defaultSettings } from "@/site/content";
import { PrimaryButton, GhostButton } from "@/components/ui/button";

type User = { id: number; email: string; role: string };
type ServiceItem = { id: number; title: string; desc: string; meta: string; position?: number };
type ProjectItem = {
  id: number;
  title: string;
  role: string;
  summary: string;
  year: string;
  focus: string;
  position?: number;
};
type Inquiry = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
};

type MediaItem = {
  id: number;
  filename: string;
  original_name: string;
  mime: string;
  size: number;
  created_at: string;
  url: string;
};

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="admin-shell">Loading dashboard…</div>;
  }

  if (!user) {
    return <Login onSuccess={(u) => setUser(u)} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

function Login({ onSuccess }: { onSuccess: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onSuccess(data.user);
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <div className="stack-sm">
          <div className="pill">Admin Access</div>
          <h1 className="admin-section-title">Sign in to Emblém CMS</h1>
          <p className="admin-note">
            This dashboard controls the public site content. Use your admin credentials.
          </p>
        </div>
        <form className="stack-md" onSubmit={submit}>
          <input
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            required
          />
          <input
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            required
          />
          {error ? <p className="text-xs text-soft">{error}</p> : null}
          <PrimaryButton type="submit">Enter dashboard</PrimaryButton>
        </form>
        <p className="admin-note">API: {API_BASE || "same-origin"}</p>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices as ServiceItem[]);
  const [projects, setProjects] = useState<ProjectItem[]>(defaultProjects as ProjectItem[]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/content")
      .then((data) => {
        setSettings({ ...defaultSettings, ...data.settings });
        setServices(data.services ?? []);
        setProjects(data.projects ?? []);
        setInquiries(data.inquiries ?? []);
        setMedia(data.media ?? []);
      })
      .catch(() => {
        setStatus("Could not load admin content.");
      });
  }, []);

  const saveSettings = async () => {
    setStatus("");
    await apiFetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    setStatus("Settings saved.");
  };

  const saveServices = async () => {
    setStatus("");
    await apiFetch("/api/admin/services", {
      method: "PUT",
      body: JSON.stringify(services),
    });
    setStatus("Services saved.");
  };

  const saveProjects = async () => {
    setStatus("");
    await apiFetch("/api/admin/projects", {
      method: "PUT",
      body: JSON.stringify(projects),
    });
    setStatus("Projects saved.");
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    onLogout();
  };

  const uploadMedia = async (file: File) => {
    if (!API_BASE) {
      setStatus("Set NEXT_PUBLIC_API_URL to enable uploads.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/api/admin/media`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      setStatus("Upload failed.");
      return;
    }
    const data = await response.json();
    setMedia((prev) => [data.media, ...prev]);
    setStatus("Media uploaded.");
  };

  const deleteMedia = async (id: number) => {
    if (!API_BASE) return;
    const response = await fetch(`${API_BASE}/api/admin/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      setStatus("Delete failed.");
      return;
    }
    setMedia((prev) => prev.filter((item) => item.id !== id));
    setStatus("Media deleted.");
  };

  return (
    <div className="admin-shell">
      <div className="admin-header mb-8">
        <div className="stack-sm">
          <div className="pill">Admin Dashboard</div>
          <h1 className="admin-section-title">Emblém control center</h1>
          <p className="admin-note">Signed in as {user.email}</p>
        </div>
        <div className="admin-actions">
          <GhostButton onClick={logout}>Log out</GhostButton>
        </div>
      </div>

      {status ? <p className="text-sm text-soft mb-8">{status}</p> : null}

      <div className="admin-card stack-md">
        <h2 className="admin-section-title">Site settings</h2>
        <div className="admin-grid">
          <label className="stack-sm">
            <span className="text-xs text-soft">Hero badge</span>
            <input
              className="field"
              value={settings.heroBadge}
              onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
            />
          </label>
          <label className="stack-sm">
            <span className="text-xs text-soft">Contact email</span>
            <input
              className="field"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </label>
        </div>
        <label className="stack-sm">
          <span className="text-xs text-soft">Hero title</span>
          <input
            className="field"
            value={settings.heroTitle}
            onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
          />
        </label>
        <label className="stack-sm">
          <span className="text-xs text-soft">Hero subtitle</span>
          <textarea
            className="field"
            rows={3}
            value={settings.heroSubtitle}
            onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
          />
        </label>
        <label className="stack-sm">
          <span className="text-xs text-soft">Hero notes (one per line)</span>
          <textarea
            className="field"
            rows={3}
            value={settings.heroNotes.join("\n")}
            onChange={(e) =>
              setSettings({ ...settings, heroNotes: e.target.value.split("\n").filter(Boolean) })
            }
          />
        </label>
        <label className="stack-sm">
          <span className="text-xs text-soft">Contact headline</span>
          <input
            className="field"
            value={settings.contactTitle}
            onChange={(e) => setSettings({ ...settings, contactTitle: e.target.value })}
          />
        </label>
        <label className="stack-sm">
          <span className="text-xs text-soft">Contact subtitle</span>
          <textarea
            className="field"
            rows={3}
            value={settings.contactSubtitle}
            onChange={(e) => setSettings({ ...settings, contactSubtitle: e.target.value })}
          />
        </label>
        <label className="stack-sm">
          <span className="text-xs text-soft">Contact notes (one per line)</span>
          <textarea
            className="field"
            rows={2}
            value={settings.contactNotes.join("\n")}
            onChange={(e) =>
              setSettings({ ...settings, contactNotes: e.target.value.split("\n").filter(Boolean) })
            }
          />
        </label>
        <label className="stack-sm">
          <span className="text-xs text-soft">Footer blurb</span>
          <input
            className="field"
            value={settings.footerBlurb}
            onChange={(e) => setSettings({ ...settings, footerBlurb: e.target.value })}
          />
        </label>
        <div className="admin-grid">
          <label className="stack-sm">
            <span className="text-xs text-soft">LinkedIn</span>
            <input
              className="field"
              value={settings.socials.linkedin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socials: { ...settings.socials, linkedin: e.target.value },
                })
              }
            />
          </label>
          <label className="stack-sm">
            <span className="text-xs text-soft">Instagram</span>
            <input
              className="field"
              value={settings.socials.instagram}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socials: { ...settings.socials, instagram: e.target.value },
                })
              }
            />
          </label>
        </div>
        <PrimaryButton onClick={saveSettings}>Save settings</PrimaryButton>
      </div>

      <div className="admin-divider" />

      <div className="admin-card stack-md">
        <h2 className="admin-section-title">Services</h2>
        <div className="admin-list">
          {services.map((service, index) => (
            <div key={service.id} className="admin-row">
              <div className="admin-grid">
                <input
                  className="field"
                  value={service.title}
                  onChange={(e) => {
                    const next = [...services];
                    next[index] = { ...service, title: e.target.value };
                    setServices(next);
                  }}
                  placeholder="Service title"
                />
                <input
                  className="field"
                  value={service.meta}
                  onChange={(e) => {
                    const next = [...services];
                    next[index] = { ...service, meta: e.target.value };
                    setServices(next);
                  }}
                  placeholder="Meta label"
                />
              </div>
              <textarea
                className="field"
                rows={2}
                value={service.desc}
                onChange={(e) => {
                  const next = [...services];
                  next[index] = { ...service, desc: e.target.value };
                  setServices(next);
                }}
                placeholder="Description"
              />
              <div className="admin-actions">
                <GhostButton
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...services];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setServices(next);
                  }}
                >
                  Move up
                </GhostButton>
                <GhostButton
                  onClick={() => {
                    if (index === services.length - 1) return;
                    const next = [...services];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setServices(next);
                  }}
                >
                  Move down
                </GhostButton>
                <GhostButton
                  onClick={() => setServices(services.filter((_, i) => i !== index))}
                >
                  Delete
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-actions">
          <GhostButton
            onClick={() =>
              setServices([
                ...services,
                { id: Date.now(), title: "New service", desc: "", meta: "New" },
              ])
            }
          >
            Add service
          </GhostButton>
          <PrimaryButton onClick={saveServices}>Save services</PrimaryButton>
        </div>
      </div>

      <div className="admin-divider" />

      <div className="admin-card stack-md">
        <h2 className="admin-section-title">Projects</h2>
        <div className="admin-list">
          {projects.map((project, index) => (
            <div key={project.id} className="admin-row">
              <div className="admin-grid">
                <input
                  className="field"
                  value={project.title}
                  onChange={(e) => {
                    const next = [...projects];
                    next[index] = { ...project, title: e.target.value };
                    setProjects(next);
                  }}
                  placeholder="Project title"
                />
                <input
                  className="field"
                  value={project.year}
                  onChange={(e) => {
                    const next = [...projects];
                    next[index] = { ...project, year: e.target.value };
                    setProjects(next);
                  }}
                  placeholder="Year"
                />
              </div>
              <div className="admin-grid">
                <input
                  className="field"
                  value={project.role}
                  onChange={(e) => {
                    const next = [...projects];
                    next[index] = { ...project, role: e.target.value };
                    setProjects(next);
                  }}
                  placeholder="Role"
                />
                <input
                  className="field"
                  value={project.focus}
                  onChange={(e) => {
                    const next = [...projects];
                    next[index] = { ...project, focus: e.target.value };
                    setProjects(next);
                  }}
                  placeholder="Focus"
                />
              </div>
              <textarea
                className="field"
                rows={2}
                value={project.summary}
                onChange={(e) => {
                  const next = [...projects];
                  next[index] = { ...project, summary: e.target.value };
                  setProjects(next);
                }}
                placeholder="Summary"
              />
              <div className="admin-actions">
                <GhostButton
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...projects];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setProjects(next);
                  }}
                >
                  Move up
                </GhostButton>
                <GhostButton
                  onClick={() => {
                    if (index === projects.length - 1) return;
                    const next = [...projects];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setProjects(next);
                  }}
                >
                  Move down
                </GhostButton>
                <GhostButton
                  onClick={() => setProjects(projects.filter((_, i) => i !== index))}
                >
                  Delete
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-actions">
          <GhostButton
            onClick={() =>
              setProjects([
                ...projects,
                {
                  id: Date.now(),
                  title: "New project",
                  role: "",
                  summary: "",
                  year: "2026",
                  focus: "New",
                },
              ])
            }
          >
            Add project
          </GhostButton>
          <PrimaryButton onClick={saveProjects}>Save projects</PrimaryButton>
        </div>
      </div>

      <div className="admin-divider" />

      <div className="admin-card stack-md">
        <h2 className="admin-section-title">Recent inquiries</h2>
        {inquiries.length === 0 ? (
          <p className="admin-note">No inquiries yet.</p>
        ) : (
          <div className="admin-list">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="admin-row">
                <div className="admin-grid">
                  <div>
                    <p className="text-sm text-ink">{inquiry.name}</p>
                    <p className="text-xs text-soft">{inquiry.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-soft">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-soft">{inquiry.company || "—"}</p>
                  </div>
                </div>
                <p className="text-sm text-muted">{inquiry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-divider" />

      <div className="admin-card stack-md">
        <h2 className="admin-section-title">Media library</h2>
        <p className="admin-note">
          Upload images to reuse across the site. Max 10MB per file.
        </p>
        <input
          className="field"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadMedia(file);
            event.currentTarget.value = "";
          }}
        />
        {media.length === 0 ? (
          <p className="admin-note">No media uploaded yet.</p>
        ) : (
          <div className="admin-list">
            {media.map((item) => {
              const url = API_BASE ? `${API_BASE}${item.url}` : item.url;
              return (
                <div key={item.id} className="admin-row">
                  <div className="admin-grid">
                    <div className="stack-sm">
                      <p className="text-sm text-ink">{item.original_name}</p>
                      <p className="text-xs text-soft">
                        {Math.round(item.size / 1024)} KB · {item.mime}
                      </p>
                      <a className="text-xs text-soft" href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    </div>
                    {item.mime.startsWith("image/") ? (
                      <img
                        src={url}
                        alt={item.original_name}
                        style={{ width: "100%", border: "2px solid var(--line)" }}
                      />
                    ) : null}
                  </div>
                  <div className="admin-actions">
                    <GhostButton onClick={() => navigator.clipboard.writeText(url)}>
                      Copy URL
                    </GhostButton>
                    <GhostButton onClick={() => deleteMedia(item.id)}>Delete</GhostButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
