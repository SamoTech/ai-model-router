# AI Model Router

> **Live site → [samotech.github.io/ai-model-router](https://samotech.github.io/ai-model-router/)**

Route AI workloads to the right model. All model data lives in `data/models.json` — update it and the dashboard re-renders automatically.

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
  "contextWindow": "High-scale efficient class",  // free-text shown in value matrix

  // --- Routing ---
  "bestAt":      "Cheap traffic, extraction, classification",

  // --- Verdict badge ---
  // verdict controls badge color:  "good" (green) | "warn" (amber) | "bad" (red)
  "verdict":      "good",
  "verdictLabel": "Secret best deal",
  "take":         "The sensible default for high-volume production unless quality gaps become measurable.",

  // --- Benchmark snapshot (any key → string value) ---
  "benchmarks": {
    "SWEBenchVerified": "80.84%",
    "TerminalBench2":   "65.4%",
    "OSWorld":          "72.7%"
  },

  // --- Radar chart (integer 0-10, all five keys required) ---
  "radar": {
    "coding":         5,
    "longContext":     6,
    "voice":          4,
    "computerUse":    4,
    "costEfficiency": 10
  },

  // --- Chart color ---
  "color": "#89c166"   // hex, used in radar + bar chart datasets
}
```

### Required fields

Every entry must have these or the CI validation step will reject the push:

```
id  name  provider  contextWindow  bestAt  verdict  verdictLabel  take
```

All pricing fields (`inputRate`, `outputRate`, etc.) are optional and may be `null` for self-hosted models.

### Adding a new model

1. Copy an existing entry in `data/models.json`
2. Fill in all required fields and any applicable pricing fields
3. Pick a unique `color` hex not already used in the file
4. Set `radar` scores (0–10) across all five dimensions
5. Push to `main` — the CI workflow validates the schema and redeploys Pages automatically

---

## Repository structure

```
ai-model-router/
├── index.html                   # Dashboard UI — reads data/models.json at runtime
├── data/
│   └── models.json              # Source of truth for all model data
├── .github/
│   └── workflows/
│       └── pages.yml            # JSON validation + GitHub Pages deploy
├── .nojekyll                    # Disables Jekyll processing
└── README.md
```

---

## Local preview

```bash
npx serve .
# or
python -m http.server 8080
```

Open `http://localhost:8080`. Do **not** open `index.html` as a `file://` URL — the JSON fetch will be blocked by browser CORS policy.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | Vanilla HTML + CSS custom properties |
| Charts | Chart.js 4.4 (CDN) |
| Icons | Lucide (CDN) |
| Fonts | Cabinet Grotesk + Satoshi via Fontshare |
| Data | `data/models.json` (static, fetched at runtime) |
| Hosting | GitHub Pages — `https://samotech.github.io/ai-model-router/` |
| CI | GitHub Actions (`pages.yml`) |
