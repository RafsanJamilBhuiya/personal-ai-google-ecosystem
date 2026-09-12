import test from "node:test";
import assert from "node:assert/strict";
import { validateCommandPayload } from "../../backend/middleware/index.js";
import { ExecutionEngine } from "../../backend/execution/index.js";

test("command validation trims valid input", () => {
  assert.equal(validateCommandPayload({ command: "  hello  " }).command, "hello");
});

test("command validation rejects empty command", () => {
  assert.throws(() => validateCommandPayload({ command: "   " }), /non-empty command/);
});

test("execution engine creates task result", async () => {
  const result = await new ExecutionEngine().execute({ type: "task.create", command: "hello" });
  assert.equal(result.status, "accepted");
  assert.equal(result.command, "hello");
  assert.ok(result.taskId);
});
