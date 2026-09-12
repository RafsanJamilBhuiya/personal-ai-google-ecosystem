export class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function withMiddleware(request, env, handler) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const result = await handler({ request, env, requestId });
    return { result, requestId, durationMs: Date.now() - startedAt };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error(JSON.stringify({ event: "unhandled_error", requestId, message: error?.message }));
    throw new HttpError(500, "INTERNAL_ERROR", "Internal server error");
  }
}

export function validateCommandPayload(body) {
  if (!body || typeof body !== "object") throw new HttpError(400, "INVALID_BODY", "Request body must be an object");
  if (typeof body.command !== "string" || body.command.trim().length === 0) {
    throw new HttpError(400, "INVALID_COMMAND", "A non-empty command is required");
  }
  if (body.command.length > 4000) throw new HttpError(413, "COMMAND_TOO_LARGE", "Command exceeds 4000 characters");
  return { ...body, command: body.command.trim() };
}
