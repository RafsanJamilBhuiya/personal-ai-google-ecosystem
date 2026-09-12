import { persistTask, ExecutionEngine } from "../execution/index.js";

export const COMMANDS = Object.freeze({ SYSTEM_STATUS: "system.status", TASK_CREATE: "task.create" });

const TOOL_BY_INTENT = Object.freeze({
  "google.gmail.send": "google.gmail.send",
  "google.calendar.create": "google.calendar.create",
  "google.calendar.list": "google.calendar.list",
  "google.sheets.read": "google.sheets.read",
  "google.sheets.append": "google.sheets.append",
  "google.sheets.update": "google.sheets.update",
  "google.sheets.operation": "google.sheets.append",
  "google.drive.list": "google.drive.list",
  "google.drive.get": "google.drive.get",
  "google.drive.create": "google.drive.create",
  "google.docs.get": "google.docs.get",
  "google.docs.create": "google.docs.create",
  "google.docs.batchUpdate": "google.docs.batchUpdate",
  "google.forms.get": "google.forms.get",
  "google.forms.create": "google.forms.create",
  "google.forms.batchUpdate": "google.forms.batchUpdate",
  "google.blogger.posts": "google.blogger.posts",
  "google.blogger.createPost": "google.blogger.createPost"
});

export function toolForIntent(intent) { return TOOL_BY_INTENT[intent] || null; }

export function createCommandRegistry({ env, toolRegistry }) {
  const engine = new ExecutionEngine({ toolRegistry });
  const registry = new Map();
  registry.set(COMMANDS.SYSTEM_STATUS, async () => ({ status: "completed", result: { response: "operational" } }));
  registry.set(COMMANDS.TASK_CREATE, async input => {
    const intent = input.intent || input.parsed?.intent || "task.create";
    const tool = input.tool || input.plan?.tool || toolForIntent(intent);
    if (!tool) throw new Error("TOOL_MAPPING_REQUIRED");
    if (tool === "system.status") return registry.get(COMMANDS.SYSTEM_STATUS)(input);
    const task = await persistTask(env, {
      source: input.source || "api",
      command: input.command || "",
      intent,
      priority: input.priority || "normal",
      provider: input.plan?.provider || "",
      tool,
      input: input.input || input.metadata || {},
      retryable: input.retryable === true
    });
    return engine.execute(env, { ...task, tool, input: input.input || input.metadata || {}, retryable: input.retryable === true });
  });
  return registry;
}
