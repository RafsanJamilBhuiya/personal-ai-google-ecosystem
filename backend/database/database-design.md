# Runtime database schema

Primary database: **Personal AI System Database** (Google Sheets).

The backend treats the following tabs as the canonical schema: `system_config`, `tasks`, `task_results`, `ai_providers`, `ai_models`, `google_services`, `api_status`, `activity_logs`, `error_logs`, `chat_history`, `agent_memory`, `user_settings`.

Each tab has a fixed header order defined in `backend/database/sheets-engine.js`. The engine performs real Google Sheets API reads/appends/updates; it does not use an in-memory mock database.

## Initialization
Create the spreadsheet, create the twelve tabs, and put the exact header row from `SHEETS` in each tab. Then set `GOOGLE_SPREADSHEET_ID` as a Cloudflare Worker secret/variable.

## Security
OAuth refresh tokens and AI API keys are runtime secrets. They must never be stored in Git, frontend code, chat messages, or logs.
