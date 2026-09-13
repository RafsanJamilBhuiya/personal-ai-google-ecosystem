import { oauthStatus } from "./token-store.js";

const SERVICES = [
  { id: "sheets", name: "Google Sheets API", capability: "database", required: "GOOGLE_SHEETS_DATABASE_ID" },
  { id: "drive", name: "Google Drive API", capability: "files" },
  { id: "gmail", name: "Gmail API", capability: "email" },
  { id: "calendar", name: "Google Calendar API", capability: "calendar" },
  { id: "docs", name: "Google Docs API", capability: "documents" },
  { id: "forms", name: "Google Forms API", capability: "forms" },
  { id: "blogger", name: "Blogger API", capability: "blogging" },
  { id: "maps", name: "Google Maps JavaScript API", capability: "maps" }
];

export async function createGoogleServiceRegistry(env = {}, auth = null) {
  const oauthConfigured = Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_REDIRECT_URI);
  const connected = auth?.connected === true;
  return new Map(SERVICES.map((service) => {
    const databaseReady = service.id !== "sheets" || Boolean(env.GOOGLE_SHEETS_DATABASE_ID);
    const status = !oauthConfigured
      ? "not-configured"
      : !connected
        ? "awaiting-authorization"
        : !databaseReady
          ? "configuration-required"
          : "available";
    return [service.id, { ...service, status, enabled: status === "available" }];
  }));
}

export async function getGoogleServiceRegistry(env = {}) {
  return createGoogleServiceRegistry(env, await oauthStatus(env));
}

export { SERVICES as GOOGLE_SERVICES };
