# Database Design

## Primary datastore

Google Sheets workbook: **Personal AI System Database**

## Logical sheets

- system_config
- tasks
- task_results
- ai_providers
- ai_models
- google_services
- api_status
- activity_logs
- error_logs
- chat_history
- agent_memory
- user_settings

## Design principle

Sheets are treated as structured application data, with stable identifiers, timestamps, status fields, and explicit relationships. Live initialization is a later implementation task.
