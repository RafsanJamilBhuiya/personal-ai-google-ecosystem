# Database Relationships

Logical relationships include:

- `tasks.result_id` → `task_results.result_id`
- `task_results.task_id` → `tasks.task_id`
- `ai_models.provider_id` → `ai_providers.provider_id`
- `activity_logs.task_id` → `tasks.task_id`
- `chat_history.task_id` → `tasks.task_id`

Google Sheets does not enforce relational constraints like a traditional SQL database, so application-level validation must maintain referential integrity.
