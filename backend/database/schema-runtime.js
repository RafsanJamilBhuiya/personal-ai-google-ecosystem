const SCHEMA = {
  system_config: ["config_id","key","value","updated_at"],
  tasks: ["task_id","created_at","source","command","intent","status","priority","provider","tool","started_at","completed_at","error","result_id"],
  task_results: ["result_id","task_id","status","response","data","created_at","execution_time"],
  ai_providers: ["provider_id","provider_name","status","endpoint","priority","quota","rate_limit","enabled","last_checked"],
  ai_models: ["model_id","provider_id","model_name","type","status","priority","context_limit"],
  google_services: ["service_id","service_name","status","enabled","scopes","last_checked"],
  api_status: ["api_id","service","status","latency_ms","checked_at","message"],
  activity_logs: ["log_id","timestamp","source","action","task_id","service","status","message"],
  error_logs: ["error_id","timestamp","source","code","message","task_id","request_id"],
  chat_history: ["message_id","session_id","timestamp","role","message","provider","task_id"],
  agent_memory: ["memory_id","category","key","value","importance","created_at","updated_at"],
  user_settings: ["setting_id","key","value","updated_at"]
};

export const DATABASE_SCHEMA = Object.freeze(SCHEMA);

export function initializationRows() {
  return Object.entries(SCHEMA).map(([sheet, headers]) => ({ sheet, headers }));
}
