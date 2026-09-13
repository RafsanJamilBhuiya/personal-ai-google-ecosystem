import "./runtime-config.js";

const configuredWorkerUrl = typeof window !== "undefined" ? window.PERSONAL_AI_WORKER_URL : "";
const WORKER_URL = String(configuredWorkerUrl || "").trim().replace(/\/$/, "");

function buildUrl(path) {
  if (!path.startsWith("/")) throw new Error("API path must start with '/'");
  return `${WORKER_URL}${path}`;
}

export async function api(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 30000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (!headers["x-request-id"]) headers["x-request-id"] = crypto.randomUUID();
  try {
    const response = await fetch(buildUrl(path), { credentials: "include", ...options, headers, signal: options.signal || controller.signal });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) {
      const error = new Error(data.message || data.error || `HTTP ${response.status}`);
      error.code = data.error || `HTTP_${response.status}`;
      error.status = response.status;
      error.requestId = data.requestId || response.headers.get("x-request-id") || null;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`API request timed out after ${timeoutMs}ms`);
      timeoutError.code = "API_TIMEOUT";
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally { clearTimeout(timer); }
}

export function workerConfigured() { return Boolean(WORKER_URL); }

export function watchTask(taskId, { onConnected, onTask, onHeartbeat, onTimeout, onError, onClose, reconnect = true, maxReconnects = 5, timeoutMs = 120000 } = {}) {
  if (!taskId || typeof EventSource === "undefined") return null;
  if (!WORKER_URL) { onError?.({ code: "WORKER_URL_NOT_CONFIGURED" }); return null; }
  let source = null, attempts = 0, closedByClient = false, lastEventId = "", timeout;
  const close = (notify = true) => { clearTimeout(timeout); source?.close(); if (notify && !closedByClient) onClose?.({ task_id: taskId, reason: "closed" }); };
  const armTimeout = () => { clearTimeout(timeout); timeout = setTimeout(() => { onTimeout?.({ task_id: taskId, code: "REALTIME_TIMEOUT" }); close(); }, timeoutMs); };
  const connect = () => {
    const url = new URL(`${WORKER_URL}/api/realtime`);
    url.searchParams.set("taskId", taskId);
    if (lastEventId) url.searchParams.set("lastEventId", lastEventId);
    source = new EventSource(url, { withCredentials: true });
    source.addEventListener("connected", e => { attempts = 0; armTimeout(); try { onConnected?.(JSON.parse(e.data)); } catch {} });
    source.addEventListener("task", e => { lastEventId = e.lastEventId || lastEventId; armTimeout(); try { onTask?.(JSON.parse(e.data)); } catch { onError?.({ code: "INVALID_REALTIME_EVENT" }); } });
    source.addEventListener("heartbeat", e => { lastEventId = e.lastEventId || lastEventId; armTimeout(); try { onHeartbeat?.(JSON.parse(e.data)); } catch {} });
    source.addEventListener("timeout", e => { lastEventId = e.lastEventId || lastEventId; try { onTimeout?.(JSON.parse(e.data)); } catch { onTimeout?.({ task_id: taskId }); } close(); });
    source.addEventListener("error", e => {
      let payload = { code: "REALTIME_ERROR" }; try { payload = JSON.parse(e.data); } catch {}
      onError?.(payload); clearTimeout(timeout); source?.close();
      if (!closedByClient && reconnect && attempts < maxReconnects) { attempts += 1; setTimeout(connect, Math.min(1000 * 2 ** (attempts - 1), 10000)); }
      else if (!closedByClient) onClose?.({ task_id: taskId, reason: "connection_error" });
    });
    source.addEventListener("closed", e => { if (!closedByClient) { try { onClose?.(JSON.parse(e.data)); } catch { onClose?.({ task_id: taskId }); } } close(false); });
    armTimeout();
  };
  connect();
  return { close: () => { closedByClient = true; close(false); }, reconnect: () => { closedByClient = false; attempts = 0; source?.close(); connect(); } };
}
