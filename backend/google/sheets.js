import { googleFetch, googleBatchUpdate } from "./client.js";

function encodeRange(range) { return encodeURIComponent(range); }
function assertMatrix(values) { if (!Array.isArray(values) || values.some(row => !Array.isArray(row))) throw new Error("values must be a 2D array"); }

export async function getSpreadsheet(env, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_DATABASE_ID is required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);
}
export async function readValues(env, range, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  if (!spreadsheetId || !range) throw new Error("spreadsheetId and range are required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeRange(range)}`);
}
export async function appendValues(env, range, values, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  if (!spreadsheetId || !range) throw new Error("spreadsheetId and range are required");
  assertMatrix(values);
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeRange(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, { method: "POST", body: JSON.stringify({ values }) });
}
export async function updateValues(env, range, values, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  if (!spreadsheetId || !range) throw new Error("spreadsheetId and range are required");
  assertMatrix(values);
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeRange(range)}?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ range, majorDimension: "ROWS", values }) });
}
export async function batchUpdateValues(env, data, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  if (!spreadsheetId || !Array.isArray(data) || data.length === 0) throw new Error("spreadsheetId and non-empty data are required");
  data.forEach(item => { if (!item?.range || !Array.isArray(item.values)) throw new Error("invalid batch value entry"); });
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, { method: "POST", body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }) });
}
export async function batchUpdate(env, requests, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  return googleBatchUpdate(env, requests, spreadsheetId);
}
export async function deleteRows(env, sheetId, startIndex, endIndex, spreadsheetId = env.GOOGLE_SHEETS_DATABASE_ID) {
  if (!Number.isInteger(sheetId) || !Number.isInteger(startIndex) || !Number.isInteger(endIndex) || startIndex < 0 || endIndex <= startIndex) throw new Error("INVALID_ROW_RANGE");
  return batchUpdate(env, [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex, endIndex } } }], spreadsheetId);
}
export const sheets = Object.freeze({ metadata: getSpreadsheet, read: (env, id, range) => readValues(env, range, id), append: (env, id, range, values) => appendValues(env, range, values, id), update: (env, id, range, values) => updateValues(env, range, values, id), batchUpdate: (env, id, data) => batchUpdateValues(env, data, id), deleteRows });
