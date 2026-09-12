# Security Boundary

## Never commit

- API keys
- OAuth client secrets
- Access/refresh tokens
- Private keys
- Passwords
- Service-account credential files
- Sensitive personal data

## Required controls

1. Runtime secret storage
2. Input validation
3. Permission checks before tool execution
4. Sensitive-value filtering in logs
5. Safe error responses
6. Least-privilege OAuth scopes where practical
7. Clear separation of public frontend configuration and backend secrets
