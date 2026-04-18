# Security Policy

## Scope

This project is a static HTML dashboard with no server-side code, no authentication, no database, and no user data collection. There is no backend attack surface.

That said, the following are in scope for responsible disclosure:

- Malicious content injected via `data/models.json` that could result in XSS when rendered in the dashboard
- Supply chain issues with CDN-loaded libraries (Chart.js, Lucide, Tailwind)
- Workflow file changes that could compromise the GitHub Actions deploy pipeline

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security concerns.

Instead, open a [GitHub Security Advisory](https://github.com/SamoTech/ai-model-router/security/advisories/new) (private disclosure) or email the maintainer directly.

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- A suggested fix if you have one

We aim to respond within 48 hours and resolve confirmed issues within 7 days.

## Supported versions

Only the current `main` branch is actively maintained.
