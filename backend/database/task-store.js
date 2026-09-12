import { appendTask, appendTaskResult, updateRange, readSheet } from "./sheets-engine.js";

const columnName = index => {
  let name = "";
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) name = String.fromCharCode(65 + (n % 26)) + name;
  return name;
};

export async function createTask(env, task) {
  const record = {
    ...task,
    task_id: task.task_id || `task_${crypto.randomUUID()}`,
    created_at: task.created_at || new Date().toISOString(),
    status: task.status || "queued",
    priority: task.priority || "normal"
  };
  const response = await appendTask(env, record);
  return { ...record, response };
}

export async function createTaskResult(env, result) {
  const record = {
    ...result,
    result_id: result.result_id || `result_${crypto.randomUUID()}`,
    created_at: result.created_at || new Date().toISOString()
  };
  const response = await appendTaskResult(env, record);
  return { ...record, response };
}

export async function findTask(env, taskId) {
  const { headers, rows } = await readSheet(env, "tasks");
  const idCol = headers.indexOf("task_id");
  if (idCol < 0) throw new Error("TASK_SCHEMA_INVALID");
  const row = rows.find(r => r[idCol] === taskId);
  return row ? Object.fromEntries(headers.map((h, n) => [h, row[n] ?? ""])) : null;
}

export async function updateTask(env, taskId, patch) {
  const { headers, rows } = await readSheet(env, "tasks");
  const idCol = headers.indexOf("task_id");
  if (idCol < 0) throw new Error("TASK_SCHEMA_INVALID");
  const rowIndex = rows.findIndex(r => r[idCol] === taskId);
  if (rowIndex < 0) throw new Error("TASK_NOT_FOUND");
  const current = Object.fromEntries(headers.map((h, n) => [h, rows[rowIndex][n] ?? ""]));
  const merged = { ...current, ...patch };
  const rowNumber = rowIndex + 2;
  await updateRange(env, "tasks", `A${rowNumber}:${columnName(headers.length - 1)}${rowNumber}`, [headers.map(h => merged[h] ?? "")]);
  return merged;
}
