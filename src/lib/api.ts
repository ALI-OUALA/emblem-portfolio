export const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

let csrfToken = "";

export function setCsrfToken(token: string | null | undefined) {
  csrfToken = token || "";
}

export function clearCsrfToken() {
  csrfToken = "";
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = options.method?.toUpperCase() || "GET";
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Request failed");
    }
    const message = await response.text().catch(() => "Request failed");
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}
