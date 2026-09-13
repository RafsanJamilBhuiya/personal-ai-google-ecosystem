const SESSION_PREFIX = "auth:session:";
const OTP_PREFIX = "auth:otp:";
const SESSION_MAX_MS = 24 * 60 * 60 * 1000;
const INACTIVITY_MS = 3 * 60 * 60 * 1000;
const OTP_TTL = 5 * 60;
const MAX_ATTEMPTS = 5;

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
const randomCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6,"0");
const store = env => { if (!env.OAUTH_TOKEN_STORE) throw new Error("OAUTH_TOKEN_STORE_KV binding is required"); return env.OAUTH_TOKEN_STORE; };

async function digest(value) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value))); }
async function hash(value) { return b64url(await digest(value)); }
async function telegram(env, code, email) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) throw new Error("TELEGRAM_OTP_NOT_CONFIGURED");
  const text = `Personal AI verification\nAccount: ${email}\nCode: ${code}\nExpires in: 5 minutes`;
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text,disable_web_page_preview:true}) });
  if (!r.ok) throw new Error("TELEGRAM_DELIVERY_FAILED");
}

export function authConfigured(env) { return Boolean(env.OAUTH_TOKEN_STORE && env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_REDIRECT_URI && env.ADMIN_GOOGLE_EMAIL && env.OAUTH_STATE_SECRET && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID); }

export async function beginAdminLogin(env) {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_REDIRECT_URI || !env.OAUTH_STATE_SECRET) throw new Error("GOOGLE_LOGIN_NOT_CONFIGURED");
  const payload = b64url(new TextEncoder().encode(`${Date.now()}:${crypto.randomUUID()}:login`));
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(env.OAUTH_STATE_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig = b64url(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
  const state = `${payload}.${sig}`;
  const scope = "openid email profile";
  const p = new URLSearchParams({client_id:env.GOOGLE_OAUTH_CLIENT_ID,redirect_uri:env.GOOGLE_OAUTH_REDIRECT_URI,response_type:"code",access_type:"offline",prompt:"select_account",scope,state});
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

async function verifyState(env,state) {
  const [payload,sig] = String(state||"").split("."); if(!payload||!sig) return false;
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(env.OAUTH_STATE_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  if(!(await crypto.subtle.verify("HMAC",key,Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0)),new TextEncoder().encode(payload)))) return false;
  const raw = atob(payload.replace(/-/g,"+").replace(/_/g,"/")); const issued=Number(new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0))).split(":")[0]);
  return Number.isFinite(issued) && Date.now() >= issued && Date.now()-issued <= 10*60*1000;
}

export async function completeAdminGoogleLogin(env, code, state) {
  if(!(await verifyState(env,state))) throw new Error("INVALID_LOGIN_STATE");
  const body=new URLSearchParams({code,client_id:env.GOOGLE_OAUTH_CLIENT_ID,client_secret:env.GOOGLE_OAUTH_CLIENT_SECRET,redirect_uri:env.GOOGLE_OAUTH_REDIRECT_URI,grant_type:"authorization_code"});
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body}); const tokens=await r.json();
  if(!r.ok||!tokens.access_token) throw new Error("GOOGLE_LOGIN_TOKEN_EXCHANGE_FAILED");
  const u=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{authorization:`Bearer ${tokens.access_token}`}}); const identity=await u.json();
  const expected=String(env.ADMIN_GOOGLE_EMAIL||"").trim().toLowerCase(); const email=String(identity.email||"").trim().toLowerCase();
  if(!email || email!==expected || identity.email_verified!==true) throw new Error("ADMIN_ACCOUNT_NOT_AUTHORIZED");
  const challenge=crypto.randomUUID(); const codeValue=randomCode();
  await store(env).put(`${OTP_PREFIX}${challenge}`,JSON.stringify({email,hash:await hash(`${challenge}:${codeValue}`),attempts:0,createdAt:Date.now()}),{expirationTtl:OTP_TTL});
  await telegram(env,codeValue,email);
  return {challenge, email, expiresIn:OTP_TTL};
}

export async function verifyOtp(env, challenge, code) {
  const kv=store(env), key=`${OTP_PREFIX}${challenge}`, raw=await kv.get(key,"json"); if(!raw) throw new Error("OTP_EXPIRED");
  if(raw.attempts>=MAX_ATTEMPTS){await kv.delete(key);throw new Error("OTP_ATTEMPTS_EXCEEDED");}
  const expected=await hash(`${challenge}:${String(code||"").trim()}`);
  if(expected!==raw.hash){raw.attempts+=1;await kv.put(key,JSON.stringify(raw),{expirationTtl:OTP_TTL});throw new Error("INVALID_OTP");}
  await kv.delete(key); const sid=crypto.randomUUID(); const now=Date.now();
  await kv.put(`${SESSION_PREFIX}${sid}`,JSON.stringify({email:raw.email,createdAt:now,lastActiveAt:now}),{expirationTtl:86400});
  return {sessionId:sid,email:raw.email,createdAt:now,lastActiveAt:now};
}

export async function getSession(env, request) {
  const cookie=request.headers.get("cookie")||""; const m=cookie.match(/(?:^|;\s*)personal_ai_session=([^;]+)/); if(!m) return null;
  const sid=decodeURIComponent(m[1]); const kv=store(env), session=await kv.get(`${SESSION_PREFIX}${sid}`,"json"); if(!session) return null;
  const now=Date.now(); if(now-session.createdAt>SESSION_MAX_MS || now-session.lastActiveAt>INACTIVITY_MS){await kv.delete(`${SESSION_PREFIX}${sid}`);return null;}
  session.lastActiveAt=now; await kv.put(`${SESSION_PREFIX}${sid}`,JSON.stringify(session),{expirationTtl:86400}); return {...session,sessionId:sid};
}
export async function logout(env,request){const s=await getRawSession(env,request);if(s?.sessionId) await store(env).delete(`${SESSION_PREFIX}${s.sessionId}`);}
async function getRawSession(env,request){const cookie=request.headers.get("cookie")||"";const m=cookie.match(/(?:^|;\s*)personal_ai_session=([^;]+)/);if(!m)return null;const sid=decodeURIComponent(m[1]);const session=await store(env).get(`${SESSION_PREFIX}${sid}`,"json");return session?{...session,sessionId:sid}:null;}
export const sessionCookie = sid => `personal_ai_session=${encodeURIComponent(sid)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=None`;
export const clearSessionCookie = "personal_ai_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None";
export const authConstants = Object.freeze({SESSION_MAX_MS,INACTIVITY_MS,OTP_TTL,MAX_ATTEMPTS});
