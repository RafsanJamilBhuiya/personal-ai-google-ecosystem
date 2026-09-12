const SERVICES = [
  { id: "sheets", name: "Google Sheets API", capability: "database", required: "GOOGLE_SPREADSHEET_ID" },
  { id: "drive", name: "Google Drive API", capability: "files" },
  { id: "gmail", name: "Gmail API", capability: "email" },
  { id: "calendar", name: "Google Calendar API", capability: "calendar" },
  { id: "docs", name: "Google Docs API", capability: "documents" },
  { id: "forms", name: "Google Forms API", capability: "forms" },
  { id: "blogger", name: "Blogger API", capability: "blogging" },
  { id: "maps", name: "Google Maps JavaScript API", capability: "maps" }
];

export function createGoogleServiceRegistry(env = {}) {
  const oauthConfigured = Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_REDIRECT_URI);
  const tokenConfigured = Boolean(env.GOOGLE_ACCESS_TOKEN || env.GOOGLE_REFRESH_TOKEN);
  return new Map(SERVICES.map((service) => [service.id, {
    ...service,
    status: oauthConfigured && tokenConfigured ? "available" : oauthConfigured ? "awaiting-token" : "not-configured",
    enabled: oauthConfigured && tokenConfigured
  }]));
}
export { SERVICES as GOOGLE_SERVICES };
