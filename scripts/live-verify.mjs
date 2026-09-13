const workerUrl = String(process.env.LIVE_WORKER_URL || process.argv[2] || "").trim().replace(/\/$/, "");
const frontendUrl = String(process.env.LIVE_FRONTEND_URL || process.argv[3] || "https://rafsanjamilbhuiya.github.io/personal-ai-google-ecosystem/").trim().replace(/\/$/, "");

if (!workerUrl) {
  console.error("LIVE_WORKER_URL is required. This script performs real live verification and does not use a mock endpoint.");
  process.exit(2);
}

const checks = [];
async function check(name, url, options = {}, predicate = r => r.ok) {
  try {
    const response = await fetch(url, { redirect: "follow", ...options });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    const pass = predicate(response, body, text);
    checks.push({ name, pass, status: response.status });
    console.log(`${pass ? "PASS" : "FAIL"} ${name} [${response.status}]`);
    if (!pass && text) console.log(text.slice(0, 500));
    return pass;
  } catch (error) {
    checks.push({ name, pass: false, error: error.message });
    console.log(`FAIL ${name} [${error.message}]`);
    return false;
  }
}

await check("Worker health", `${workerUrl}/health`, {}, (_, body) => body?.ok === true && body?.service === "worker");
await check("Worker status", `${workerUrl}/api/status`, { headers: { origin: new URL(frontendUrl).origin } }, (_, body) => body?.ok === true && body?.auth?.configured === true);
await check("Auth status endpoint", `${workerUrl}/api/auth/status`, { headers: { origin: new URL(frontendUrl).origin } }, (_, body) => body?.ok === true && body?.authenticated === false);
await check("Frontend Pages", frontendUrl, {}, (response, _, text) => response.ok && text.includes("Personal AI + Google Ecosystem"));

const failed = checks.filter(x => !x.pass);
console.log(`\nLive verification: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
