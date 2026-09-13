import { createRouter, jsonResponse } from "./router/index.js";
import { HttpError, validateCommandPayload, withMiddleware } from "./middleware/index.js";
import { createCommandRegistry } from "./commands/index.js";
import { createToolRegistry } from "./execution/tools.js";
import { createProviderRegistry } from "./ai/registry.js";
import { AIRouter } from "./ai/router.js";
import { createGoogleServiceRegistry } from "./google/registry.js";
import { beginOAuth, completeOAuth, clearTokens, oauthStatus } from "./google/token-store.js";
import { readValues, appendValues, updateValues } from "./google/sheets.js";
import { sendMessage } from "./google/services/gmail.js";
import { createEvent, listEvents } from "./google/services/calendar.js";
import { drive, docs, forms, blogger } from "./google/services/index.js";
import { parseCommand } from "./agent/parser.js";
import { planTask } from "./agent/planner.js";
import { appendActivityLog, appendErrorLog, readSheet } from "./database/sheets-engine.js";
import { syncGoogleServiceMetadata, upsertPlatformMetadata } from "./database/integration-metadata.js";
import { createTask, findTask } from "./database/task-store.js";
import { initializeDatabase } from "./database/initialize.js";
import { taskEventStream } from "./realtime/index.js";
import { getIntegrationStatus } from "./integrations/registry.js";
import { beginAdminLogin, completeAdminGoogleLogin, verifyOtp, getSession, logout, sessionCookie, clearSessionCookie, authConfigured } from "./security/auth.js";

function originFor(env,request){const configured=String(env.FRONTEND_ORIGIN||"").trim();const requestOrigin=request.headers.get("origin");if(!configured)return env.APP_ENV==="production"?"null":"*";const allowed=configured.split(",").map(v=>v.trim()).filter(Boolean);return requestOrigin&&allowed.includes(requestOrigin)?requestOrigin:allowed[0];}
function headers(origin){return {"access-control-allow-origin":origin,"access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type,authorization,x-request-id,last-event-id","access-control-allow-credentials":"true","access-control-max-age":"86400","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-frame-options":"DENY"};}
const json=(data,status,origin,extra={})=>{const response=jsonResponse(data,status,origin);Object.entries({...headers(origin),...extra}).forEach(([k,v])=>response.headers.set(k,v));return response;};
const withCors=(response,origin)=>{Object.entries(headers(origin)).forEach(([k,v])=>response.headers.set(k,v));return response;};

