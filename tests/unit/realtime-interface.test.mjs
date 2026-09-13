import test from "node:test";
import assert from "node:assert/strict";
import { eventChunk, taskFingerprint, taskProgress } from "../../backend/realtime/index.js";


test("realtime event protocol emits id, event and JSON data", () => {
  const chunk = eventChunk(7, "task", { task_id: "task_1", progress: 40 });
  assert.match(chunk, /^id: 7\nevent: task\ndata: \{"task_id":"task_1","progress":40\}\n\n$/);
});

test("realtime progress is bounded and terminal tasks reach 100", () => {
  assert.equal(taskProgress({ progress: 40 }), 40);
  assert.equal(taskProgress({ progress: 150 }), 100);
  assert.equal(taskProgress({ progress: -5 }), 0);
  assert.equal(taskProgress({ status: "completed" }), 100);
  assert.equal(taskProgress({ status: "running" }), 0);
});

test("task fingerprint changes when observable execution state changes", () => {
  const a = taskFingerprint({ status: "running", progress: 10, stage: "execute" });
  const b = taskFingerprint({ status: "running", progress: 20, stage: "execute" });
  assert.notEqual(a, b);
});

test("frontend interface files are present and wired to live APIs", async () => {
  const fs = await import("node:fs/promises");
  const dashboard = await fs.readFile(new URL("../../frontend/pages/dashboard.html", import.meta.url), "utf8");
  const tasks = await fs.readFile(new URL("../../frontend/pages/tasks.html", import.meta.url), "utf8");
  const dashboardJs = await fs.readFile(new URL("../../frontend/js/dashboard.js", import.meta.url), "utf8");
  const tasksJs = await fs.readFile(new URL("../../frontend/js/tasks.js", import.meta.url), "utf8");
  assert.match(dashboard, /dashboard\.js/);
  assert.match(tasks, /tasks\.js/);
  assert.match(dashboardJs, /\/api\/status/);
  assert.match(tasksJs, /\/api\/tasks/);
  assert.match(tasksJs, /watchTask/);
});
