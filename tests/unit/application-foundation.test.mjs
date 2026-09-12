import test from "node:test";
import assert from "node:assert/strict";
import { validateCommandPayload } from "../../backend/middleware/index.js";
import { ExecutionEngine } from "../../backend/execution/index.js";
import { createToolRegistry } from "../../backend/execution/tools.js";

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

test("tool registry exposes Google execution tools", () => {
  const tools = createToolRegistry();
  for (const name of ["google.sheets.read", "google.sheets.append", "google.sheets.update", "google.gmail.send", "google.calendar.create", "google.drive.list", "google.docs.create", "google.forms.create", "google.blogger.createPost"]) {
    assert.equal(typeof tools[name], "function", name);
  }
});
