# GitHub Pages-only activation

## Active runtime

The project now includes a Pages-only browser runtime. It does not call the Cloudflare Worker and can run from GitHub Pages as a static site.

## Browser capabilities

- UI and JavaScript execution
- Local task state
- Local chat history
- Local runtime status
- Google client-side OAuth/API integration can be added using a Web OAuth client

## Deliberate boundary

GitHub Pages cannot execute server-side code. Secure server-side API-key storage, protected proxy endpoints, webhooks, and server-side token refresh therefore remain unavailable in Pages-only mode.

## Deployment

The existing GitHub Pages Actions workflow remains the deployment mechanism. No Cloudflare deployment is required for this runtime path.
