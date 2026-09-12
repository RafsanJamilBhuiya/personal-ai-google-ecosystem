import { googleFetch } from "./client.js";

function encodeRange(range) { return encodeURIComponent(range); }

export async function getSpreadsheet(env, spreadsheetId = env.GOOGLE_SPREADSHEET_ID) {
  if (!spreadsheetId) throw new Error("GOOGLE_SPREADSHEET_ID is required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);
}

export async function readValues(env, range, spreadsheetId = env.GOOGLE_SPREADSHEET_ID) {
  if (!spreadsheetId || !range) throw new Error("spreadsheetId and range are required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeRange(range)}`);
}

export async function appendValues(env, range, values, spreadsheetId = env.GOOGLE_SPREADSHEET_ID) {
  if (!spreadsheetId || !range || !Array.isArray(values)) throw new Error("spreadsheetId, range and values are required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeRange(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST", body: JSON.stringify({ values })
  });
}

export async function updateValues(env, range, values, spreadsheetId = env.GOOGLE_SPREADSHEET_ID) {
  if (!spreadsheetId || !range || !Array.isArray(values)) throw new Error("spreadsheetId, range and values are required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeRange(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT", body: JSON.stringify({ range, majorDimension: "ROWS", values })
  });
}

export async function batchUpdateValues(env, data, spreadsheetId = env.GOOGLE_SPREADSHEET_ID) {
  if (!spreadsheetId || !Array.isArray(data)) throw new Error("spreadsheetId and data are required");
  return googleFetch(env, `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, {
    method: "POST", body: JSON.stringify({ valueInputOption: "USER_ENTERED", data })
  });
}
