const BASE = "https://www.googleapis.com";

async function accessToken(env) {
  if (env?.GOOGLE_ACCESS_TOKEN) return env.GOOGLE_ACCESS_TOKEN;
  if (!env?.GOOGLE_REFRESH_TOKEN || !env?.GOOGLE_OAUTH_CLIENT_ID || !env?.GOOGLE_OAUTH_CLIENT_SECRET) {
    const e = new Error("Google OAuth token configuration is missing"); e.code = "GOOGLE_AUTH_REQUIRED"; throw e;
  }
  const body = new URLSearchParams({ client_id: env.GOOGLE_OAUTH_CLIENT_ID, client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token" });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json();
  if (!response.ok || !data.access_token) { const e = new Error("Google access-token refresh failed"); e.code = "GOOGLE_TOKEN_REFRESH_FAILED"; e.status = response.status; throw e; }
  return data.access_token;
}

export async function googleFetch(env, path, options = {}) {
  const token = await accessToken(env);
  const headers = new Headers(options.headers || {});
  headers.set("authorization", `Bearer ${token}`);
  headers.set("accept", "application/json");
  if (options.body !== undefined && !(options.body instanceof FormData) && !headers.has("content-type")) headers.set("content-type", "application/json");
  let response = await fetch(`${BASE}${path}`, { ...options, headers });
  if (response.status === 401 && env?.GOOGLE_REFRESH_TOKEN) {
    const fresh = await accessToken({ ...env, GOOGLE_ACCESS_TOKEN: undefined });
    headers.set("authorization", `Bearer ${fresh}`);
    response = await fetch(`${BASE}${path}`, { ...options, headers });
  }
  if (!response.ok) { const text = await response.text(); const e = new Error(`Google API request failed (${response.status})`); e.code = "GOOGLE_API_ERROR"; e.status = response.status; e.details = text.slice(0, 1000); throw e; }
  if (response.status === 204) return null;
  return response.json();
}
