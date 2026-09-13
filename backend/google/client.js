import { getValidAccessToken } from "./token-store.js";

const BASE = "https://www.googleapis.com";

export async function googleFetch(env, path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const makeRequest = async token => {
    const headers = new Headers(options.headers || {});
    headers.set("authorization", `Bearer ${token}`);
    headers.set("accept", "application/json");
    return fetch(url, { ...options, headers });
  };
  let response = await makeRequest(await getValidAccessToken(env));
  if (response.status === 401) response = await makeRequest(await getValidAccessToken(env, { forceRefresh: true }));
  if (!response.ok) {
    const text = await response.text();
    const e = new Error(`Google API request failed (${response.status})`);
    e.code = "GOOGLE_API_ERROR";
    e.status = response.status;
    e.details = text.slice(0, 500);
    throw e;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  try { return text ? JSON.parse(text) : null; } catch { return { raw: text }; }
}

export async function googleBatchUpdate(env, requests, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID, options = {}) {
  if (!spreadsheetId || !Array.isArray(requests) || requests.length === 0) throw new Error("spreadsheetId and non-empty requests are required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    ...options,
    method: "POST",
    headers: { ...(options.headers || {}), "content-type": "application/json" },
    body: JSON.stringify({ requests })
  });
}
