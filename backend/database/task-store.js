import { appendTask, appendTaskResult, updateRange, readSheet } from "./sheets-engine.js";

const columnName = index => { let name = ""; for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) name = String.fromCharCode(65 + (n % 26)) + name; return name; };

export async function createTask(env, task) {
  return appendTask(env, { ...task, task_id: task.task_id || `task_${crypto.randomUUID()}`, status: task.status || "queued", priority: task.priority || "normal" });
}
export async function createTaskResult(env, result) {
  const result_id = result.result_id || `result_${crypto.randomUUID()}`;
  const response = await appendTaskResult(env, { ...result, result_id });
  return { result_id, response };
}
export async function findTask(env, taskId) {
  const { headers, rows } = await readSheet(env, "tasks");
  const idCol = headers.indexOf("task_id");
  const row = rows.find(r => r[idCol] === taskId);
  return row ? Object.fromEntries(headers.map((h, n) => [h, row[n] ?? ""])) : null;
}
export async function updateTask(env, taskId, patch) {
  const { headers, rows } = await readSheet(env, "tasks");
  const idCol = headers.indexOf("task_id");
  const rowIndex = rows.findIndex(r => r[idCol] === taskId);
  if (rowIndex < 0) throw new Error("TASK_NOT_FOUND");
  const current = Object.fromEntries(headers.map((h, n) => [h, rows[rowIndex][n] ?? ""]));
  const merged = { ...current, ...patch };
  const rowNumber = rowIndex + 2;
  await updateRange(env, "tasks", `A${rowNumber}:${columnName(headers.length - 1)}${rowNumber}`, [headers.map(h => merged[h] ?? "")]);
  return merged;
}
