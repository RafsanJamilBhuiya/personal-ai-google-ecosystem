export const AI_PROVIDERS = Object.freeze([
  "gemini",
  "groq",
  "openrouter",
  "mistral",
  "cerebras",
  "huggingface",
  "cohere",
  "cloudflare-workers-ai",
  "github-models",
  "nvidia-nim"
]);

export function createProviderRegistry() {
  return new Map(AI_PROVIDERS.map((id, index) => [id, {
    id,
    status: "not-configured",
    enabled: false,
    priority: index + 1,
    models: []
  }]));
}
