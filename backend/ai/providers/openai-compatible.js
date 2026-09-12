const OPENAI_COMPATIBLE = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", key: "GROQ_API_KEY", model: "GROQ_MODEL" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", key: "OPENROUTER_API_KEY", model: "OPENROUTER_MODEL" },
  mistral: { baseUrl: "https://api.mistral.ai/v1", key: "MISTRAL_API_KEY", model: "MISTRAL_MODEL" },
  cerebras: { baseUrl: "https://api.cerebras.ai/v1", key: "CEREBRAS_API_KEY", model: "CEREBRAS_MODEL" },
  huggingface: { baseUrl: "https://router.huggingface.co/v1", key: "HF_API_KEY", model: "HF_MODEL" },
  cohere: { baseUrl: "https://api.cohere.com/compatibility/v1", key: "COHERE_API_KEY", model: "COHERE_MODEL" },
  cloudflare: { baseUrl: "https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/v1", key: "CLOUDFLARE_AI_TOKEN", model: "CLOUDFLARE_AI_MODEL" },
  github: { baseUrl: "https://models.github.ai/inference", key: "GITHUB_MODELS_TOKEN", model: "GITHUB_MODELS_MODEL" },
  nvidia: { baseUrl: "https://integrate.api.nvidia.com/v1", key: "NVIDIA_NIM_API_KEY", model: "NVIDIA_NIM_MODEL" }
};

function configured(env, key) { return Boolean(env?.[key]); }
function resolveBaseUrl(config, env) {
  if (!config.baseUrl.includes("{accountId}")) return config.baseUrl;
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) { const e = new Error("Cloudflare AI account ID is not configured"); e.code = "AI_PROVIDER_CONFIGURATION_ERROR"; throw e; }
  return config.baseUrl.replace("{accountId}", encodeURIComponent(accountId));
}

export async function generateOpenAICompatible(env, providerId, { messages = [], model, temperature = 0.2, maxTokens = 1024 } = {}) {
  const config = OPENAI_COMPATIBLE[providerId];
  if (!config) { const e = new Error(`Unsupported compatible provider: ${providerId}`); e.code = "AI_PROVIDER_UNSUPPORTED"; throw e; }
  const apiKey = env?.[config.key];
  if (!apiKey) { const e = new Error(`Provider ${providerId} is not configured`); e.code = "AI_PROVIDER_NOT_CONFIGURED"; throw e; }
  const selectedModel = model || env?.[config.model];
  if (!selectedModel) { const e = new Error(`Model is not configured for ${providerId}`); e.code = "AI_MODEL_NOT_CONFIGURED"; throw e; }
  const response = await fetch(`${resolveBaseUrl(config, env)}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ model: selectedModel, messages, temperature, max_tokens: maxTokens })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const e = new Error(`AI provider ${providerId} request failed (${response.status})`); e.code = "AI_PROVIDER_ERROR"; e.status = response.status; throw e; }
  return { provider: providerId, model: data.model || selectedModel, text: data.choices?.[0]?.message?.content || "", raw: data };
}

export function compatibleProviderStatus(env, providerId) {
  const config = OPENAI_COMPATIBLE[providerId];
  return config && configured(env, config.key) ? "available" : "not-configured";
}
