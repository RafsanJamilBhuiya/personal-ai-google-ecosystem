export const INTEGRATION_REGISTRY = Object.freeze([
  { id: "google", name: "Google", category: "Identity & Services", auth: "OAuth 2.0", services: ["Sheets", "Drive", "Gmail", "Calendar", "Docs", "Forms", "Blogger", "Maps"] },
  { id: "github", name: "GitHub", category: "Repository & Automation", auth: "App / OAuth", services: ["Repository", "Actions", "Source control"] },
  { id: "cloudflare", name: "Cloudflare", category: "Backend & Runtime", auth: "API Token", services: ["Workers", "KV", "Secrets"] },
  { id: "ai", name: "AI Providers", category: "AI", auth: "Provider API keys", services: ["Routing", "Fallback", "Generation"] }
]);

export function getIntegrationRegistry() {
  return INTEGRATION_REGISTRY.map(item => ({ ...item, services: [...item.services] }));
}

function credentialStatus(configured, connected = false) {
  if (connected) return "connected";
  return configured ? "configured" : "not_configured";
}

export function getIntegrationStatus({ googleAuth, aiProviders = [], env = {} } = {}) {
  const aiReady = aiProviders.some(provider => provider.status === "available" || provider.status === "ready" || provider.enabled === true);
  const cloudflareConfigured = Boolean(env.CLOUDFLARE_API_TOKEN);
  const githubConfigured = Boolean(env.GITHUB_TOKEN || env.GITHUB_API_TOKEN);
  return getIntegrationRegistry().map(item => {
    if (item.id === "google") {
      const connected = Boolean(googleAuth?.connected);
      return { ...item, status: credentialStatus(connected, connected), connected };
    }
    if (item.id === "cloudflare") {
      return { ...item, status: credentialStatus(cloudflareConfigured), connected: false, credentialConfigured: cloudflareConfigured };
    }
    if (item.id === "github") {
      return { ...item, status: credentialStatus(githubConfigured), connected: false, credentialConfigured: githubConfigured };
    }
    return { ...item, status: credentialStatus(aiReady), connected: aiReady, credentialConfigured: aiReady };
  });
}
