<div align="center">

<img src="./assets/banner.svg" alt="AI Model Router — Route workloads to the right model, not just the loudest one" width="100%" />

<br /><br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-samotech.github.io-01696f?style=for-the-badge&logo=github)](https://samotech.github.io/ai-model-router/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-222?style=for-the-badge&logo=github)](https://samotech.github.io/ai-model-router/)
[![CI](https://img.shields.io/github/actions/workflow/status/SamoTech/ai-model-router/pages.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/SamoTech/ai-model-router/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![Maintained](https://img.shields.io/badge/Maintained-yes-01696f?style=for-the-badge)](https://github.com/SamoTech/ai-model-router/commits/main)

<br />

> Compare 21 models across OpenAI, Anthropic, Google, Mistral, Cohere, xAI, Meta and open-weight providers.<br />
> Interactive cost calculator · Shareable URL state · No build step · Zero backend.

[**→ Open the dashboard**](https://samotech.github.io/ai-model-router/)

</div>

---

## Why this exists

Every week a new frontier model drops claiming to be the best. In practice:

- **GPT-4.1 / 4.1 Mini / 4.1 Nano** are the new OpenAI workhorse tier — from $2 down to $0.10 input per 1M, covering everything from agent coding to bulk classification
- **o4-mini** delivers near-o3 reasoning at $1.10/$4.40 per 1M — the best reasoning-to-cost ratio in the OpenAI lineup
- **Claude Sonnet 4.5** sits between Haiku 4 and Opus 4.6 at $3/$15 — the pragmatic Anthropic default for most coding and writing work
- **Gemini 2.5 Pro** matches or beats Claude Sonnet on coding at $1.25/$10 with a 1M context window
- **Gemini 2.5 Flash** at $0.15/$0.60 is the new speed-value sweet spot for medium-complexity workloads
- **Gemini 3.1 Flash-Lite** dropped to $0.10/$0.40 — the best-kept secret for bulk production traffic
- **Open models** (Llama 4 Maverick, DeepSeek, Qwen) win when you have infra, privacy requirements, or fine-tuning needs

This dashboard makes those tradeoffs explicit with a workload router, a live cost calculator, and a value matrix pulled from a single JSON file.

---

## Models covered (April 2026)

| Provider | Models |
|---|---|
| **OpenAI** | GPT-5.4, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o3, o4-mini |
| **Anthropic** | Claude Opus 4.6, Claude Sonnet 4.5, Claude Haiku 4 |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 3.1 Flash-Lite, Gemini Flash Live |
| **Mistral** | Mistral Medium 3, Mistral Small 3.1 |
| **Cohere** | Command A, Command R+ |
| **xAI** | Grok 3 |
| **Meta / open** | Llama 4 Maverick |
| **Open / self-host** | DeepSeek reasoning class, Qwen coding class |

---

## Features

| Feature | Detail |
|---|---|
| 🗺️ Workload router | Maps coding / long-context / voice / computer-use / bulk traffic to winner + runner-up |
| 💰 Cost calculator | Monthly spend per model; long-context surcharge logic built in |
| 🔗 Shareable state | Calculator inputs sync to URL hash — bookmark or share any scenario |
| 📊 Radar scorecard | 5-dimension routing heuristic chart per model |
| 🏷️ Value matrix | Per-model verdict badge (overpriced / worth it selectively / best deal) |
| 🌗 Light + dark mode | Follows system preference with manual toggle |
| 📦 Data-driven | All model data in `data/models.json` — update prices without touching the UI |
| ⚡ Zero build step | Pure static HTML + JSON; works on any CDN or file server |

---

## Changelog

### v1.1.1 — April 2026 (performance)
- Disabled Chart.js animations (`animation: false`, `update('none')`) to eliminate main-thread blocking on rapid redraws
- Added 300 ms debounce on all calculator inputs — no more per-keystroke chart redraws
- Fixed chart canvas container height to prevent layout thrash on resize
- Pinned Lucide to `0.469.0` on jsDelivr for instant CDN cache hits

### v1.1.0 — April 2026 (review fixes)
- Accessibility, validation, radar selector, theme init, cache strategy, and 9 additional review items resolved

### v1.0.0 — April 2026
- Initial release with 10 models

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
  "id":           "gemini-2-5-flash",         // unique kebab-case slug
  "name":         "Gemini 2.5 Flash",          // display name in all UI
  "provider":     "Google",                    // OpenAI | Anthropic | Google | Mistral | Cohere | xAI | Meta / hosted vendors | Open / self-host

  // --- Pricing (USD per 1M tokens, null for self-hosted / unknown) ---
  "inputRate":              0.15,
  "outputRate":             0.60,
  "longContextInputRate":   2.50,   // optional — surcharge rate above threshold
  "longContextThreshold":   200000, // optional — token count where surcharge activates
  "audioInputRate":         3.00,   // optional — voice models only
  "audioOutputRate":        12.00,  // optional — voice models only
  "perMinute":              0.018,  // optional — voice cost per minute

  // --- Context ---
  "contextWindow": "1M tokens",

  // --- Routing ---
  "bestAt": "Fast, cost-effective general tasks",

  // --- Verdict badge ---
  // "good" → green  |  "warn" → amber  |  "bad" → red
  "verdict":      "good",
  "verdictLabel": "Speed + value",
  "take":         "Excellent price-performance. Beats Flash-Lite on quality while remaining far cheaper than Pro.",

  // --- Benchmark snapshot (any key → string value) ---
  "benchmarks": {
    "MMLU": "85.1%"
  },

  // --- Radar chart scores (integer 0–10, all five keys required) ---
  "radar": {
    "coding":         7,
    "longContext":     8,
    "voice":          5,
    "computerUse":    5,
    "costEfficiency": 9
  },

  "color": "#52c26a"   // hex used in radar + bar chart datasets
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
├── assets/
│   ├── logo.svg                 # 48×48 brand mark
│   ├── favicon.svg              # 32×32 browser tab icon
│   └── banner.svg               # 1280×640 GitHub social preview
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
| Icons | [Lucide 0.469.0](https://lucide.dev/) via jsDelivr |
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
