# System Architecture Reference

```text
USER
  ↓
GITHUB PAGES FRONTEND
  ↓
CLOUDFLARE WORKERS API LAYER
  ├── Request Router
  ├── AI / Agent Boundary
  ├── Tool Integration Boundary
  ├── Security / Permission Boundary
  └── Real-time Event Boundary
  ↓
AI PROVIDERS + GOOGLE SERVICES
  ↓
GOOGLE SHEETS DATA LAYER
  ↓
TASK / RESULT / LOG / CHAT / MEMORY STATE
```

## Architectural rule

AI Chat and Manual Control must call the same underlying service functions and Execution Engine. Business logic must not be duplicated between interfaces.
