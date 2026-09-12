import { createRouter, jsonResponse } from "./router/index.js";
import { HttpError, validateCommandPayload, withMiddleware } from "./middleware/index.js";
import { createCommandRegistry } from "./commands/index.js";
import { ExecutionEngine } from "./execution/index.js";
import { createProviderRegistry } from "./ai/registry.js";
import { AIRouter } from "./ai/router.js";
import { createGoogleServiceRegistry } from "./google/registry.js";
import { createOAuthState, buildGoogleAuthorizationUrl, exchangeGoogleCode, verifyOAuthState } from "./google/oauth.js";
import { readValues, appendValues, updateValues } from "./google/sheets.js";
import { sendMessage } from "./google/services/gmail.js";
import { createEvent, listEvents } from "./google/services/calendar.js";
import { parseCommand } from "./agent/parser.js";
import { planTask } from "./agent/planner.js";
import { appendActivityLog, appendErrorLog } from "./database/sheets-engine.js";

const originFor = (env) => env.FRONTEND_ORIGIN || "*";
const headers = (origin) => ({ "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization,x-request-id" });
const json = (data, status, origin) => jsonResponse(data, status, origin);

export default { async fetch(request, env) {
  const origin = originFor(env);
  if (request.method === "OPTIONS") return new Response(null, {status:204,headers:headers(origin)});
  const executionEngine = new ExecutionEngine();
  const commands = createCommandRegistry({ executionEngine });
  const providers = createProviderRegistry(env);
  const aiRouter = new AIRouter({ providers, env });
  const googleServices = createGoogleServiceRegistry(env);
  const router = createRouter(new Map([
    ["GET /health", async () => json({ok:true,service:"worker", time:new Date().toISOString()},200,origin)],
    ["GET /api/status", async () => json({ok:true,environment:env.APP_ENV||"development",layers:["router","middleware","agent","commands","execution","database"],integrations:{google:[...googleServices.values()].map(({id,status,enabled})=>({id,status,enabled})),ai:aiRouter.listProviders()}},200,origin)],
    ["GET /api/google/auth/url", async () => { const state=await createOAuthState(env); return json({ok:true,authorization_url:buildGoogleAuthorizationUrl(env,state)},200,origin); }],
    ["GET /api/google/auth/callback", async (req) => { const u=new URL(req.url); const code=u.searchParams.get("code"); const state=u.searchParams.get("state"); if(!code || !(await verifyOAuthState(env,state))) throw new HttpError(400,"INVALID_OAUTH_CALLBACK","Invalid or expired OAuth callback"); const token=await exchangeGoogleCode(env,code); return json({ok:true,authorized:true,token_type:token.token_type,scope:token.scope,expires_in:token.expires_in,refresh_token_received:Boolean(token.refresh_token),message:"OAuth succeeded. Store the refresh token in Cloudflare secret GOOGLE_REFRESH_TOKEN; it is never returned by this endpoint."},200,origin); }],
    ["GET /api/google/sheets/values", async (req) => { const u=new URL(req.url); const range=u.searchParams.get("range"); if(!range) throw new HttpError(400,"RANGE_REQUIRED","range is required"); return json({ok:true,result:await readValues(env,range,u.searchParams.get("spreadsheetId")||env.GOOGLE_SPREADSHEET_ID)},200,origin); }],
    ["POST /api/google/sheets/values", async (req) => { const b=await req.json(); if(!b.range || !Array.isArray(b.values)) throw new HttpError(400,"INVALID_SHEETS_PAYLOAD","range and values[] are required"); const result=b.mode==="update"?await updateValues(env,b.range,b.values,b.spreadsheetId):await appendValues(env,b.range,b.values,b.spreadsheetId); return json({ok:true,result},200,origin); }],
    ["GET /api/google/calendar/events", async (req) => { const u=new URL(req.url); return json({ok:true,result:await listEvents(env,u.searchParams.get("calendarId")||"primary",u.searchParams.get("timeMin")||new Date().toISOString(),Number(u.searchParams.get("maxResults")||50))},200,origin); }],
    ["POST /api/google/calendar/events", async (req) => { const b=await req.json(); return json({ok:true,result:await createEvent(env,b.event,b.calendarId||"primary")},200,origin); }],
    ["POST /api/google/gmail/send", async (req) => { const b=await req.json(); return json({ok:true,result:await sendMessage(env,b)},200,origin); }],
    ["POST /api/ai/generate", async (req) => { const b=await req.json(); return json({ok:true,result:await aiRouter.generate(b)},200,origin); }],
    ["POST /api/command", async (req,context) => { let body; try{body=await req.json();}catch{throw new HttpError(400,"INVALID_JSON","Request body must be valid JSON");} body=validateCommandPayload(body); const parsed=parseCommand(body); const planned=planTask(parsed); const handler=commands.get(body.intent||parsed.intent)||commands.get("task.create"); if(!handler) throw new HttpError(400,"UNKNOWN_COMMAND","Unsupported command"); const result=await handler({...body,requestId:context.requestId,parsed,plan:planned}); await appendActivityLog(env,{source:body.source||"api",action:parsed.intent,task_id:result?.task_id||"",service:parsed.intent?.startsWith("google.")?parsed.intent.split(".")[1]:"system",status:"accepted",message:"Command accepted"}).catch(()=>{}); return json({ok:true,requestId:context.requestId,intent:parsed.intent,plan:planned,result},200,origin); }]
  ]));
  try { const {result}=await withMiddleware(request,env,({request:req,requestId})=>router(req,{requestId})); if(result)return result; return json({ok:false,error:"NOT_FOUND"},404,origin); }
  catch(error){ const e=error instanceof HttpError?error:new HttpError(500,error?.code||"INTERNAL_ERROR","Internal server error"); await appendErrorLog(env,{source:"worker",code:e.code,message:e.message,request_id:request.headers.get("x-request-id")||""}).catch(()=>{}); return json({ok:false,error:e.code,message:e.message},e.status,origin); }
} };
