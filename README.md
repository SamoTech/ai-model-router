<div align="center">

# 🔀 AI Model Router

**Route AI workloads to the right model — not just the loudest one.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-samotech.github.io-01696f?style=for-the-badge&logo=github)](https://samotech.github.io/ai-model-router/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-222?style=for-the-badge&logo=github)](https://samotech.github.io/ai-model-router/)
[![CI](https://img.shields.io/github/actions/workflow/status/SamoTech/ai-model-router/pages.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/SamoTech/ai-model-router/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![Maintained](https://img.shields.io/badge/Maintained-yes-01696f?style=for-the-badge)](https://github.com/SamoTech/ai-model-router/commits/main)

<br />

> Compare GPT-5.4, Claude Opus 4.6, Gemini 3.1 Flash-Lite, Gemini Flash Live, and open models.<br />
> Interactive cost calculator · Shareable URL state · No build step · Zero backend.

[**→ Open the dashboard**](https://samotech.github.io/ai-model-router/)

</div>

---

## Why this exists

Every week a new frontier model drops claiming to be the best. In practice:

- **GPT-5.4** is genuinely good at computer use and giant context — but overpriced for everyday traffic
- **Claude Opus 4.6** leads on coding agents — but at $5/$25 per 1M it is expensive unless failures are costly
- **Gemini 3.1 Flash-Lite** is the best-kept secret for bulk production traffic at $0.25/$1.50 per 1M
- **Open models** win when you have infra, privacy requirements, or fine-tuning needs

This dashboard makes those tradeoffs explicit with a workload router, a live cost calculator, and a value matrix pulled from a single JSON file.

---

## Features

| Feature | Detail |
|---|---|
| 🗺️ Workload router | Maps coding / long-context / voice / computer-use / bulk traffic to winner + runner-up |
| 💰 Cost calculator | Monthly spend per model; GPT-5.4 long-context surcharge logic built in |
| 🔗 Shareable state | Calculator inputs sync to URL hash — bookmark or share any scenario |
| 📊 Radar scorecard | 5-dimension routing heuristic chart per model |
| 🏷️ Value matrix | Per-model verdict badge (overpriced / worth it selectively / best deal) |
| 🌗 Light + dark mode | Follows system preference with manual toggle |
| 📦 Data-driven | All model data in `data/models.json` — update prices without touching the UI |
| ⚡ Zero build step | Pure static HTML + JSON; works on any CDN or file server |

---

## `data/models.json` schema

Top-level shape:

```jsonc
{
  "updated": "YYYY-MM-DD",   // shown in the dashboard Data status panel
  "models": [ /* ModelEntry[] */ ]
}
```

### ModelEntry

```jsonc
{
  // --- Identity ---
  "id":           "gemini-3-1-flash-lite",   // unique kebab-case slug
  "name":         "Gemini 3.1 Flash-Lite",   // display name in all UI
  "provider":     "Google",                   // OpenAI | Anthropic | Google | Open / self-host

  // --- Pricing (USD per 1M tokens, null for self-hosted / unknown) ---
  "inputRate":              0.25,
  "outputRate":             1.50,
  "longContextInputRate":   5.00,   // optional — surcharge rate (GPT-5.4 only)
  "longContextThreshold":   272000, // optional — token count where surcharge activates
  "audioInputRate":         3.00,   // optional — Flash Live only
  "audioOutputRate":        12.00,  // optional — Flash Live only
  "perMinute":              0.018,  // optional — voice cost per minute

  // --- Context ---
  "contextWindow": "High-scale efficient class",

  // --- Routing ---
  "bestAt": "Cheap traffic, extraction, classification",

  // --- Verdict badge ---
  // "good" → green  |  "warn" → amber  |  "bad" → red
  "verdict":      "good",
  "verdictLabel": "Secret best deal",
  "take":         "The sensible default for high-volume production unless quality gaps become measurable.",

  // --- Benchmark snapshot (any key → string value) ---
  "benchmarks": {
    "SWEBenchVerified": "80.84%",
    "TerminalBench2":   "65.4%",
    "OSWorld":          "72.7%"
  },

  // --- Radar chart scores (integer 0–10, all five keys required) ---
  "radar": {
    "coding":         5,
    "longContext":     6,
    "voice":          4,
    "computerUse":    4,
    "costEfficiency": 10
  },

  "color": "#89c166"   // hex used in radar + bar chart datasets
}
```

### Required fields

Every entry must include these or the CI validation job will block the push:

```
id  name  provider  contextWindow  bestAt  verdict  verdictLabel  take
```

### Adding a new model

1. Copy an existing entry in `data/models.json`
2. Fill in all required fields and any known pricing fields (`null` is fine for self-hosted)
3. Pick a unique `color` hex not already used in the file
4. Set all five `radar` scores (0–10)
5. Push to `main` — CI validates the schema and redeploys Pages automatically

---

## Repository structure

```
ai-model-router/
├── index.html                   # Dashboard UI — fetches data/models.json at runtime
├── data/
│   └── models.json              # ✏️  Source of truth — edit this to update the dashboard
├── .github/
│   └── workflows/
│       └── pages.yml            # JSON schema validation + GitHub Pages deploy
├── .nojekyll                    # Disables Jekyll so the site is served as-is
├── LICENSE                      # MIT
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

---

## Local preview

```bash
# Option 1
npx serve .

# Option 2
python -m http.server 8080
```

Open `http://localhost:8080`.

> ⚠️ Do **not** open `index.html` as a `file://` URL — the `fetch('./data/models.json')` call will be blocked by browser CORS policy on local file URLs.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | Vanilla HTML + CSS custom properties |
| Charts | [Chart.js 4.4](https://www.chartjs.org/) via CDN |
| Icons | [Lucide](https://lucide.dev/) via CDN |
| Fonts | Cabinet Grotesk + Satoshi via [Fontshare](https://www.fontshare.com/) |
| Data | `data/models.json` — static, fetched at runtime |
| Hosting | [GitHub Pages](https://pages.github.com/) |
| CI | [GitHub Actions](https://github.com/features/actions) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The fastest contribution is editing a price or verdict directly in `data/models.json` on GitHub and committing — no local setup needed.

## Security

See [SECURITY.md](SECURITY.md). This project has no backend or user data. Responsible disclosure goes to a GitHub Security Advisory (private).

## License

[MIT](LICENSE) © 2026 [SamoTech](https://github.com/SamoTech)
