import { findTask } from "../database/task-store.js";

const encoder = new TextEncoder();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const terminal = new Set(["completed", "failed", "cancelled", "timeout"]);

function eventChunk(id, event, data) {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function taskFingerprint(task) {
  return JSON.stringify({
    status: task.status,
    progress: task.progress ?? "",
    stage: task.stage ?? "",
    result_id: task.result_id ?? "",
    error: task.error ?? "",
    started_at: task.started_at ?? "",
    completed_at: task.completed_at ?? ""
  });
}

export function taskEventStream(env, taskId, { intervalMs = 1500, maxMs = 60000, lastEventId = 0 } = {}) {
  const stream = new ReadableStream({
    async start(controller) {
      const started = Date.now();
      let sequence = Number(lastEventId) || 0;
      let lastFingerprint = "";
      const send = (event, data) => {
        sequence += 1;
        controller.enqueue(encoder.encode(eventChunk(sequence, event, data)));
      };
      try {
        send("connected", { task_id: taskId, sequence, timestamp: new Date().toISOString() });
        while (Date.now() - started < maxMs) {
          const task = await findTask(env, taskId);
          if (!task) {
            send("error", { code: "TASK_NOT_FOUND", task_id: taskId });
            break;
          }
          const fingerprint = taskFingerprint(task);
          if (fingerprint !== lastFingerprint) {
            lastFingerprint = fingerprint;
            const progress = Number.isFinite(Number(task.progress)) ? Number(task.progress) : terminal.has(task.status) ? 100 : 0;
            send("task", { task, progress, stage: task.stage || task.status });
          } else {
            send("heartbeat", { task_id: taskId, sequence, timestamp: new Date().toISOString() });
          }
          if (terminal.has(task.status)) break;
          await sleep(intervalMs);
        }
        if (Date.now() - started >= maxMs) send("timeout", { task_id: taskId, max_ms: maxMs });
        send("closed", { task_id: taskId, sequence, timestamp: new Date().toISOString() });
      } catch (error) {
        send("error", { code: error?.code || "REALTIME_ERROR", message: error?.message || "Realtime stream failed" });
      } finally {
        controller.close();
      }
    }
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      "x-accel-buffering": "no"
    }
  });
}
