import { generateGemini } from "./providers/gemini.js";
import { generateOpenAICompatible } from "./providers/openai-compatible.js";

const ORDER=["gemini","groq","openrouter","mistral","cerebras","huggingface","cohere","cloudflare","github","nvidia"];
const envKey=p=>({gemini:"GEMINI_API_KEY",groq:"GROQ_API_KEY",openrouter:"OPENROUTER_API_KEY",mistral:"MISTRAL_API_KEY",cerebras:"CEREBRAS_API_KEY",huggingface:"HF_API_KEY",cohere:"COHERE_API_KEY",cloudflare:"CLOUDFLARE_AI_TOKEN",github:"GITHUB_MODELS_TOKEN",nvidia:"NVIDIA_NIM_API_KEY"}[p]);
const defaultModel=p=>({gemini:"gemini-2.5-flash",groq:"llama-3.3-70b-versatile",openrouter:"openai/gpt-oss-120b",mistral:"mistral-small-latest",cerebras:"llama-3.3-70b",huggingface:"openai/gpt-oss-120b",cohere:"command-a-03-2025",cloudflare:"@cf/meta/llama-3.3-70b-instruct-fp8-fast",github:"openai/gpt-4.1",nvidia:"meta/llama-3.3-70b-instruct"}[p]);
const retryableStatus = status => [408,409,425,429,500,502,503,504].includes(Number(status));
export function configuredProviders(env){return ORDER.filter(p=>env[envKey(p)]).map((id,index)=>({id,priority:index+1,model:env[`${id.toUpperCase()}_MODEL`]||defaultModel(id)}));}
export function classifyProviderError(error){const status=Number(error?.status||0); return {status, retryable:retryableStatus(status), rateLimited:status===429, authFailure:status===401||status===403, code:error?.code||"AI_PROVIDER_ERROR"};}
export function normalizeAIResult(provider, model, result){return {provider,model,text:String(result?.text||result?.output||result?.content||""),usage:result?.usage||null,raw:result?.raw??result};}
export async function routeAI(env,{messages=[],model:requestedModel,temperature=0.2,maxTokens=1024}={}){
  if(!Array.isArray(messages)||messages.length===0) throw new Error("AI_MESSAGES_REQUIRED");
  if(messages.length>100) throw new Error("AI_CONTEXT_TOO_LARGE");
  const providers=configuredProviders(env); if(!providers.length) throw new Error("NO_AI_PROVIDER_CONFIGURED");
  const failures=[];
  for(const p of providers){
    const started=Date.now();
    try{
      const result=p.id==="gemini"
        ? await generateGemini(env,{messages,model:requestedModel||p.model,temperature,maxTokens})
        : await generateOpenAICompatible(env,p.id,{messages,model:requestedModel||p.model,temperature,maxTokens});
      return {...normalizeAIResult(p.id,requestedModel||p.model,result),attempted:failures.length+1,latencyMs:Date.now()-started};
    }catch(error){
      const classified=classifyProviderError(error);
      failures.push({provider:p.id,...classified,latencyMs:Date.now()-started});
      if(classified.authFailure && env[`DISABLE_${p.id.toUpperCase()}_ON_AUTH_ERROR`] === "true") continue;
    }
  }
  const e=new Error("ALL_AI_PROVIDERS_FAILED"); e.code="ALL_AI_PROVIDERS_FAILED"; e.failures=failures; throw e;
}
