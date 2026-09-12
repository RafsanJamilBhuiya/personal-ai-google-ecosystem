export function parseCommand(input) {
  const command = String(input?.command || "").trim();
  if (!command) return { intent: "unknown", command: "", confidence: 0 };

  const normalized = command.toLowerCase();
  if (/\b(status|health|system status)\b/.test(normalized)) {
    return { intent: "system.status", command, confidence: 0.95 };
  }
  if (/\b(send|email|mail)\b/.test(normalized)) {
    return { intent: "google.gmail.send", command, confidence: 0.85 };
  }
  if (/\b(calendar|event|schedule)\b/.test(normalized)) {
    return { intent: "google.calendar.create", command, confidence: 0.85 };
  }
  if (/\b(sheet|spreadsheet|row|cell)\b/.test(normalized)) {
    return { intent: "google.sheets.operation", command, confidence: 0.85 };
  }
  return { intent: "task.create", command, confidence: 0.5 };
}
