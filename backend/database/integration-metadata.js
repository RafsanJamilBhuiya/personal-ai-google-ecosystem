import { appendRecord, findRecord, updateRecord } from "./sheets-engine.js";

const now = () => new Date().toISOString();

export async function upsertIntegrationMetadata(env, record) {
  const sheet = "google_services";
  const serviceId = String(record.service_id || "").trim();
  if (!serviceId) throw new Error("INTEGRATION_SERVICE_ID_REQUIRED");
  const existing = await findRecord(env, sheet, "service_id", serviceId);
  const normalized = {
    service_id: serviceId,
    service_name: record.service_name || serviceId,
    status: record.status || "unknown",
    enabled: Boolean(record.enabled),
    scopes: record.scopes || "",
    last_checked: record.last_checked || now()
  };
  if (existing) return updateRecord(env, sheet, "service_id", serviceId, normalized);
  return appendRecord(env, sheet, normalized);
}

export async function syncGoogleServiceMetadata(env, services) {
  if (!Array.isArray(services)) throw new Error("GOOGLE_SERVICES_REQUIRED");
  const results = [];
  for (const service of services) results.push(await upsertIntegrationMetadata(env, service));
  return { count: results.length };
}

export async function upsertPlatformMetadata(env, { platform, status, account = "", details = "" } = {}) {
  const platformId = String(platform || "").trim();
  if (!platformId) throw new Error("INTEGRATION_PLATFORM_REQUIRED");
  const key = `integration:${platformId}`;
  const record = { key, value: JSON.stringify({ platform: platformId, status, account, details }), updated_at: now() };
  const existing = await findRecord(env, "system_config", "key", key);
  if (existing) return updateRecord(env, "system_config", "key", key, record);
  return appendRecord(env, "system_config", record);
}
