import { persistTask, ExecutionEngine } from "../execution/index.js";

export const COMMANDS = Object.freeze({ SYSTEM_STATUS: "system.status", TASK_CREATE: "task.create" });
const toolForIntent = intent => ({
  "google.gmail.send": "google.gmail.send",
  "google.calendar.create": "google.calendar.create",
  "google.sheets.operation": "google.sheets.append",
  "google.drive.list": "google.drive.list",
  "google.drive.create": "google.drive.create",
  "google.docs.create": "google.docs.create",
  "google.forms.create": "google.forms.create",
  "google.blogger.createPost": "google.blogger.createPost"
}[intent] || "system.status");

export function createCommandRegistry({ env, toolRegistry }) {
  const engine = new ExecutionEngine({ toolRegistry });
  const registry = new Map();
  registry.set(COMMANDS.SYSTEM_STATUS, async () => ({ status: "completed", result: { response: "operational" } }));
  registry.set(COMMANDS.TASK_CREATE, async input => {
    const intent = input.intent || input.parsed?.intent || "task.create";
    const tool = input.tool || input.plan?.tool || toolForIntent(intent);
    if (tool === "system.status") return registry.get(COMMANDS.SYSTEM_STATUS)(input);
    const task = await persistTask(env, { source: input.source || "api", command: input.command || "", intent, priority: input.priority || "normal", provider: input.plan?.provider || "", tool, input: input.input || input.metadata || {} });
    return engine.execute(env, { ...task, task_id: task.task_id, tool, input: input.input || input.metadata || {} });
  });
  return registry;
}
