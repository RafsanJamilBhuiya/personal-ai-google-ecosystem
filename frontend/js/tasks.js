import { api, watchTask } from "./api.js";

const list = document.querySelector("#task-status-list");
const render = task => {
  const id = task.task_id || "unknown";
  let el = list.querySelector(`[data-task-id="${CSS.escape(id)}"]`);
  if (!el) { el = document.createElement("article"); el.dataset.taskId = id; list.appendChild(el); }
  const progress = Number.isFinite(Number(task.progress)) ? Number(task.progress) : (["completed","failed","cancelled","timeout"].includes(task.status) ? 100 : 0);
  el.innerHTML = `<strong>${id}</strong><p>${task.status || "unknown"} · ${task.stage || task.status || "queued"}</p><progress max="100" value="${progress}"></progress><small>${progress}%</small>`;
};

async function load() {
  try {
    const result = await api("/api/tasks");
    list.replaceChildren();
    const rows = result.result?.rows || [];
    const headers = result.result?.headers || [];
    const idx = name => headers.indexOf(name);
    for (const row of rows.slice(-30).reverse()) {
      const task = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]));
      render(task);
      if (task.task_id && !["completed","failed","cancelled","timeout"].includes(task.status)) {
        watchTask(task.task_id, { onTask: payload => render(payload.task) });
      }
    }
  } catch (error) {
    list.textContent = `Unable to load tasks: ${error.code || error.message}`;
  }
}
load();
