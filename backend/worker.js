import { createRouter, jsonResponse } from "./router/index.js";
import { HttpError, validateCommandPayload, withMiddleware } from "./middleware/index.js";
import { createCommandRegistry } from "./commands/index.js";
import { ExecutionEngine } from "./execution/index.js";

const originFor = (env) => env.FRONTEND_ORIGIN || "*";
const corsHeaders = (origin) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-request-id"
});

export default {
  async fetch(request, env) {
    const origin = originFor(env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

    const executionEngine = new ExecutionEngine();
    const commands = createCommandRegistry({ executionEngine });
    const router = createRouter(new Map([
      ["GET /health", async () => jsonResponse({ ok: true, service: "worker", time: new Date().toISOString() }, 200, origin)],
      ["GET /api/status", async () => jsonResponse({
        ok: true,
        environment: env.APP_ENV || "development",
        layers: ["router", "middleware", "commands", "execution"],
        integrations: { google: "not-configured", ai: "not-configured" }
      }, 200, origin)],
      ["POST /api/command", async (req, context) => {
        let body;
        try { body = await req.json(); } catch { throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON"); }
        body = validateCommandPayload(body);
        const commandName = body.intent || "task.create";
        const handler = commands.get(commandName);
        if (!handler) throw new HttpError(400, "UNKNOWN_COMMAND", `Unsupported command: ${commandName}`);
        const result = await handler({ ...body, requestId: context.requestId });
        return jsonResponse({ ok: true, requestId: context.requestId, result }, 200, origin);
      }]
    ]));

    try {
      const { result } = await withMiddleware(request, env, ({ request: req, requestId }) => router(req, { requestId }));
      if (result) return result;
      return jsonResponse({ ok: false, error: "NOT_FOUND" }, 404, origin);
    } catch (error) {
      const e = error instanceof HttpError ? error : new HttpError(500, "INTERNAL_ERROR", "Internal server error");
      return jsonResponse({ ok: false, error: e.code, message: e.message }, e.status, origin);
    }
  }
};
