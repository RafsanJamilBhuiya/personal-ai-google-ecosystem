export class ExecutionEngine {
  constructor({ resultStore = null, now = () => new Date() } = {}) {
    this.resultStore = resultStore;
    this.now = now;
  }

  async execute(task) {
    const startedAt = this.now();
    const result = {
      taskId: task.taskId || crypto.randomUUID(),
      status: "accepted",
      type: task.type,
      command: task.command,
      startedAt: startedAt.toISOString()
    };

    if (this.resultStore?.save) await this.resultStore.save(result);
    return result;
  }
}
