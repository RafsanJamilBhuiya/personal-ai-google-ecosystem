import { generateWithGemini } from "./providers/gemini.js";
import { generateOpenAICompatible } from "./providers/openai-compatible.js";
const ORDER=["gemini","groq","openrouter","mistral","cerebras","huggingface","cohere","cloudflare","github","nvidia"];
const envKey=p=>({gemini:"GEMINI_API_KEY",groq:"GROQ_API_KEY",openrouter:"OPENROUTER_API_KEY",mistral:"MISTRAL_API_KEY",cerebras:"CEREBRAS_API_KEY",huggingface:"HF_API_KEY",cohere:"COHERE_API_KEY",cloudflare:"CLOUDFLARE_AI_TOKEN",github:"GITHUB_MODELS_TOKEN",nvidia:"NVIDIA_NIM_API_KEY"}[p]);
const endpoint=p=>({groq:"https://api.groq.com/openai/v1/chat/completions",openrouter:"https://openrouter.ai/api/v1/chat/completions",mistral:"https://api.mistral.ai/v1/chat/completions",cerebras:"https://api.cerebras.ai/v1/chat/completions",huggingface:"https://router.huggingface.co/v1/chat/completions",cohere:"https://api.cohere.com/compatibility/v1/chat/completions",github:"https://models.github.ai/inference/chat/completions",nvidia:"https://integrate.api.nvidia.com/v1/chat/completions"}[p]);
const model=p=>({gemini:"gemini-2.5-flash",groq:"llama-3.3-70b-versatile",openrouter:"openai/gpt-oss-120b",mistral:"mistral-small-latest",cerebras:"llama-3.3-70b",huggingface:"openai/gpt-oss-120b",cohere:"command-a-03-2025",github:"openai/gpt-4.1",nvidia:"meta/llama-3.3-70b-instruct"}[p]);
export function configuredProviders(env){return ORDER.filter(p=>env[envKey(p)]).map(p=>({id:p,model:env[`${p.toUpperCase()}_MODEL`]||model(p),endpoint:endpoint(p)||"gemini-native"}));}
export async function routeAI(env,{messages,model:requestedModel,temperature=0.2,maxTokens=1024}={}){
 const providers=configuredProviders(env); if(!providers.length) throw new Error("NO_AI_PROVIDER_CONFIGURED"); const failures=[];
 for(const p of providers){try{const result=p.id==="gemini"?await generateWithGemini(env,{messages,model:requestedModel||p.model,temperature,maxTokens}):await generateOpenAICompatible(env,{provider:p.id,endpoint:p.endpoint,apiKey:env[envKey(p.id)],model:requestedModel||p.model,messages,temperature,maxTokens}); return {provider:p.id,model:requestedModel||p.model,...result,attempted:failures.length+1};}catch(error){failures.push({provider:p.id,error:String(error.message||error)});}}
 const e=new Error("ALL_AI_PROVIDERS_FAILED"); e.failures=failures; throw e;
}
