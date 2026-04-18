# AI Model Router — Team Structure

This document defines the roles needed to run **AI Model Router** as a living open-source product. Each role has a corresponding GitHub issue with skills, responsibilities, and a first task.

---

## Org chart

```
Project Lead (Ossama Hashim)
├── AI Research Lead         → issue #1
├── Full-Stack Developer      → issue #2
├── DevOps / CI Engineer     → issue #3
├── UX / Design Lead         → issue #4
├── Community Manager        → issue #5
└── Technical Writer         → issue #6
```

---

## Roles at a glance

| Role | Core skill | Owns |
|---|---|---|
| AI Research Lead | Frontier model ecosystem, benchmark reading | `data/models.json`, `RESEARCH.md` |
| Full-Stack Developer | Vanilla JS, CSS custom properties, Chart.js | `index.html` UI and calculator logic |
| DevOps / CI Engineer | GitHub Actions, Pages, JSON schema validation | `.github/workflows/pages.yml` |
| UX / Design Lead | CSS design systems, accessibility, data visualization | Visual system, mobile, charts |
| Community Manager | Technical writing, Reddit, HN, dev.to, LinkedIn | Launch posts, engagement, feedback triage |
| Technical Writer | Markdown, API/data documentation | `README.md`, `CONTRIBUTING.md`, schema docs |

---

## Contribution model

This project has **no backend** and **no build step**. Every role can contribute directly on GitHub:

- Research: edit `data/models.json` on GitHub.com, commit, CI validates and deploys automatically
- Dev: fork → edit `index.html` → open PR
- DevOps: edit `.github/workflows/pages.yml`
- Docs: edit any `.md` file directly

## Decision protocol

- Data changes (pricing, benchmarks): AI Research Lead approves
- UI changes: Full-Stack Dev + UX Lead review required
- Schema changes: All roles affected must sign off in PR before merge
- Community posts: Project Lead reviews before publishing

## Communication

All coordination happens via GitHub Issues and PR comments. No external Slack, Discord, or project management tool is required at this team size.
