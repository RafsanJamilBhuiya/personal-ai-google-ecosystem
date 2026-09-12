import test from "node:test";
import assert from "node:assert/strict";
import { validateCommandPayload } from "../../backend/middleware/index.js";
import { ExecutionEngine } from "../../backend/execution/index.js";
import { createToolRegistry } from "../../backend/execution/tools.js";
import { parseCommand } from "../../backend/agent/parser.js";
import { planTask } from "../../backend/agent/planner.js";
import { SHEETS, rowFor, recordFromRow } from "../../backend/database/sheets-engine.js";
import { toolForIntent } from "../../backend/commands/index.js";

test("command validation trims valid input", () => {
  assert.equal(validateCommandPayload({ command: "  hello  " }).command, "hello");
});

test("command validation rejects empty command", () => {
  assert.throws(() => validateCommandPayload({ command: "   " }), /non-empty command/);
});

test("execution engine enforces production task contract", async () => {
  const engine = new ExecutionEngine({ timeoutMs: 1000 });
  await assert.rejects(() => engine.execute({}, { tool: "system.status" }), /TASK_ID_REQUIRED/);
});

test("tool registry exposes all primary Google execution tools", () => {
  const tools = createToolRegistry();
  for (const name of [
    "google.sheets.read", "google.sheets.append", "google.sheets.update", "google.sheets.batchUpdate",
    "google.gmail.send", "google.calendar.list", "google.calendar.create", "google.drive.list", "google.drive.get",
    "google.drive.create", "google.docs.get", "google.docs.create", "google.docs.batchUpdate",
    "google.forms.get", "google.forms.create", "google.forms.batchUpdate", "google.blogger.posts", "google.blogger.createPost"
  ]) assert.equal(typeof tools[name], "function", name);
});

test("parser covers primary Google command families", () => {
  const cases = [
    ["send an email", "google.gmail.send"],
    ["show upcoming calendar events", "google.calendar.list"],
    ["create a calendar meeting", "google.calendar.create"],
    ["read spreadsheet rows", "google.sheets.read"],
    ["append data to sheet", "google.sheets.append"],
    ["update spreadsheet cell", "google.sheets.update"],
    ["list drive files", "google.drive.list"],
    ["create a document", "google.docs.create"],
    ["create a form", "google.forms.create"],
    ["publish a blog post", "google.blogger.createPost"]
  ];
  for (const [command, intent] of cases) assert.equal(parseCommand({ command }).intent, intent);
});

test("planner produces an executable tool and permission step", () => {
  const plan = planTask(parseCommand({ command: "send an email" }));
  assert.equal(plan.intent, "google.gmail.send");
  assert.equal(plan.tool, "google.gmail.send");
  assert.equal(plan.requiresPermission, true);
  assert.deepEqual(plan.steps.map(step => step.type), ["permission.check", "tool.select", "execute"]);
});

test("command intent mappings resolve to registered tools", () => {
  for (const intent of ["google.gmail.send", "google.calendar.create", "google.calendar.list", "google.sheets.read", "google.sheets.append", "google.sheets.update", "google.drive.list", "google.drive.create", "google.docs.create", "google.forms.create", "google.blogger.createPost"]) {
    assert.equal(toolForIntent(intent), intent);
  }
});

test("Sheets schema round-trips records without losing fields", () => {
  const record = { task_id: "task_1", status: "queued", command: "hello", priority: "normal" };
  const row = rowFor("tasks", record);
  const restored = recordFromRow("tasks", row);
  assert.equal(restored.task_id, "task_1");
  assert.equal(restored.status, "queued");
  assert.equal(restored.command, "hello");
  assert.equal(restored.priority, "normal");
  assert.equal(row.length, SHEETS.tasks.length);
});
