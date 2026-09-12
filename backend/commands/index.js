export const COMMANDS = Object.freeze({
  SYSTEM_STATUS: "system.status",
  TASK_CREATE: "task.create"
});

export function createCommandRegistry({ executionEngine }) {
  const registry = new Map();
  registry.set(COMMANDS.SYSTEM_STATUS, async () => ({
    service: "personal-ai-google-ecosystem",
    status: "operational",
    timestamp: new Date().toISOString()
  }));
  registry.set(COMMANDS.TASK_CREATE, async (input) => executionEngine.execute({
    type: COMMANDS.TASK_CREATE,
    command: input.command,
    metadata: input.metadata || {}
  }));
  return registry;
}
