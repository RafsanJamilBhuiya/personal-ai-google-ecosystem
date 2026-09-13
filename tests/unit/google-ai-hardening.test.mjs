import test from "node:test";
import assert from "node:assert/strict";
import { createOAuthState, verifyOAuthState, requiredGoogleScopes, scopeStatus } from "../../backend/google/oauth.js";
import { detectIntent } from "../../backend/agent/semantic.js";
import { configuredProviders, classifyProviderError, normalizeAIResult } from "../../backend/ai/live-router.js";

test("Google OAuth state is signed and time-bounded", async () => {
  const env = { OAUTH_STATE_SECRET: "test-secret" };
  const state = await createOAuthState(env);
  assert.equal(await verifyOAuthState(env, state), true);
  assert.equal(await verifyOAuthState(env, `${state}x`), false);
});

test("Google scope registry exposes all seven backend services", () => {
  assert.equal(requiredGoogleScopes().length, 7);
  const status = scopeStatus(requiredGoogleScopes().join(" "));
  assert.equal(Object.values(status).every(x => x.granted), true);
});

test("Semantic intent detection uses context and confidence", () => {
  const result = detectIntent("show my upcoming meetings", {});
  assert.equal(result.intent, "google.calendar.list");
  assert.ok(result.confidence >= 0.35);
});

test("AI provider registry only exposes configured providers", () => {
  const providers = configuredProviders({ GEMINI_API_KEY: "x", GROQ_API_KEY: "y" });
  assert.deepEqual(providers.map(p => p.id), ["gemini", "groq"]);
});

test("AI errors are classified without exposing secrets", () => {
  assert.deepEqual(classifyProviderError({ status: 429, code: "RATE_LIMIT" }), { status: 429, retryable: true, rateLimited: true, authFailure: false, code: "RATE_LIMIT" });
  const result = normalizeAIResult("gemini", "test-model", { text: "ok", usage: { total: 1 } });
  assert.deepEqual(result.text, "ok");
  assert.equal(result.usage.total, 1);
});
