const OPENAI_COMPATIBLE = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", key: "GROQ_API_KEY", model: "GROQ_MODEL" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", key: "OPENROUTER_API_KEY", model: "OPENROUTER_MODEL" },
  mistral: { baseUrl: "https://api.mistral.ai/v1", key: "MISTRAL_API_KEY", model: "MISTRAL_MODEL" },
  cerebras: { baseUrl: "https://api.cerebras.ai/v1", key: "CEREBRAS_API_KEY", model: "CEREBRAS_MODEL" },
  "github-models": { baseUrl: "https://models.inference.ai.azure.com", key: "GITHUB_MODELS_API_KEY", model: "GITHUB_MODELS_MODEL" },
  "nvidia-nim": { baseUrl: "https://integrate.api.nvidia.com/v1", key: "NVIDIA_NIM_API_KEY", model: "NVIDIA_NIM_MODEL" }
};

function configured(env, key) { return Boolean(env?.[key]); }

export async function generateOpenAICompatible(env, providerId, { messages, model, temperature = 0.2, maxTokens = 1024 }) {
  const config = OPENAI_COMPATIBLE[providerId];
  if (!config) throw new Error(`Unsupported compatible provider: ${providerId}`);
  const apiKey = env?.[config.key];
  if (!apiKey) { const e = new Error(`Provider ${providerId} is not configured`); e.code = "AI_PROVIDER_NOT_CONFIGURED"; throw e; }
  const selectedModel = model || env?.[config.model];
  if (!selectedModel) { const e = new Error(`Model is not configured for ${providerId}`); e.code = "AI_MODEL_NOT_CONFIGURED"; throw e; }
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: selectedModel, messages, temperature, max_tokens: maxTokens })
  });
  const data = await response.json();
  if (!response.ok) { const e = new Error(`AI provider ${providerId} request failed (${response.status})`); e.code = "AI_PROVIDER_ERROR"; e.status = response.status; throw e; }
  return { provider: providerId, model: data.model || selectedModel, text: data.choices?.[0]?.message?.content || "", raw: data };
}

export function compatibleProviderStatus(env, providerId) {
  const config = OPENAI_COMPATIBLE[providerId];
  return config && configured(env, config.key) ? "available" : "not-configured";
}
