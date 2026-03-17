export const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

let csrfToken = "";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

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
      throw new ApiError(data?.error || "Request failed", response.status, data);
    }
    const message = await response.text().catch(() => "Request failed");
    throw new ApiError(message || "Request failed", response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}
