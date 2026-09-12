import test from "node:test";
import assert from "node:assert/strict";
import { createOAuthState, verifyOAuthState } from "../../backend/google/oauth.js";
import { saveTokens, loadTokens, getValidAccessToken } from "../../backend/google/token-store.js";
import { googleFetch } from "../../backend/google/client.js";
import { configuredProviders, routeAI } from "../../backend/ai/live-router.js";

function kv(){ const m=new Map(); return { async put(k,v){m.set(k,v)}, async get(k){return m.get(k)||null}, async delete(k){m.delete(k)} }; }

const envBase=()=>({OAUTH_STATE_SECRET:"state-secret",OAUTH_TOKEN_ENCRYPTION_KEY:"token-secret",OAUTH_TOKEN_STORE:kv(),GOOGLE_OAUTH_CLIENT_ID:"client-id",GOOGLE_OAUTH_CLIENT_SECRET:"client-secret"});

test("OAuth state is signed and expires", async()=>{
  const env=envBase();
  const state=await createOAuthState(env);
  assert.equal(await verifyOAuthState(env,state),true);
  assert.equal(await verifyOAuthState(env,`${state}x`),false);
});

test("token store encrypts tokens and returns valid access token", async()=>{
  const env=envBase();
  await saveTokens(env,{access_token:"secret-token",expires_at:Date.now()+3600000,scope:"scope"});
  const raw=await env.OAUTH_TOKEN_STORE.get("google:oauth:tokens");
  assert.equal(raw.includes("secret-token"),false);
  assert.equal((await loadTokens(env)).access_token,"secret-token");
  assert.equal(await getValidAccessToken(env),"secret-token");
});

test("Google client refreshes once after a 401", async()=>{
  const env=envBase();
  await saveTokens(env,{access_token:"old-token",refresh_token:"refresh-token",expires_at:Date.now()+3600000});
  const original=globalThis.fetch; let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;
    if(url==="https://oauth2.googleapis.com/token") return new Response(JSON.stringify({access_token:"new-token",expires_in:3600}),{status:200,headers:{"content-type":"application/json"}});
    return calls===1?new Response("unauthorized",{status:401}):new Response(JSON.stringify({ok:true}),{status:200,headers:{"content-type":"application/json"}});
  };
  try{ const result=await googleFetch(env,"/test"); assert.deepEqual(result,{ok:true}); assert.equal(calls,3); }
  finally{globalThis.fetch=original;}
});

test("AI provider configuration never exposes key values",()=>{
  const env={GEMINI_API_KEY:"secret",GROQ_API_KEY:"another-secret",GROQ_MODEL:"test-model"};
  const providers=configuredProviders(env);
  assert.deepEqual(providers.map(p=>p.id),["gemini","groq"]);
  assert.equal("apiKey" in providers[0],false);
  assert.equal(providers[1].model,"test-model");
});

test("AI router falls back to the next configured provider", async()=>{
  const env={GROQ_API_KEY:"first",MISTRAL_API_KEY:"second"};
  const original=globalThis.fetch; let calls=0;
  globalThis.fetch=async(url)=>{ calls++; if(url.includes("groq")) return new Response(JSON.stringify({error:"rate limited"}),{status:429}); return new Response(JSON.stringify({choices:[{message:{content:"fallback ok"}}]}),{status:200,headers:{"content-type":"application/json"}}); };
  try{ const result=await routeAI(env,{messages:[{role:"user",content:"hello"}]}); assert.equal(result.provider,"mistral"); assert.equal(result.text,"fallback ok"); assert.equal(result.attempted,2); assert.equal(calls,2); }
  finally{globalThis.fetch=original;}
});
