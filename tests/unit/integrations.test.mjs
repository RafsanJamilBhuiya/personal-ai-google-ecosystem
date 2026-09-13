import test from "node:test";
import assert from "node:assert/strict";
import { getIntegrationRegistry, getIntegrationStatus } from "../../backend/integrations/registry.js";

test("integration registry contains the four configured platform groups", () => {
  const ids = getIntegrationRegistry().map(item => item.id);
  assert.deepEqual(ids, ["google", "github", "cloudflare", "ai"]);
});

test("Google status follows real OAuth connection state", () => {
  const connected = getIntegrationStatus({ googleAuth: { connected: true }, aiProviders: [], env: {} });
  const google = connected.find(item => item.id === "google");
  assert.equal(google.status, "connected");
  assert.equal(google.connected, true);
});

test("unconfigured services are not presented as connected", () => {
  const statuses = getIntegrationStatus({ googleAuth: { connected: false }, aiProviders: [], env: {} });
  assert.equal(statuses.find(item => item.id === "google").status, "not_configured");
  assert.equal(statuses.find(item => item.id === "ai").status, "not_configured");
  assert.equal(statuses.find(item => item.id === "cloudflare").status, "not_configured");
});
