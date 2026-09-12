import { generateGemini } from "./providers/gemini.js";
import { generateOpenAICompatible } from "./providers/openai-compatible.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const retryable = (error) => [408,429,500,502,503,504].includes(error?.status);

export class AIRouter {
  constructor({ providers, env }) { this.providers = providers; this.env = env; }
  listProviders() { return [...this.providers.values()].map(({ id, status, enabled, priority, models }) => ({ id, status, enabled, priority, models })); }
  async generate({ messages, model, temperature = 0.2, maxTokens = 1024, preferredProvider } = {}) {
    if (!Array.isArray(messages) || !messages.length) throw new Error("messages are required");
    const all = [...this.providers.values()].filter((p) => p.enabled && p.status === "available").sort((a,b) => a.priority-b.priority);
    const ordered = preferredProvider ? [...all.filter(p=>p.id===preferredProvider), ...all.filter(p=>p.id!==preferredProvider)] : all;
    if (!ordered.length) { const e = new Error("No configured AI provider is available"); e.code = "AI_PROVIDER_UNAVAILABLE"; throw e; }
    const errors = [];
    for (const provider of ordered) {
      for (let attempt=0; attempt<2; attempt++) {
        try {
          const result = provider.id === "gemini" ? await generateGemini(this.env, { messages, model, temperature, maxTokens }) : await generateOpenAICompatible(this.env, provider.id, { messages, model, temperature, maxTokens });
          return { ...result, attempts: attempt + 1, fallback: errors.length > 0 };
        } catch (error) {
          errors.push({ provider: provider.id, code: error.code || "AI_ERROR", status: error.status || 500 });
          if (!retryable(error) || attempt === 1) break;
          await sleep(150 * (attempt + 1));
        }
      }
    }
    const e = new Error("All configured AI providers failed"); e.code = "AI_ALL_PROVIDERS_FAILED"; e.providers = errors; throw e;
  }
}
