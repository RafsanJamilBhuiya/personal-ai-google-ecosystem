import { appendValues, readValues, updateValues, getSpreadsheet, deleteRows } from "../google/sheets.js";

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
const fieldsFor = sheet => { const fields = SHEETS[sheet]; if (!fields) throw new Error(`Unknown database sheet: ${sheet}`); return fields; };

export function rowFor(sheet, record) { return fieldsFor(sheet).map(field => record?.[field] ?? ""); }
export function recordFromRow(sheet, row) { return Object.fromEntries(fieldsFor(sheet).map((field, index) => [field, row?.[index] ?? ""])); }
export async function appendRecord(env, sheet, record) { return appendValues(env, `${sheet}!A1`, [rowFor(sheet, record)]); }
export async function readSheet(env, sheet) { fieldsFor(sheet); const result = await readValues(env, `${sheet}!A:ZZ`); return { headers: SHEETS[sheet], rows: result.values || [] }; }
export async function listRecords(env, sheet, { filter = {}, sortBy = null, direction = "asc", limit = 100, offset = 0 } = {}) {
  const records = (await readSheet(env, sheet)).rows.slice(1).filter(row => row.some(Boolean)).map(row => recordFromRow(sheet, row));
  const filtered = records.filter(record => Object.entries(filter).every(([key, value]) => SHEETS[sheet].includes(key) && String(record[key]) === String(value)));
  if (sortBy) {
    if (!SHEETS[sheet].includes(sortBy)) throw new Error("DATABASE_SORT_INVALID");
    const factor = direction === "desc" ? -1 : 1;
    filtered.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy]), undefined, { numeric: true }) * factor);
  }
  const safeOffset = Math.max(0, Number(offset) || 0);
  const safeLimit = Math.min(1000, Math.max(1, Number(limit) || 100));
  return { records: filtered.slice(safeOffset, safeOffset + safeLimit), total: filtered.length, offset: safeOffset, limit: safeLimit };
}
export async function findRecord(env, sheet, keyField, keyValue) { fieldsFor(sheet); if (!SHEETS[sheet].includes(keyField)) throw new Error("DATABASE_KEY_INVALID"); return (await listRecords(env, sheet, { filter: { [keyField]: keyValue }, limit: 1 })).records[0] || null; }
export async function appendTask(env, task) { return appendRecord(env, "tasks", { task_id: task.task_id || id("task"), created_at: task.created_at || now(), ...task }); }
export async function appendTaskResult(env, result) { return appendRecord(env, "task_results", { result_id: result.result_id || id("result"), created_at: result.created_at || now(), ...result }); }
export async function appendActivityLog(env, record) { return appendRecord(env, "activity_logs", { log_id: record.log_id || id("log"), timestamp: record.timestamp || now(), ...record }); }
export async function appendErrorLog(env, record) { return appendRecord(env, "error_logs", { error_id: record.error_id || id("err"), timestamp: record.timestamp || now(), ...record }); }
export async function updateRange(env, sheet, range, values) { fieldsFor(sheet); return updateValues(env, `${sheet}!${range}`, values); }
export async function updateRecord(env, sheet, keyField, keyValue, patch) {
  const fields = fieldsFor(sheet); if (!fields.includes(keyField)) throw new Error("DATABASE_KEY_INVALID");
  const { rows } = await readSheet(env, sheet); const keyIndex = fields.indexOf(keyField);
  const index = rows.findIndex((row, i) => i > 0 && String(row[keyIndex]) === String(keyValue));
  if (index < 1) throw new Error("RECORD_NOT_FOUND");
  const updated = { ...recordFromRow(sheet, rows[index]), ...patch, [keyField]: rowFor(sheet, recordFromRow(sheet, rows[index]))[keyIndex] };
  return updateValues(env, `${sheet}!A${index + 1}`, [rowFor(sheet, updated)]);
}
export async function deleteRecord(env, sheet, keyField, keyValue, { physical = false } = {}) {
  const fields = fieldsFor(sheet); if (!fields.includes(keyField)) throw new Error("DATABASE_KEY_INVALID");
  const { rows } = await readSheet(env, sheet); const keyIndex = fields.indexOf(keyField);
  const index = rows.findIndex((row, i) => i > 0 && String(row[keyIndex]) === String(keyValue));
  if (index < 1) throw new Error("RECORD_NOT_FOUND");
  if (!physical) return updateValues(env, `${sheet}!A${index + 1}`, [fields.map(() => "")]);
  const metadata = await getSpreadsheet(env);
  const sheetMeta = (metadata.sheets || []).find(s => s.properties?.title === sheet);
  if (!sheetMeta) throw new Error("SHEET_NOT_FOUND");
  return deleteRows(env, sheetMeta.properties.sheetId, index, index + 1);
}
