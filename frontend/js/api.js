const WORKER_URL = window.PERSONAL_AI_WORKER_URL || "";

export async function api(path, options = {}) {
  const response = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}`);
    error.code = data.error || `HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }
  return data;
}

export function watchTask(taskId, { onConnected, onTask, onHeartbeat, onTimeout, onError, onClose, reconnect = true, maxReconnects = 5 } = {}) {
  if (!taskId || typeof EventSource === "undefined") return null;
  let source = null;
  let attempts = 0;
  let closedByClient = false;
  let lastEventId = "";

  const connect = () => {
    const suffix = lastEventId ? `&lastEventId=${encodeURIComponent(lastEventId)}` : "";
    source = new EventSource(`${WORKER_URL}/api/realtime?taskId=${encodeURIComponent(taskId)}${suffix}`);
    source.addEventListener("connected", event => { attempts = 0; try { onConnected?.(JSON.parse(event.data)); } catch {} });
    source.addEventListener("task", event => { lastEventId = event.lastEventId || lastEventId; try { onTask?.(JSON.parse(event.data)); } catch { onError?.({ code: "INVALID_REALTIME_EVENT" }); } });
    source.addEventListener("heartbeat", event => { lastEventId = event.lastEventId || lastEventId; try { onHeartbeat?.(JSON.parse(event.data)); } catch {} });
    source.addEventListener("timeout", event => { lastEventId = event.lastEventId || lastEventId; try { onTimeout?.(JSON.parse(event.data)); } catch {} });
    source.addEventListener("error", event => {
      let payload = { code: "REALTIME_ERROR" };
      try { payload = JSON.parse(event.data); } catch {}
      onError?.(payload);
      if (!closedByClient && reconnect && attempts < maxReconnects) {
        attempts += 1;
        source.close();
        setTimeout(connect, Math.min(1000 * 2 ** (attempts - 1), 10000));
      }
    });
    source.addEventListener("closed", event => {
      try { onClose?.(JSON.parse(event.data)); } catch { onClose?.({ task_id: taskId }); }
      source.close();
    });
  };
  connect();
  return {
    close() { closedByClient = true; source?.close(); },
    reconnect() { closedByClient = false; attempts = 0; source?.close(); connect(); }
  };
}