export default {async fetch(request,env){
 const origin=originFor(env,request);if(request.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
 const providers=createProviderRegistry(env),aiRouter=new AIRouter({providers,env});
 const googleAuth=await oauthStatus(env);
 const googleServices=await createGoogleServiceRegistry(env,googleAuth),toolRegistry=createToolRegistry(env);
 const router=createRouter(new Map([
  ["GET /health",async()=>json({ok:true,service:"worker",time:new Date().toISOString()},200,origin)],
  ["GET /api/status",async()=>json({ok:true,environment:env.APP_ENV||"development",auth:{configured:authConfigured(env)},integrations:{google:[...googleServices.values()].map(({id,status,enabled})=>({id,status,enabled})),ai:aiRouter.listProviders()}},200,origin)],
  ["GET /api/auth/google/url",async()=>json({ok:true,authorization_url:await beginAdminLogin(env)},200,origin)],
  ["GET /api/auth/google/callback",async req=>{const u=new URL(req.url);const result=await completeAdminGoogleLogin(env,u.searchParams.get("code"),u.searchParams.get("state"));return new Response(null,{status:302,headers:{location:`${env.FRONTEND_ORIGIN}/pages/login.html?challenge=${encodeURIComponent(result.challenge)}`}});}],
  ["POST /api/auth/otp",async req=>{const b=await req.json();if(!b.challenge||!b.code)throw new HttpError(400,"OTP_REQUIRED","challenge and code are required");try{const s=await verifyOtp(env,b.challenge,b.code);return json({ok:true,authenticated:true,email:s.email},200,origin,{"set-cookie":sessionCookie(s.sessionId)});}catch(e){throw new HttpError(e.message==="OTP_EXPIRED"?410:401,e.message,"Verification failed");}}],
  ["GET /api/auth/status",async req=>{const s=await getSession(env,req);return json({ok:true,authenticated:Boolean(s),email:s?.email||null,createdAt:s?.createdAt||null,lastActiveAt:s?.lastActiveAt||null},200,origin);}],
  ["POST /api/auth/logout",async req=>{await logout(env,req);return json({ok:true,authenticated:false},200,origin,{"set-cookie":clearSessionCookie});}],
  ["GET /api/admin/integrations",async()=>json({ok:true,integrations:getIntegrationStatus({googleAuth:await oauthStatus(env),aiProviders:aiRouter.listProviders(),env})},200,origin)],
  ["POST /api/admin/integrations/sync",async()=>{const auth=await oauthStatus(env);const services=[... (await createGoogleServiceRegistry(env,auth)).values()];const result=await syncGoogleServiceMetadata(env,services);for(const platform of ["google","github","cloudflare","ai"]){const status=getIntegrationStatus({googleAuth:auth,aiProviders:aiRouter.listProviders(),env}).find(x=>x.id===platform);if(status)await upsertPlatformMetadata(env,{platform,status:status.status,account:platform==="google"?(auth.connected?"authorized":""):"",details:status.status});}return json({ok:true,result,services},200,origin);}],
  ["GET /api/admin/persistence/status",async()=>{const auth=await oauthStatus(env);return json({ok:true,kv:{binding:Boolean(env.OAUTH_TOKEN_STORE),oauthTokenStore:Boolean(env.OAUTH_TOKEN_STORE),sessionAndOtpStore:Boolean(env.OAUTH_TOKEN_STORE)},googleOAuth:auth},200,origin);}],
  ["GET /api/realtime",async req=>{const u=new URL(req.url),id=u.searchParams.get("taskId");if(!id)throw new HttpError(400,"TASK_ID_REQUIRED","taskId is required");const lastEventId=Number(u.searchParams.get("lastEventId")||req.headers.get("last-event-id")||0);return withCors(taskEventStream(env,id,{lastEventId:Number.isFinite(lastEventId)?lastEventId:0}),origin);}],
  ["GET /api/google/setup/status",async()=>json({ok:true,auth:await oauthStatus(env),services:[... (await createGoogleServiceRegistry(env,await oauthStatus(env))).values()].map(({id,name,status,enabled})=>({id,name:name||id,status,enabled}))},200,origin)],
  ["GET /api/google/auth/url",async()=>json({ok:true,authorization_url:await beginOAuth(env)},200,origin)],
  ["GET /api/google/auth/callback",async req=>{const u=new URL(req.url);return json({ok:true,...await completeOAuth(env,u.searchParams.get("state"),u.searchParams.get("code")),message:"Google authorization stored securely in the configured token store."},200,origin);}],
  ["POST /api/google/auth/disconnect",async()=>{await clearTokens(env);return json({ok:true,connected:false},200,origin);}],
  ["GET /api/google/auth/status",async()=>json({ok:true,...await oauthStatus(env)},200,origin)],
  ["POST /api/google/database/initialize",async()=>json({ok:true,result:await initializeDatabase(env)},200,origin)],
  ["GET /api/google/sheets/values",async req=>{const u=new URL(req.url),range=u.searchParams.get("range");if(!range)throw new HttpError(400,"RANGE_REQUIRED","range is required");return json({ok:true,result:await readValues(env,range,u.searchParams.get("spreadsheetId")||env.GOOGLE_SHEETS_DATABASE_ID)},200,origin);}],
  ["POST /api/google/sheets/values",async req=>{const b=await req.json();if(!b.range||!Array.isArray(b.values))throw new HttpError(400,"INVALID_SHEETS_PAYLOAD","range and values[] are required");const result=b.mode==="update"?await updateValues(env,b.range,b.values,b.spreadsheetId||env.GOOGLE_SHEETS_DATABASE_ID):await appendValues(env,b.range,b.values,b.spreadsheetId||env.GOOGLE_SHEETS_DATABASE_ID);return json({ok:true,result},200,origin);}],
  ["GET /api/google/calendar/events",async req=>{const u=new URL(req.url);return json({ok:true,result:await listEvents(env,u.searchParams.get("calendarId")||"primary",u.searchParams.get("timeMin")||new Date().toISOString(),Number(u.searchParams.get("maxResults")||50))},200,origin)}],
  ["POST /api/google/calendar/events",async req=>{const b=await req.json();return json({ok:true,result:await createEvent(env,b.event,b.calendarId||"primary")},200,origin)}],
  ["POST /api/google/gmail/send",async req=>json({ok:true,result:await sendMessage(env,await req.json())},200,origin)],
  ["GET /api/google/drive/files",async req=>{const u=new URL(req.url);return json({ok:true,result:await drive.list(env,u.searchParams.get("q")||"trashed=false")},200,origin)}],
  ["POST /api/google/drive/files",async req=>json({ok:true,result:await drive.create(env,await req.json())},200,origin)],
  ["GET /api/google/docs/document",async req=>{const id=new URL(req.url).searchParams.get("id");if(!id)throw new HttpError(400,"DOCUMENT_ID_REQUIRED","id is required");return json({ok:true,result:await docs.get(env,id)},200,origin)}],
  ["POST /api/google/docs/document",async req=>json({ok:true,result:await docs.create(env,(await req.json()).title)},200,origin)],
  ["GET /api/google/forms/form",async req=>{const id=new URL(req.url).searchParams.get("id");if(!id)throw new HttpError(400,"FORM_ID_REQUIRED","id is required");return json({ok:true,result:await forms.get(env,id)},200,origin)}],
  ["POST /api/google/forms/form",async req=>json({ok:true,result:await forms.create(env,(await req.json()).info)},200,origin)],
  ["GET /api/google/blogger/posts",async req=>{const u=new URL(req.url),id=u.searchParams.get("blogId");if(!id)throw new HttpError(400,"BLOG_ID_REQUIRED","blogId is required");return json({ok:true,result:await blogger.posts(env,id,{maxResults:u.searchParams.get("maxResults")||20})},200,origin)}],
  ["POST /api/google/blogger/posts",async req=>{const b=await req.json();return json({ok:true,result:await blogger.createPost(env,b.blogId,b.post)},200,origin);}],
  ["POST /api/ai/generate",async req=>json({ok:true,result:await aiRouter.generate(await req.json())},200,origin)],
  ["POST /api/tasks",async req=>{const b=await req.json(),task=await createTask(env,b);return json({ok:true,task},201,origin)}],
  ["GET /api/tasks",async()=>json({ok:true,result:await readSheet(env,"tasks")},200,origin)],
  ["GET /api/tasks/task",async req=>{const id=new URL(req.url).searchParams.get("id");if(!id)throw new HttpError(400,"TASK_ID_REQUIRED","id is required");return json({ok:true,task:await findTask(env,id)},200,origin)}],
  ["POST /api/command",async(req,context)=>{let body;try{body=await req.json()}catch{throw new HttpError(400,"INVALID_JSON","Request body must be valid JSON")}body=validateCommandPayload(body);const parsed=parseCommand(body),planned=planTask(parsed),commands=createCommandRegistry({env,toolRegistry}),handler=commands.get(body.intent||parsed.intent)||commands.get("task.create");if(!handler)throw new HttpError(400,"UNKNOWN_COMMAND","Unsupported command");const result=await handler({...body,requestId:context.requestId,parsed,plan:planned,input:body.input||body.metadata||{}});await appendActivityLog(env,{source:body.source||"api",action:parsed.intent,task_id:result?.task_id||result?.result?.task_id||"",service:parsed.intent?.startsWith("google.")?parsed.intent.split(".")[1]:"system",status:"completed",message:"Command executed"}).catch(()=>{});return json({ok:true,requestId:context.requestId,intent:parsed.intent,plan:planned,result},200,origin)}]
 ]));
 try{const {result}=await withMiddleware(request,env,({request:req,requestId,session})=>router(req,{requestId,session}));if(result)return result;return json({ok:false,error:"NOT_FOUND"},404,origin)}catch(error){const e=error instanceof HttpError?error:new HttpError(500,error?.code||"INTERNAL_ERROR","Internal server error");await appendErrorLog(env,{source:"worker",code:e.code,message:e.message,request_id:request.headers.get("x-request-id")||""}).catch(()=>{});return json({ok:false,error:e.code,message:e.message},e.status,origin)}
}};
