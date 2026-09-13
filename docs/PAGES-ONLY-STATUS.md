# Pages-only status

A browser-only runtime entry has been added. It uses GitHub Pages for hosting and browser localStorage for local state; it does not require Cloudflare for rendering or local task/chat operation.

The main application still contains backend-dependent features. Those features cannot be made server-secure on GitHub Pages alone because Pages is static hosting.