# Copilot collaboration

GitHub Copilot can be used as a local agent to implement the remaining integration work. This repository includes `.github/copilot-instructions.md` so Copilot receives the project boundaries automatically.

Recommended workflow: clone the repository, open it in VS Code with Copilot Agent mode or run Copilot CLI, review its plan, then allow edits/tests. Use small verified milestones for OAuth, Sheets, AI providers, execution, realtime and deployment.

Example CLI prompt:

`copilot -p "Read docs/MASTER-PROJECT-DOCUMENTATION.md, docs/architecture.md and .github/copilot-instructions.md. Audit the current implementation, implement the next missing milestone without changing the architecture, run tests, and report every changed file and validation result."`

Never give Copilot credentials in prompts. Configure secrets through the platform's secret management.
