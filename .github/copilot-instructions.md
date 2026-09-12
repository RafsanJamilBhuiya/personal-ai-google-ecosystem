# GitHub Copilot project instructions

This repository is a separate project: Personal AI + Google Ecosystem. Do not merge it with older repositories or projects.

## Rules
- Preserve the single-user architecture.
- Frontend: static HTML/CSS/JavaScript; backend: Cloudflare Workers.
- Google Sheets is the logical primary database.
- AI Chat and Manual Control must share backend service functions and the Execution Engine.
- Never place credentials, API keys, OAuth secrets or tokens in source files.
- Prefer small, testable modules and Web-standard APIs.
- Do not call a feature complete unless it is implemented, integrated, tested and live-validated where external credentials are required.
- Keep documentation and implementation-status records synchronized.
- Before changing architecture, read docs/MASTER-PROJECT-DOCUMENTATION.md and docs/architecture.md.
