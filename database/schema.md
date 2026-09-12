# Database Schema Reference

| Sheet | Key fields |
|---|---|
| tasks | task_id, created_at, source, command, intent, status, priority, provider, tool, started_at, completed_at, error, result_id |
| task_results | result_id, task_id, status, response, data, created_at, execution_time |
| ai_providers | provider_id, provider_name, status, endpoint, priority, quota, rate_limit, enabled, last_checked |
| ai_models | model_id, provider_id, model_name, type, status, priority, context_limit |
| google_services | service_id, service_name, status, enabled, scopes, last_checked |
| activity_logs | log_id, timestamp, source, action, task_id, service, status, message |
| chat_history | message_id, session_id, timestamp, role, message, provider, task_id |
| agent_memory | memory_id, category, key, value, importance, created_at, updated_at |

Additional system, API-status, error-log, and user-setting fields are defined during the database implementation phase.
