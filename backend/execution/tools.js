import { drive, docs, forms, blogger } from "../google/services/index.js";
import { sendMessage } from "../google/services/gmail.js";
import { createEvent, listEvents } from "../google/services/calendar.js";
import { readValues, appendValues, updateValues, batchUpdateValues } from "../google/sheets.js";

const required = (value, code) => { if (value === undefined || value === null || value === "") throw new Error(code); return value; };

export function createToolRegistry() {
  return Object.freeze({
    "google.sheets.read": (env, input) => readValues(env, required(input.range, "RANGE_REQUIRED"), input.spreadsheetId),
    "google.sheets.append": (env, input) => appendValues(env, required(input.range, "RANGE_REQUIRED"), required(input.values, "VALUES_REQUIRED"), input.spreadsheetId),
    "google.sheets.update": (env, input) => updateValues(env, required(input.range, "RANGE_REQUIRED"), required(input.values, "VALUES_REQUIRED"), input.spreadsheetId),
    "google.sheets.batchUpdate": (env, input) => batchUpdateValues(env, required(input.data, "DATA_REQUIRED"), input.spreadsheetId),
    "google.gmail.send": (env, input) => sendMessage(env, input),
    "google.calendar.list": (env, input) => listEvents(env, input.calendarId || "primary", input.timeMin, input.maxResults || 50),
    "google.calendar.create": (env, input) => createEvent(env, required(input.event, "EVENT_REQUIRED"), input.calendarId || "primary"),
    "google.drive.list": (env, input) => drive.list(env, input.q || "trashed=false", input.pageSize || 100),
    "google.drive.get": (env, input) => drive.get(env, required(input.id, "FILE_ID_REQUIRED")),
    "google.drive.create": (env, input) => drive.create(env, required(input.metadata, "FILE_METADATA_REQUIRED")),
    "google.docs.get": (env, input) => docs.get(env, required(input.id, "DOCUMENT_ID_REQUIRED")),
    "google.docs.create": (env, input) => docs.create(env, required(input.title, "DOCUMENT_TITLE_REQUIRED")),
    "google.docs.batchUpdate": (env, input) => docs.batchUpdate(env, required(input.id, "DOCUMENT_ID_REQUIRED"), required(input.requests, "REQUESTS_REQUIRED")),
    "google.forms.get": (env, input) => forms.get(env, required(input.id, "FORM_ID_REQUIRED")),
    "google.forms.create": (env, input) => forms.create(env, required(input.info, "FORM_INFO_REQUIRED")),
    "google.forms.batchUpdate": (env, input) => forms.batchUpdate(env, required(input.id, "FORM_ID_REQUIRED"), required(input.requests, "REQUESTS_REQUIRED")),
    "google.blogger.posts": (env, input) => blogger.posts(env, required(input.blogId, "BLOG_ID_REQUIRED"), input.params || {}),
    "google.blogger.createPost": (env, input) => blogger.createPost(env, required(input.blogId, "BLOG_ID_REQUIRED"), required(input.post, "POST_REQUIRED")),
    "system.status": async () => ({ response: "operational", data: { service: "personal-ai-google-ecosystem" } })
  });
}
