import { api } from "./api.js";

const set = (id, value) => { const el = document.querySelector(`#${id}`); if (el) el.textContent = value; };
const renderCards = (containerId, items, formatter) => {
  const el = document.querySelector(`#${containerId}`);
  if (!el) return;
  el.replaceChildren();
  if (!items.length) { const p = document.createElement("p"); p.textContent = "No configured items."; el.appendChild(p); return; }
  for (const item of items) {
    const card = document.createElement("div");
    card.className = "service-item";
    const title = document.createElement("strong"); title.textContent = formatter.title(item);
    const status = document.createElement("span"); status.className = formatter.ok(item) ? "ok" : "muted"; status.textContent = formatter.status(item);
    card.append(title, status); el.appendChild(card);
  }
};

async function connectGoogle() {
  const button = document.querySelector("#google-connect");
  try {
    button.disabled = true; button.textContent = "Opening Google…";
    const result = await api("/api/google/auth/url");
    if (!result.authorization_url) throw new Error("AUTH_URL_NOT_AVAILABLE");
    window.location.assign(result.authorization_url);
  } catch (error) {
    set("dashboard-message", `Google connection unavailable: ${error.code || error.message}`);
    button.disabled = false; button.textContent = "Connect Google";
  }
}

async function initializeDatabase() {
  const button = document.querySelector("#database-init");
  try {
    button.disabled = true; button.textContent = "Initializing…";
    const result = await api("/api/google/database/initialize", { method: "POST", body: "{}" });
    const created = result.result?.created || [];
    set("dashboard-message", created.length ? `Database initialized. Created: ${created.join(", ")}.` : "Database is already initialized.");
  } catch (error) {
    set("dashboard-message", `Database initialization unavailable: ${error.code || error.message}`);
  } finally { button.disabled = false; button.textContent = "Initialize Database"; }
}

async function loadDashboard() {
  try {
    const [health, status, tasks, auth] = await Promise.all([
      api("/health"), api("/api/status"), api("/api/tasks"), api("/api/google/auth/status")
    ]);
    set("backend-status", "Online"); set("backend-time", health.time || "Live Worker");
    const google = status.integrations?.google || [];
    const ai = status.integrations?.ai || [];
    const googleReady = Object.values(auth.services || {}).filter(x => x.granted).length;
    set("google-status", auth.connected ? "Connected" : "Not connected");
    set("google-auth", `${googleReady}/${Object.keys(auth.services || {}).length || google.length || 0} scopes granted`);
    set("google-scope-summary", auth.connected ? `${googleReady} scopes granted` : "OAuth required");
    set("ai-status", `${ai.filter(x => x.configured || x.status === "ready").length}/${ai.length || 0} ready`);
    set("ai-detail", ai.length ? "Provider registry online" : "No providers configured");
    const rows = tasks.result?.rows || [];
    set("task-count", String(Math.max(0, rows.length)));
    set("task-detail", rows.length ? "Persisted in task store" : "No tasks yet");
    renderCards("google-services", google, { title: x => x.id, ok: x => x.enabled || x.status === "ready", status: x => x.enabled || x.status === "ready" ? "Ready" : (x.status || "Not configured") });
    renderCards("ai-providers", ai, { title: x => x.name || x.id, ok: x => x.configured || x.status === "ready", status: x => x.configured || x.status === "ready" ? "Configured" : (x.status || "Unavailable") });
    const list = document.querySelector("#recent-tasks");
    if (list) {
      list.replaceChildren();
      for (const row of rows.slice(-10).reverse()) { const item = document.createElement("li"); item.textContent = `${row[0] || "task"} · ${row[3] || row[4] || "unknown"}`; list.appendChild(item); }
      if (!rows.length) { const item = document.createElement("li"); item.textContent = "No tasks recorded yet."; list.appendChild(item); }
    }
    set("dashboard-message", "Live dashboard synchronized with the Worker.");
  } catch (error) {
    set("backend-status", "Offline"); set("backend-time", error.code || error.message); set("dashboard-message", `Live data unavailable: ${error.code || error.message}`);
  }
}

document.querySelector("#google-connect")?.addEventListener("click", connectGoogle);
document.querySelector("#database-init")?.addEventListener("click", initializeDatabase);
loadDashboard();
setInterval(loadDashboard, 15000);
