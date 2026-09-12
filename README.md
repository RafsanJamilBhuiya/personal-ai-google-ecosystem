# Personal AI + Google Services Ecosystem

A single-user personal AI automation platform built around GitHub, GitHub Pages, Cloudflare Workers, Google APIs, Google Sheets, and multiple AI providers.

## Repository Boundary

This repository is the implementation home for the **Personal AI + Google Ecosystem** project. It is a completely new and separate project. Previous projects and repositories are not part of this repository's scope.

## Current Stage

**Foundation / Repository Structure Stage**

The repository is being organized professionally before application source-code implementation begins.

### Structure-first rules

- Establish the complete repository structure before application coding.
- Define documentation, configuration, infrastructure, data-design, testing, and deployment boundaries first.
- Never commit passwords, API keys, OAuth client secrets, access tokens, refresh tokens, or other private credentials.
- Keep empty implementation areas explicit with non-code documentation markers.
- Do not treat the presence of a file or directory as proof that its functional implementation is complete.

## Core Architecture

```text
User
  -> GitHub Pages Frontend
  -> Cloudflare Workers API Layer
  -> AI Provider Layer + Google Services Layer
  -> Google Sheets Data Layer
  -> Execution / Result / Real-time Flow
```

## Main Areas

- `docs/` — project documentation and implementation references
- `frontend/` — frontend structure and future UI implementation
- `backend/` — backend service boundaries and future Worker implementation
- `database/` — Google Sheets database design and schema references
- `config/` — non-secret project configuration references
- `scripts/` — future operational/setup script boundaries
- `tests/` — future validation and automated-test structure
- `.github/` — repository automation and CI/CD structure
- `infrastructure/` — GitHub, Cloudflare, and Google infrastructure references
- `public/` — public/static supporting assets

## Non-code Foundation Scope

The initial foundation covers repository organization, documentation boundaries, configuration placeholders, environment-variable documentation, database-design references, infrastructure references, security boundaries, deployment planning, and implementation checklists.

Application source code is intentionally outside this structure-only milestone.

## Security Boundary

No credential, token, secret, private key, or API key belongs in public source control. Runtime secrets must be supplied through the appropriate secret-management mechanism during later implementation and deployment.

## Source of Truth

The project's Master Project Documentation defines the intended architecture, scope, setup, implementation phases, testing, security, and production validation requirements.
