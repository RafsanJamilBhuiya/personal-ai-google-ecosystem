import { api, watchTask } from "./api.js";

const status = document.querySelector("#backend-status");
const messages = document.querySelector("#messages");
const taskState = new Map();

const appendMessage = (label, value, kind = "system") => {
  if (!messages) return;
  const el = document.createElement("div");
  el.className = `message ${kind}`;
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  el.append(strong, document.createTextNode(typeof value === "string" ? value : JSON.stringify(value)));
  messages.appendChild(el);
  el.scrollIntoView({ block: "nearest" });
};

function renderTask(task) {
  const progress = Number.isFinite(Number(task.progress)) ? Number(task.progress) : (["completed", "failed", "cancelled", "timeout"].includes(task.status) ? 100 : 0);
  taskState.set(task.task_id, { ...task, progress });
  const existing = document.querySelector(`[data-task-id="${CSS.escape(task.task_id)}"]`);
  const el = existing || document.createElement("div");
  el.className = "task-status";
  el.dataset.taskId = task.task_id;
  el.innerHTML = `<strong>${task.task_id}</strong><span>${task.status}</span><progress max="100" value="${progress}"></progress><small>${task.stage || task.status} · ${progress}%</small>`;
  const container = document.querySelector("#task-status-list");
  if (container && !existing) container.appendChild(el);
}

if (status) {
  api("/health").then(x => { status.textContent = `Online · ${x.time}`; status.dataset.state = "online"; })
    .catch(() => { status.textContent = "Worker not connected — configure PERSONAL_AI_WORKER_URL."; status.dataset.state = "offline"; });
}

const form = document.querySelector("#command-form");
if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const input = form.querySelector("input, textarea");
    const button = form.querySelector("button");
    const text = input?.value.trim();
    if (!text) return;
    appendMessage("You", text, "user");
    input.value = "";
    if (button) button.disabled = true;
    try {
      const result = await api("/api/command", { method: "POST", body: JSON.stringify({ command: text, source: "chat" }) });
      appendMessage("System", result.result);
      const taskId = result.result?.task_id || result.result?.result?.task_id;
      if (taskId) {
        appendMessage("Realtime", `Watching task ${taskId}…`);
        renderTask({ task_id: taskId, status: "queued", progress: 0, stage: "queued" });
        watchTask(taskId, {
          onTask: payload => { renderTask(payload.task); appendMessage("Task", `${payload.task.task_id} → ${payload.task.status} · ${payload.progress}%`); },
          onTimeout: payload => appendMessage("Realtime", `Stream timeout for ${payload.task_id}`, "error"),
          onError: error => appendMessage("Realtime error", error?.code || "REALTIME_ERROR", "error"),
          onClose: () => appendMessage("Realtime", "Task stream closed")
        });
      }
    } catch (error) {
      appendMessage("Error", error.message, "error");
    } finally {
      if (button) button.disabled = false;
      input?.focus();
    }
  });
}
