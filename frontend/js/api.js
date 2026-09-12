const WORKER_URL = window.PERSONAL_AI_WORKER_URL || "";

export async function api(path, options = {}) {
  const response = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

export function watchTask(taskId, { onTask, onError, onClose } = {}) {
  if (!taskId || typeof EventSource === "undefined") return null;
  const source = new EventSource(`${WORKER_URL}/api/realtime?taskId=${encodeURIComponent(taskId)}`);
  source.addEventListener("task", event => onTask?.(JSON.parse(event.data).task));
  source.addEventListener("error", event => {
    try { onError?.(JSON.parse(event.data)); } catch { onError?.({ code: "REALTIME_ERROR" }); }
  });
  source.addEventListener("closed", event => {
    try { onClose?.(JSON.parse(event.data)); } finally { source.close(); }
  });
  return source;
}
