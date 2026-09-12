import { createRouter, jsonResponse } from "./router/index.js";
import { HttpError, validateCommandPayload, withMiddleware } from "./middleware/index.js";
import { createCommandRegistry } from "./commands/index.js";
import { ExecutionEngine } from "./execution/index.js";

function originFor(env) { return env.FRONTEND_ORIGIN || "*"; }

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-request-id"
  };
}

function response(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = originFor(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

    const executionEngine = new ExecutionEngine();
    const commands = createCommandRegistry({ executionEngine });
    const router = createRouter(new Map([
      ["GET /health", async () => response({ ok: true, service: "worker", time: new Date().toISOString() }, 200, origin)],
      ["GET /api/status", async () => response({ ok: true, environment: env.APP_ENV || "development", layers: ["router", "middleware", "commands", "execution"], integrations: { google: "not-configured", ai: "not-configured" } }, 200, origin)],
      ["POST /api/command", async (req, context) => {
        const body = validateCommandPayload(await req.json());
        const commandName = body.intent || "task.create";
        const handler = commands.get(commandName);
        if (!handler) throw new HttpError(400, "UNKNOWN_COMMAND", `Unsupported command: ${commandName}`);
        const result = await handler(body);
        return response({ ok: true, requestId: context.requestId, result }, 200, origin);
      }]
    ]));

    try {
      const routed = await router(request, {});
      if (routed) return routed;
      if (new URL(request.url).pathname === "/api/command") {
        const wrapped = await withMiddleware(request, env, ({ request: req, requestId }) => router(req, { requestId }));
        return wrapped.result;
      }
      return response({ ok: false, error: "NOT_FOUND" }, 404, origin);
    } catch (error) {
      const e = error instanceof HttpError ? error : new HttpError(500, "INTERNAL_ERROR", "Internal server error");
      return response({ ok: false, error: e.code, message: e.message }, e.status, origin);
    }
  }
};
