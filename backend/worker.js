const json = (data, status = 200, origin = "*") => new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization" } });

const commands = new Map([
  ["system.status", async () => ({ ok: true, service: "personal-ai-google-ecosystem", timestamp: new Date().toISOString() })],
  ["task.create", async (input) => ({ task_id: crypto.randomUUID(), status: "accepted", command: input.command ?? "" })]
]);

function cors(request, env) { return env.FRONTEND_ORIGIN || "*"; }

export default {
  async fetch(request, env) {
    const origin = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization" } });
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok: true, service: "worker", time: new Date().toISOString() }, 200, origin);
    if (url.pathname === "/api/status" && request.method === "GET") return json({ ok: true, environment: env.APP_ENV ?? "unknown", capabilities: ["command-router", "health", "ai-adapter-contract", "google-adapter-contract"] }, 200, origin);
    if (url.pathname === "/api/command" && request.method === "POST") {
      let body; try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400, origin); }
      if (!body || typeof body.command !== "string" || body.command.length > 4000) return json({ ok: false, error: "A command string up to 4000 characters is required" }, 400, origin);
      const key = body.intent || "task.create";
      const handler = commands.get(key) || commands.get("task.create");
      try { return json({ ok: true, result: await handler(body), execution: { status: "completed" } }, 200, origin); } catch { return json({ ok: false, error: "Execution failed" }, 500, origin); }
    }
    return json({ ok: false, error: "Not found" }, 404, origin);
  }
};
