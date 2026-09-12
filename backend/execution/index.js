import { createTask, createTaskResult, updateTask } from "../database/task-store.js";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class ExecutionEngine {
  constructor({ toolRegistry = {}, maxRetries = 2, timeoutMs = 30000 } = {}) {
    this.toolRegistry = toolRegistry;
    this.maxRetries = Math.max(0, Number(maxRetries));
    this.timeoutMs = Math.max(1000, Number(timeoutMs));
  }

  async execute(env, task) {
    if (!task?.task_id) throw new Error("TASK_ID_REQUIRED");
    if (!task.tool) throw new Error("TOOL_REQUIRED");

    const started = Date.now();
    await updateTask(env, task.task_id, {
      status: "running",
      started_at: new Date(started).toISOString(),
      error: ""
    });

    const tool = this.toolRegistry[task.tool];
    if (typeof tool !== "function") {
      await updateTask(env, task.task_id, {
        status: "failed",
        completed_at: new Date().toISOString(),
        error: "TOOL_NOT_REGISTERED"
      });
      throw new Error("TOOL_NOT_REGISTERED");
    }

    // Google actions such as Gmail send and Calendar create are side-effecting.
    // Retries are therefore opt-in per task instead of automatic by default.
    const retryable = task.retryable === true;
    const attemptsAllowed = retryable ? this.maxRetries + 1 : 1;
    let lastError;

    for (let attempt = 0; attempt < attemptsAllowed; attempt++) {
      try {
        const result = await Promise.race([
          Promise.resolve().then(() => tool(env, task.input || {})),
          new Promise((_, reject) => setTimeout(() => reject(new Error("EXECUTION_TIMEOUT")), this.timeoutMs))
        ]);

        const resultId = `result_${crypto.randomUUID()}`;
        await createTaskResult(env, {
          result_id: resultId,
          task_id: task.task_id,
          status: "success",
          response: result?.response ?? "",
          data: JSON.stringify(result?.data ?? result ?? {}),
          execution_time: String(Date.now() - started)
        });
        await updateTask(env, task.task_id, {
          status: "completed",
          completed_at: new Date().toISOString(),
          result_id: resultId
        });
        return { status: "completed", task_id: task.task_id, result, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attemptsAllowed) await sleep(250 * (2 ** attempt));
      }
    }

    const resultId = `result_${crypto.randomUUID()}`;
    await createTaskResult(env, {
      result_id: resultId,
      task_id: task.task_id,
      status: "failed",
      response: "Execution failed",
      data: "",
      execution_time: String(Date.now() - started)
    });
    await updateTask(env, task.task_id, {
      status: "failed",
      completed_at: new Date().toISOString(),
      error: String(lastError?.message || lastError || "EXECUTION_FAILED"),
      result_id: resultId
    });
    throw lastError || new Error("EXECUTION_FAILED");
  }
}

export async function persistTask(env, task) {
  return createTask(env, { ...task, status: "queued" });
}
