export const GOOGLE_SERVICES = Object.freeze([
  { id: "sheets", name: "Google Sheets API", capability: "database" },
  { id: "drive", name: "Google Drive API", capability: "files" },
  { id: "gmail", name: "Gmail API", capability: "email" },
  { id: "calendar", name: "Google Calendar API", capability: "calendar" },
  { id: "docs", name: "Google Docs API", capability: "documents" },
  { id: "forms", name: "Google Forms API", capability: "forms" },
  { id: "blogger", name: "Blogger API", capability: "blogging" },
  { id: "maps", name: "Google Maps JavaScript API", capability: "maps" }
]);

export function createGoogleServiceRegistry() {
  return new Map(GOOGLE_SERVICES.map((service) => [service.id, Object.freeze({ ...service, status: "not-configured", enabled: false })]));
}
