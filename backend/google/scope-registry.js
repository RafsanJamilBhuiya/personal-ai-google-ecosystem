export const GOOGLE_SCOPE_REGISTRY = Object.freeze({
  sheets: { scope: "https://www.googleapis.com/auth/spreadsheets", probe: "/v4/spreadsheets/{spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties" },
  drive: { scope: "https://www.googleapis.com/auth/drive", probe: "/drive/v3/files?pageSize=1&fields=files(id,name,mimeType)" },
  gmail: { scope: "https://www.googleapis.com/auth/gmail.send", probe: "/gmail/v1/users/me/profile" },
  calendar: { scope: "https://www.googleapis.com/auth/calendar", probe: "/calendar/v3/users/me/calendarList?maxResults=1" },
  docs: { scope: "https://www.googleapis.com/auth/documents", probe: "/drive/v3/files?pageSize=1&q=mimeType%3D%27application%2Fvnd.google-apps.document%27&fields=files(id,name)" },
  forms: { scope: "https://www.googleapis.com/auth/forms.body", probe: "/drive/v3/files?pageSize=1&q=mimeType%3D%27application%2Fvnd.google-apps.form%27&fields=files(id,name)" },
  blogger: { scope: "https://www.googleapis.com/auth/blogger", probe: "/blogger/v3/users/self/blogs" }
});

export function requiredGoogleScopes() { return Object.values(GOOGLE_SCOPE_REGISTRY).map(x => x.scope); }
export function serviceForScope(scope) { return Object.entries(GOOGLE_SCOPE_REGISTRY).find(([,x]) => x.scope === scope)?.[0] || null; }
export function scopeStatus(granted = "") {
  const grantedSet = new Set(String(granted).split(/\s+/).filter(Boolean));
  return Object.fromEntries(Object.entries(GOOGLE_SCOPE_REGISTRY).map(([service, meta]) => [service, { required: meta.scope, granted: grantedSet.has(meta.scope) }]));
}
