import { api } from "./api.js";

const set = (id, value) => { const el = document.querySelector(`#${id}`); if (el) el.textContent = value; };

async function loadDashboard() {
  try {
    const [health, status, tasks] = await Promise.all([api("/health"), api("/api/status"), api("/api/tasks")]);
    set("backend-status", `Online · ${health.time}`);
    const google = status.integrations?.google || [];
    const ai = status.integrations?.ai || [];
    set("google-status", `${google.filter(x => x.enabled || x.status === "ready").length}/${google.length || 0} configured`);
    set("ai-status", `${ai.filter(x => x.configured || x.status === "ready").length}/${ai.length || 0} configured`);
    const rows = tasks.result?.rows || [];
    set("task-count", String(Math.max(0, rows.length)));
    const list = document.querySelector("#recent-tasks");
    if (list) {
      list.replaceChildren();
      for (const row of rows.slice(-10).reverse()) {
        const item = document.createElement("li");
        item.textContent = `${row[0] || "task"} · ${row[3] || row[4] || "unknown"}`;
        list.appendChild(item);
      }
    }
  } catch (error) {
    set("backend-status", `Offline · ${error.code || error.message}`);
  }
}

loadDashboard();
setInterval(loadDashboard, 15000);
