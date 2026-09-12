# Personal AI + Google Ecosystem

Single-user AI chat and Google-services automation platform. Frontend is static HTML/CSS/JS; backend is a Cloudflare Worker; Google Sheets is the logical primary database.

## Status
This repository now contains the executable foundation and application contracts. Live Google OAuth, API keys, Cloudflare deployment and provider credentials must be configured outside source control before production validation.

## Safety boundary
Never commit API keys, OAuth client secrets, access tokens, refresh tokens or private credentials. Use Cloudflare secrets/environment configuration.

## Local
Node.js 22+ is recommended. Run `npm install`, then `npm run check` and `npm test`. `npm run dev` starts the Worker through Wrangler.

## Architecture
User → static frontend → Worker API → router → permission/command layer → AI/Google service adapters → execution/result formatter → database/realtime events.

AI Chat and Manual Control are designed to call the same backend command/execution contracts.
