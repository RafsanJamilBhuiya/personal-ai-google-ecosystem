import { drive, docs, forms, blogger } from "../google/services/index.js";
import { sendMessage } from "../google/services/gmail.js";
import { createEvent, listEvents } from "../google/services/calendar.js";
import { readValues, appendValues, updateValues } from "../google/sheets.js";

export function createToolRegistry() {
  return Object.freeze({
    "google.sheets.read": (env, input) => readValues(env, input.range, input.spreadsheetId),
    "google.sheets.append": (env, input) => appendValues(env, input.range, input.values, input.spreadsheetId),
    "google.sheets.update": (env, input) => updateValues(env, input.range, input.values, input.spreadsheetId),
    "google.gmail.send": (env, input) => sendMessage(env, input),
    "google.calendar.list": (env, input) => listEvents(env, input.calendarId || "primary", input.timeMin, input.maxResults || 50),
    "google.calendar.create": (env, input) => createEvent(env, input.event, input.calendarId || "primary"),
    "google.drive.list": (env, input) => drive.list(env, input.q || "trashed=false", input.pageSize || 100),
    "google.drive.get": (env, input) => drive.get(env, input.id),
    "google.drive.create": (env, input) => drive.create(env, input.metadata),
    "google.docs.get": (env, input) => docs.get(env, input.id),
    "google.docs.create": (env, input) => docs.create(env, input.title),
    "google.docs.batchUpdate": (env, input) => docs.batchUpdate(env, input.id, input.requests),
    "google.forms.get": (env, input) => forms.get(env, input.id),
    "google.forms.create": (env, input) => forms.create(env, input.info),
    "google.forms.batchUpdate": (env, input) => forms.batchUpdate(env, input.id, input.requests),
    "google.blogger.posts": (env, input) => blogger.posts(env, input.blogId, input.params || {}),
    "google.blogger.createPost": (env, input) => blogger.createPost(env, input.blogId, input.post),
    "system.status": async () => ({ response: "operational", data: { service: "personal-ai-google-ecosystem" } })
  });
}
