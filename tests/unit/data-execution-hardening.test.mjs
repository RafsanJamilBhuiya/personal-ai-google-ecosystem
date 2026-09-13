import test from "node:test";
import assert from "node:assert/strict";
import { rowFor, recordFromRow, listRecords } from "../../backend/database/sheets-engine.js";
import { ExecutionEngine } from "../../backend/execution/index.js";
import { saveTokens } from "../../backend/google/token-store.js";

const testEnv = () => {
  const store = new Map();
  return { GOOGLE_SHEETS_DATABASE_ID: "db", OAUTH_TOKEN_ENCRYPTION_KEY: "unit-test-only-key", OAUTH_TOKEN_STORE: { put: async (k,v) => store.set(k,v), get: async k => store.get(k) || null, delete: async k => store.delete(k) } };
};
async function withGoogleFetch(values, fn) {
  const originalFetch = globalThis.fetch; const env = testEnv();
  await saveTokens(env, { access_token: "unit-test-access-token", expires_at: Date.now() + 3600000 });
  globalThis.fetch = async () => new Response(JSON.stringify({ values }), { status: 200, headers: { "content-type": "application/json" } });
  try { return await fn(env); } finally { globalThis.fetch = originalFetch; }
}

test("Sheets engine maps records deterministically", () => {
  const row = rowFor("tasks", { task_id: "t1", status: "queued", priority: "high" });
  assert.equal(row[0], "t1"); assert.equal(recordFromRow("tasks", row).status, "queued");
});

test("Sheets listRecords filters, sorts and paginates", async () => withGoogleFetch([
  ["task_id","created_at","source","command","intent","status","priority","provider","tool","started_at","completed_at","error","result_id"],
  ["t1","2026-01-01","chat","a","x","queued","normal"],
  ["t2","2026-01-03","chat","b","x","completed","high"],
  ["t3","2026-01-02","chat","c","x","completed","low"]
], async env => {
  const result = await listRecords(env, "tasks", { filter: { status: "completed" }, sortBy: "created_at", direction: "desc", limit: 1 });
  assert.equal(result.total, 2); assert.equal(result.records.length, 1); assert.equal(result.records[0].task_id, "t2");
}));

test("Execution engine does not repeat a completed task", async () => withGoogleFetch([
  ["task_id","created_at","source","command","intent","status","priority","provider","tool","started_at","completed_at","error","result_id"],
  ["t1","2026-01-01","chat","send","gmail.send","completed","normal","","gmail.send","","","","r1"]
], async env => {
  let toolCalls = 0;
  const engine = new ExecutionEngine({ toolRegistry: { "gmail.send": async () => { toolCalls++; } } });
  const result = await engine.execute(env, { task_id: "t1", tool: "gmail.send" });
  assert.equal(result.idempotent, true); assert.equal(toolCalls, 0);
}));
