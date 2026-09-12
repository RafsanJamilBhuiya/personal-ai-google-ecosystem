const RULES = [
  ["system.status", /\b(status|health|system status)\b/, 0.98],
  ["google.calendar.list", /\b(list|show|view|upcoming).*(calendar|events|meetings)\b/, 0.92],
  ["google.sheets.read", /\b(read|show|view|get).*(sheet|spreadsheet|range|cell|rows?)\b/, 0.92],
  ["google.drive.list", /\b(list|show|find|search).*(drive|files?|folders?)\b/, 0.90],
  ["google.docs.get", /\b(read|show|view|get).*(doc|document)\b/, 0.90],
  ["google.forms.get", /\b(read|show|view|get).*(form|response)\b/, 0.90],
  ["google.blogger.posts", /\b(list|show|view).*(blog|posts?|blogger)\b/, 0.88],
  ["google.gmail.send", /\b(send|email|mail|gmail)\b/, 0.90],
  ["google.calendar.create", /\b(calendar|event|schedule|meeting|appointment)\b/, 0.90],
  ["google.sheets.append", /\b(add|append|insert).*(sheet|spreadsheet|row|data)\b/, 0.92],
  ["google.sheets.update", /\b(update|edit|change).*(sheet|spreadsheet|cell|range|row)\b/, 0.92],
  ["google.drive.create", /\b(create|make|new).*(drive|file|folder)\b/, 0.88],
  ["google.docs.create", /\b(create|make|new).*(doc|document)\b/, 0.90],
  ["google.forms.create", /\b(create|make|new).*(form)\b/, 0.90],
  ["google.blogger.createPost", /\b(create|publish|write).*(blog|post|blogger)\b/, 0.90]
];

export function parseCommand(input) {
  const command = String(input?.command || "").trim();
  if (!command) return { intent: "unknown", command: "", confidence: 0 };
  const normalized = command.toLowerCase();
  for (const [intent, pattern, confidence] of RULES) {
    if (pattern.test(normalized)) return { intent, command, confidence };
  }
  return { intent: "task.create", command, confidence: 0.50 };
}
