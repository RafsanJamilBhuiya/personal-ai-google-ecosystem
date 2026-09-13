import test from "node:test";
import assert from "node:assert/strict";
import { rowFor, recordFromRow, listRecords } from "../../backend/database/sheets-engine.js";
import { ExecutionEngine } from "../../backend/execution/index.js";

test("Sheets engine maps records deterministically", () => {
  const row = rowFor("tasks", { task_id: "t1", status: "queued", priority: "high" });
  assert.equal(row[0], "t1");
  assert.equal(recordFromRow("tasks", row).status, "queued");
});

test("Sheets listRecords filters, sorts and paginates", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ values: [
    ["task_id","created_at","source","command","intent","status","priority","provider","tool","started_at","completed_at","error","result_id"],
    ["t1","2026-01-01","chat","a","x","queued","normal"],
    ["t2","2026-01-03","chat","b","x","completed","high"],
    ["t3","2026-01-02","chat","c","x","completed","low"]
  ]}), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const result = await listRecords({ GOOGLE_SHEETS_DATABASE_ID: "db" }, "tasks", { filter: { status: "completed" }, sortBy: "created_at", direction: "desc", limit: 1 });
    assert.equal(result.total, 2);
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].task_id, "t2");
  } finally { globalThis.fetch = originalFetch; }
});

test("Execution engine does not repeat a completed task", async () => {
  const originalFetch = globalThis.fetch;
  let toolCalls = 0;
  globalThis.fetch = async () => new Response(JSON.stringify({ values: [
    ["task_id","created_at","source","command","intent","status","priority","provider","tool","started_at","completed_at","error","result_id"],
    ["t1","2026-01-01","chat","send","gmail.send","completed","normal","","gmail.send","","","","r1"]
  ]}), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const engine = new ExecutionEngine({ toolRegistry: { "gmail.send": async () => { toolCalls++; } } });
    const result = await engine.execute({ GOOGLE_SHEETS_DATABASE_ID: "db" }, { task_id: "t1", tool: "gmail.send" });
    assert.equal(result.idempotent, true);
    assert.equal(toolCalls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
