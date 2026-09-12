const clients = new Map();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function createRealtimeHub() {
  return {
    connect(sessionId, send) {
      if (!sessionId || typeof send !== "function") throw new Error("REALTIME_SESSION_INVALID");
      let set = clients.get(sessionId);
      if (!set) { set = new Set(); clients.set(sessionId, set); }
      set.add(send);
      return () => { set.delete(send); if (!set.size) clients.delete(sessionId); };
    },
    publish(sessionId, event) {
      const set = clients.get(sessionId);
      if (!set) return 0;
      const payload = JSON.stringify({ ...event, timestamp: event.timestamp || new Date().toISOString() });
      for (const send of set) { try { send(payload); } catch { set.delete(send); } }
      if (!set.size) clients.delete(sessionId);
      return set.size;
    },
    sessions() { return clients.size; }
  };
}

export function sseResponse(request, hub, sessionId) {
  if (request.headers.get("accept")?.includes("text/event-stream") !== true) return null;
  const stream = new ReadableStream({
    start(controller) {
      const send = value => controller.enqueue(encoder.encode(`data: ${value}\n\n`));
      const disconnect = hub.connect(sessionId, send);
      send(JSON.stringify({ type: "connected", sessionId, timestamp: new Date().toISOString() }));
      request.signal?.addEventListener("abort", () => { disconnect(); try { controller.close(); } catch {} }, { once: true });
    },
    cancel() {}
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", "connection": "keep-alive" } });
}
