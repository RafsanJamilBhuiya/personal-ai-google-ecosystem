export const INTEGRATION_REGISTRY = Object.freeze([
  { id: "google", name: "Google", category: "Identity & Services", auth: "OAuth 2.0", services: ["Sheets", "Drive", "Gmail", "Calendar", "Docs", "Forms", "Blogger", "Maps"] },
  { id: "github", name: "GitHub", category: "Repository & Automation", auth: "App / OAuth", services: ["Repository", "Actions", "Source control"] },
  { id: "cloudflare", name: "Cloudflare", category: "Backend & Runtime", auth: "API Token", services: ["Workers", "KV", "Secrets"] },
  { id: "ai", name: "AI Providers", category: "AI", auth: "Provider API keys", services: ["Routing", "Fallback", "Generation"] }
]);

export function getIntegrationRegistry() {
  return INTEGRATION_REGISTRY.map(item => ({ ...item, services: [...item.services] }));
}

export function getIntegrationStatus({ googleAuth, aiProviders = [], env = {} } = {}) {
  const aiReady = aiProviders.some(provider => provider.status === "ready" || provider.enabled === true);
  return getIntegrationRegistry().map(item => {
    if (item.id === "google") {
      return { ...item, status: googleAuth?.connected ? "connected" : "not_configured", connected: Boolean(googleAuth?.connected) };
    }
    if (item.id === "cloudflare") {
      const configured = Boolean(env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID);
      return { ...item, status: configured ? "configured" : "not_configured", connected: configured };
    }
    if (item.id === "github") {
      return { ...item, status: "configured", connected: true };
    }
    return { ...item, status: aiReady ? "configured" : "not_configured", connected: aiReady };
  });
}
