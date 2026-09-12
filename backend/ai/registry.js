import { generateGemini } from "./providers/gemini.js";
import { compatibleProviderStatus, generateOpenAICompatible } from "./providers/openai-compatible.js";

const PROVIDERS = ["gemini","groq","openrouter","mistral","cerebras","huggingface","cohere","cloudflare-workers-ai","github-models","nvidia-nim"];
const COMPATIBLE = new Set(["groq","openrouter","mistral","cerebras","github-models","nvidia-nim"]);

function statusFor(env, id) {
  if (id === "gemini") return env?.GEMINI_API_KEY ? "available" : "not-configured";
  if (COMPATIBLE.has(id)) return compatibleProviderStatus(env, id);
  return "not-configured";
}

export function createProviderRegistry(env = {}) {
  return new Map(PROVIDERS.map((id, index) => [id, {
    id, status: statusFor(env, id), enabled: statusFor(env, id) === "available", priority: Number(env?.[`${id.toUpperCase().replaceAll("-", "_")}_PRIORITY`] || index + 1), models: []
  }]));
}

export { PROVIDERS };
