import { generateGemini } from "./providers/gemini.js";
import { generateOpenAICompatible } from "./providers/openai-compatible.js";

const ORDER=["gemini","groq","openrouter","mistral","cerebras","huggingface","cohere","cloudflare","github","nvidia"];
const envKey=p=>({gemini:"GEMINI_API_KEY",groq:"GROQ_API_KEY",openrouter:"OPENROUTER_API_KEY",mistral:"MISTRAL_API_KEY",cerebras:"CEREBRAS_API_KEY",huggingface:"HF_API_KEY",cohere:"COHERE_API_KEY",cloudflare:"CLOUDFLARE_AI_TOKEN",github:"GITHUB_MODELS_TOKEN",nvidia:"NVIDIA_NIM_API_KEY"}[p]);
const defaultModel=p=>({gemini:"gemini-2.5-flash",groq:"llama-3.3-70b-versatile",openrouter:"openai/gpt-oss-120b",mistral:"mistral-small-latest",cerebras:"llama-3.3-70b",huggingface:"openai/gpt-oss-120b",cohere:"command-a-03-2025",cloudflare:"@cf/meta/llama-3.3-70b-instruct-fp8-fast",github:"openai/gpt-4.1",nvidia:"meta/llama-3.3-70b-instruct"}[p]);
export function configuredProviders(env){return ORDER.filter(p=>env[envKey(p)]).map(p=>({id:p,model:env[`${p.toUpperCase()}_MODEL`]||defaultModel(p)}));}
export async function routeAI(env,{messages=[],model:requestedModel,temperature=0.2,maxTokens=1024}={}){
  if(!Array.isArray(messages)||messages.length===0) throw new Error("AI_MESSAGES_REQUIRED");
  const providers=configuredProviders(env); if(!providers.length) throw new Error("NO_AI_PROVIDER_CONFIGURED");
  const failures=[];
  for(const p of providers){
    try{
      const result=p.id==="gemini"
        ? await generateGemini(env,{messages,model:requestedModel||p.model,temperature,maxTokens})
        : await generateOpenAICompatible(env,p.id,{messages,model:requestedModel||p.model,temperature,maxTokens});
      return {provider:p.id,model:requestedModel||p.model,text:result.text||"",raw:result.raw,attempted:failures.length+1};
    }catch(error){failures.push({provider:p.id,code:error?.code||"AI_PROVIDER_ERROR",status:error?.status||null});}
  }
  const e=new Error("ALL_AI_PROVIDERS_FAILED"); e.code="ALL_AI_PROVIDERS_FAILED"; e.failures=failures; throw e;
}
