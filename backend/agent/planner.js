const TOOL_BY_INTENT = Object.freeze({
  "google.gmail.send": "google.gmail.send",
  "google.calendar.create": "google.calendar.create",
  "google.calendar.list": "google.calendar.list",
  "google.sheets.read": "google.sheets.read",
  "google.sheets.append": "google.sheets.append",
  "google.sheets.update": "google.sheets.update",
  "google.drive.list": "google.drive.list",
  "google.drive.create": "google.drive.create",
  "google.docs.get": "google.docs.get",
  "google.docs.create": "google.docs.create",
  "google.docs.batchUpdate": "google.docs.batchUpdate",
  "google.forms.get": "google.forms.get",
  "google.forms.create": "google.forms.create",
  "google.forms.batchUpdate": "google.forms.batchUpdate",
  "google.blogger.posts": "google.blogger.posts",
  "google.blogger.createPost": "google.blogger.createPost"
});

export function planTask(parsed, options = {}) {
  const intent = parsed?.intent || "unknown";
  const tool = options.tool || TOOL_BY_INTENT[intent] || null;
  const steps = [];
  if (intent === "unknown") return { intent, tool: null, requiresPermission: false, steps };
  if (intent.startsWith("google.")) {
    const service = intent.split(".")[1];
    steps.push({ type: "permission.check", service, intent });
    if (tool) steps.push({ type: "tool.select", service, intent, tool });
    steps.push({ type: "execute", service, intent, tool });
  } else {
    steps.push({ type: "execute", intent, tool });
  }
  return {
    intent,
    tool,
    requiresPermission: intent.startsWith("google."),
    steps
  };
}
