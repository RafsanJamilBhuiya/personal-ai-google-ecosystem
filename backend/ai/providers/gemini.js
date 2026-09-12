export async function generateGemini(env, { messages, model = env.GEMINI_MODEL || "gemini-2.5-flash", temperature = 0.2, maxTokens = 1024 }) {
  const key = env?.GEMINI_API_KEY;
  if (!key) { const e = new Error("Gemini is not configured"); e.code = "AI_PROVIDER_NOT_CONFIGURED"; throw e; }
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content ?? "") }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents, generationConfig: { temperature, maxOutputTokens: maxTokens } }) });
  const data = await response.json();
  if (!response.ok) { const e = new Error(`Gemini request failed (${response.status})`); e.code = "AI_PROVIDER_ERROR"; e.status = response.status; throw e; }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return { provider: "gemini", model, text, raw: data };
}
