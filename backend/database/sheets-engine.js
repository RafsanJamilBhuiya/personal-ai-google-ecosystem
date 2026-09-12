import { appendValues, readValues, updateValues } from "../google/sheets.js";

export const SHEETS = Object.freeze({
  system_config: ["config_id","key","value","updated_at"],
  tasks: ["task_id","created_at","source","command","intent","status","priority","provider","tool","started_at","completed_at","error","result_id"],
  task_results: ["result_id","task_id","status","response","data","created_at","execution_time"],
  ai_providers: ["provider_id","provider_name","status","endpoint","priority","quota","rate_limit","enabled","last_checked"],
  ai_models: ["model_id","provider_id","model_name","type","status","priority","context_limit"],
  google_services: ["service_id","service_name","status","enabled","scopes","last_checked"],
  api_status: ["api_id","service","status","latency_ms","checked_at","message"],
  activity_logs: ["log_id","timestamp","source","action","task_id","service","status","message"],
  error_logs: ["error_id","timestamp","source","code","message","task_id","request_id"],
  chat_history: ["message_id","session_id","timestamp","role","message","provider","task_id"],
  agent_memory: ["memory_id","category","key","value","importance","created_at","updated_at"],
  user_settings: ["setting_id","key","value","updated_at"]
});

const now = () => new Date().toISOString();
const id = prefix => `${prefix}_${crypto.randomUUID()}`;

export function rowFor(sheet, record) {
  const fields = SHEETS[sheet];
  if (!fields) throw new Error(`Unknown database sheet: ${sheet}`);
  return fields.map(field => record?.[field] ?? "");
}

export function recordFromRow(sheet, row) {
  const fields = SHEETS[sheet];
  if (!fields) throw new Error(`Unknown database sheet: ${sheet}`);
  return Object.fromEntries(fields.map((field, index) => [field, row?.[index] ?? ""]));
}

export async function appendRecord(env, sheet, record) {
  return appendValues(env, `${sheet}!A1`, [rowFor(sheet, record)]);
}

export async function readSheet(env, sheet) {
  if (!SHEETS[sheet]) throw new Error(`Unknown database sheet: ${sheet}`);
  const result = await readValues(env, `${sheet}!A:ZZ`);
  return { headers: SHEETS[sheet], rows: result.values || [] };
}

export async function listRecords(env, sheet) {
  const { rows } = await readSheet(env, sheet);
  return rows.slice(1).filter(row => row.some(Boolean)).map(row => recordFromRow(sheet, row));
}

export async function findRecord(env, sheet, keyField, keyValue) {
  if (!SHEETS[sheet]?.includes(keyField)) throw new Error("DATABASE_KEY_INVALID");
  const records = await listRecords(env, sheet);
  return records.find(record => String(record[keyField]) === String(keyValue)) || null;
}

export async function appendTask(env, task) {
  return appendRecord(env, "tasks", { task_id: task.task_id || id("task"), created_at: task.created_at || now(), ...task });
}

export async function appendTaskResult(env, result) {
  return appendRecord(env, "task_results", { result_id: result.result_id || id("result"), created_at: result.created_at || now(), ...result });
}

export async function appendActivityLog(env, record) {
  return appendRecord(env, "activity_logs", { log_id: record.log_id || id("log"), timestamp: record.timestamp || now(), ...record });
}

export async function appendErrorLog(env, record) {
  return appendRecord(env, "error_logs", { error_id: record.error_id || id("err"), timestamp: record.timestamp || now(), ...record });
}

export async function updateRange(env, sheet, range, values) {
  if (!SHEETS[sheet]) throw new Error(`Unknown database sheet: ${sheet}`);
  return updateValues(env, `${sheet}!${range}`, values);
}

export async function updateRecord(env, sheet, keyField, keyValue, patch) {
  const fields = SHEETS[sheet];
  if (!fields?.includes(keyField)) throw new Error("DATABASE_KEY_INVALID");
  const { rows } = await readSheet(env, sheet);
  const index = rows.findIndex((row, i) => i > 0 && String(row[fields.indexOf(keyField)]) === String(keyValue));
  if (index < 1) throw new Error("RECORD_NOT_FOUND");
  const current = recordFromRow(sheet, rows[index]);
  const updated = { ...current, ...patch, [keyField]: current[keyField] };
  return updateValues(env, `${sheet}!A${index + 1}`, [rowFor(sheet, updated)]);
}

export async function deleteRecord(env, sheet, keyField, keyValue) {
  // Sheets values API has no row-delete primitive here; blanking a record preserves audit/history.
  const fields = SHEETS[sheet];
  if (!fields?.includes(keyField)) throw new Error("DATABASE_KEY_INVALID");
  const { rows } = await readSheet(env, sheet);
  const index = rows.findIndex((row, i) => i > 0 && String(row[fields.indexOf(keyField)]) === String(keyValue));
  if (index < 1) throw new Error("RECORD_NOT_FOUND");
  return updateValues(env, `${sheet}!A${index + 1}`, [fields.map(() => "")]);
}
