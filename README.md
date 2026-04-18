# AI Model Router

> **Live site → [samotech.github.io/ai-model-router](https://samotech.github.io/ai-model-router/)**

A production-style static dashboard for routing AI workloads to the right model. Covers GPT-5.4, Claude Opus 4.6, Gemini 3.1 Flash-Lite, Gemini Flash Live, and leading open-model classes.

---

## Features

- **Workload router** — coding agents, long-context research, voice, computer use, cost-sensitive traffic
- **Interactive cost calculator** — monthly spend estimate per model with GPT-5.4 long-context surcharge logic
- **Shareable calculator state** — inputs are synced to the URL hash so any scenario can be bookmarked or shared
- **Value matrix** — per-model verdict (overpriced / worth it selectively / best deal) with plain-language take
- **Benchmark snapshot** — SWE-Bench, Terminal-Bench, OSWorld numbers per model
- **Light + dark mode** — follows system preference with manual toggle
- **Data-driven** — all model data lives in `data/models.json`; update prices and verdicts without touching the UI

---

## Repository structure

```
ai-model-router/
├── index.html                  # Dashboard UI — fetches data/models.json at runtime
├── data/
│   └── models.json             # All model pricing, verdicts, radar scores, benchmarks
├── .github/
│   └── workflows/
│       └── pages.yml           # Validates models.json then deploys to GitHub Pages
├── .nojekyll                   # Disables Jekyll so the site is served as-is
└── README.md
```

---

## Updating model data

All pricing and verdict changes are made in **`data/models.json`** only. The UI re-renders on every page load from this file.

Fields per model entry:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique slug |
| `name` | string | Display name |
| `provider` | string | OpenAI / Anthropic / Google / Open / self-host |
| `inputRate` | number \| null | USD per 1M input tokens; null for self-hosted |
| `outputRate` | number \| null | USD per 1M output tokens |
| `longContextInputRate` | number | GPT-5.4 only — higher rate beyond threshold |
| `longContextThreshold` | number | Token count where surcharge kicks in |
| `contextWindow` | string | Human-readable context size |
| `color` | string | Hex used in charts |
| `bestAt` | string | One-line use-case summary |
| `verdict` | `"good"` \| `"warn"` \| `"bad"` | Controls badge color |
| `verdictLabel` | string | Badge text |
| `take` | string | Plain-language routing advice |
| `benchmarks` | object | Key → value pairs shown in snapshot section |
| `radar` | object | Scores (0–10) for coding / longContext / voice / computerUse / costEfficiency |

---

## CI / Deploy

The `.github/workflows/pages.yml` workflow runs on every push to `main`:

1. **Validate** — runs a Python schema check on `data/models.json` to catch missing required fields before anything ships
2. **Deploy** — uploads the repo root as a Pages artifact and deploys to `https://samotech.github.io/ai-model-router/`

No build step required. The site is pure static HTML + a JSON fetch.

---

## Local preview

```bash
# Any static file server works — here are two options:
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`.

> Note: opening `index.html` directly as a `file://` URL will fail because `fetch('./data/models.json')` is blocked by browser CORS policy on local file URLs. Use a local server instead.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI framework | Vanilla HTML + CSS custom properties |
| Charts | Chart.js 4.4 via CDN |
| Icons | Lucide via CDN |
| Fonts | Cabinet Grotesk + Satoshi (Fontshare) |
| Data | Static JSON (`data/models.json`) |
| Hosting | GitHub Pages (root of `main` branch) |
| CI | GitHub Actions |
