import { googleFetch } from "../google/client.js";

export async function sendMessage(env, { to, subject, body }) {
  if (!to || !subject || !body) throw new Error("to, subject and body are required");
  const raw = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=UTF-8", "", body].join("\r\n");
  const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return googleFetch(env, "/gmail/v1/users/me/messages/send", { method: "POST", body: JSON.stringify({ raw: encoded }) });
}
