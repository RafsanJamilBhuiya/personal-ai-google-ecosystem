export class PermissionError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionError";
    this.code = "PERMISSION_DENIED";
  }
}

export function checkPermission({ action, allowedActions = [] }) {
  if (!action || !allowedActions.includes(action)) {
    throw new PermissionError(`Action is not permitted: ${action || "unknown"}`);
  }
  return true;
}
