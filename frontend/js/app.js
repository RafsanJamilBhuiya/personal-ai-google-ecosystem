import { api, watchTask } from "./api.js";

const status = document.querySelector("#backend-status");
if (status) {
  api("/health").then(x => { status.textContent = `Online · ${x.time}`; status.dataset.state = "online"; })
    .catch(() => { status.textContent = "Worker not connected — configure PERSONAL_AI_WORKER_URL."; status.dataset.state = "offline"; });
}

const form = document.querySelector("#command-form");
const messages = document.querySelector("#messages");
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

if (form && messages) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const input = form.querySelector("input");
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
        watchTask(taskId, {
          onTask: task => appendMessage("Task", `${task.task_id} → ${task.status}`),
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
