export function planTask(parsed) {
  const steps = [];
  if (!parsed?.intent) return { intent: "unknown", steps };

  if (parsed.intent.startsWith("google.")) {
    const service = parsed.intent.split(".")[1];
    steps.push({ type: "permission.check", service });
    steps.push({ type: "tool.select", service, intent: parsed.intent });
    steps.push({ type: "execute", service, intent: parsed.intent });
  } else {
    steps.push({ type: "execute", intent: parsed.intent });
  }
  return { intent: parsed.intent, steps };
}
