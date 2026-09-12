import { findTask } from "../database/task-store.js";

const encoder = new TextEncoder();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function eventChunk(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function taskEventStream(env, taskId, { intervalMs = 1500, maxMs = 60000 } = {}) {
  const stream = new ReadableStream({
    async start(controller) {
      const started = Date.now();
      let lastFingerprint = "";
      const send = (event, data) => controller.enqueue(encoder.encode(eventChunk(event, data)));
      try {
        send("connected", { task_id: taskId, timestamp: new Date().toISOString() });
        while (Date.now() - started < maxMs) {
          const task = await findTask(env, taskId);
          if (!task) {
            send("error", { code: "TASK_NOT_FOUND", task_id: taskId });
            break;
          }
          const fingerprint = JSON.stringify({ status: task.status, result_id: task.result_id, error: task.error, started_at: task.started_at, completed_at: task.completed_at });
          if (fingerprint !== lastFingerprint) {
            lastFingerprint = fingerprint;
            send("task", { task });
          } else {
            send("heartbeat", { task_id: taskId, timestamp: new Date().toISOString() });
          }
          if (["completed", "failed", "cancelled"].includes(task.status)) break;
          await sleep(intervalMs);
        }
        send("closed", { task_id: taskId, timestamp: new Date().toISOString() });
      } catch (error) {
        send("error", { code: error?.code || "REALTIME_ERROR", message: error?.message || "Realtime stream failed" });
      } finally {
        controller.close();
      }
    }
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", "connection": "keep-alive", "x-accel-buffering": "no" }
  });
}
