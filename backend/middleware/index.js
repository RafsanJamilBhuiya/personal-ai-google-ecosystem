import { getSession } from "../security/auth.js";

export class HttpError extends Error {
  constructor(status, code, message, details = undefined) { super(message); this.name="HttpError"; this.status=status; this.code=code; this.details=details; }
}

const PUBLIC_PATHS = new Set([
  "/health",
  "/api/status",
  "/api/auth/google/url",
  "/api/auth/google/callback",
  "/api/auth/otp",
  "/api/auth/status",
  "/api/auth/logout"
]);

export async function withMiddleware(request, env, handler) {
  const requestId=request.headers.get("x-request-id")||crypto.randomUUID(), startedAt=Date.now();
  try {
    const url=new URL(request.url);
    let session=null;
    if(!PUBLIC_PATHS.has(url.pathname)) {
      session=await getSession(env,request);
      if(!session) throw new HttpError(401,"AUTH_REQUIRED","Authentication required");
    }
    const result=await handler({request,env,requestId,session});
    return {result,requestId,durationMs:Date.now()-startedAt};
  } catch(error) {
    if(error instanceof HttpError) throw error;
    console.error(JSON.stringify({event:"unhandled_error",requestId,message:error?.message}));
    throw new HttpError(error?.status||500,error?.code||"INTERNAL_ERROR",error?.message||"Internal server error");
  }
}

export function validateCommandPayload(body){
  if(!body||typeof body!=="object")throw new HttpError(400,"INVALID_BODY","Request body must be an object");
  if(typeof body.command!=="string"||!body.command.trim())throw new HttpError(400,"INVALID_COMMAND","A non-empty command is required");
  if(body.command.length>4000)throw new HttpError(413,"COMMAND_TOO_LARGE","Command exceeds 4000 characters");
  return {...body,command:body.command.trim()};
}
