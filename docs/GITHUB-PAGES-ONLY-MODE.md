# GitHub Pages-only Mode

This mode runs the Personal AI + Google Ecosystem frontend without Cloudflare or another backend hosting platform.

## What is active

- GitHub Pages hosts the complete static frontend.
- HTML/CSS/JavaScript execute in the browser.
- Browser localStorage is used for local task/chat state.
- GitHub Pages Actions publishes the site.
- No Cloudflare Worker is required for the Pages-only UI runtime.

## What cannot be safely moved into static Pages alone

GitHub Pages cannot execute server-side code. Therefore backend-only capabilities such as server-side secret storage, protected API proxying, webhook endpoints, server-side refresh-token storage, and secure AI-provider API-key handling are not part of Pages-only mode.

Google web OAuth can still be performed from JavaScript with a web OAuth client because Google documents client-side JavaScript OAuth and states that client secrets are not used for web applications. Required APIs/scopes must be configured in Google Cloud, and the GitHub Pages origin must be authorized.

## Runtime

`window.PersonalAIPages.mode = github-pages-only`

`backend = false`

`storage = localStorage`
