import { createProviderRegistry } from "./registry.js";

export class AIRouter {
  constructor({ providers = createProviderRegistry() } = {}) {
    this.providers = providers;
  }

  listProviders() {
    return [...this.providers.values()].map(({ id, status, enabled, priority, models }) => ({ id, status, enabled, priority, models }));
  }

  async generate() {
    const available = [...this.providers.values()]
      .filter((provider) => provider.enabled && provider.status === "available")
      .sort((a, b) => a.priority - b.priority);
    if (!available.length) {
      const error = new Error("No configured AI provider is available");
      error.code = "AI_PROVIDER_UNAVAILABLE";
      throw error;
    }
    throw new Error("AI provider adapters are not configured yet");
  }
}
