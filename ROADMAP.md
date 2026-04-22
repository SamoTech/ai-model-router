# Roadmap

This file is the single source of truth for what has shipped and what comes next.
Check off items as they land on `main`. Add new items under the relevant milestone.

---

## ✅ Shipped

### v1.0.0 — Initial release
- [x] Dashboard UI — workload router, cost calculator, radar scorecard, value matrix
- [x] Shareable URL state (calculator inputs sync to hash)
- [x] Light + dark mode with system-preference detection and manual toggle
- [x] 10 models in `data/models.json`
- [x] GitHub Pages deployment via `pages.yml` CI workflow
- [x] JSON schema validation in CI (blocks bad pushes)
- [x] `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `TEAM.md`
- [x] SVG logo, favicon, social preview banner

### v1.1.0 — Review fixes
- [x] Accessibility audit fixes (semantic HTML, aria-labels, focus rings)
- [x] Form validation improvements
- [x] Radar selector bug fix
- [x] Theme init on first paint (no flash of wrong theme)
- [x] Cache strategy improvements
- [x] 9 additional review items resolved

### v1.1.1 — Performance
- [x] Disabled Chart.js animations (`animation: false`, `update('none')`)
- [x] 300 ms debounce on all calculator inputs
- [x] Fixed chart canvas container height (no layout thrash on resize)
- [x] Pinned Lucide to `0.469.0` on jsDelivr

### v1.2.0 — Model expansion + pricing refresh (April 2026)
- [x] Added 11 new models: GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o3, o4-mini, Claude Sonnet 4.5, Claude Haiku 4, Gemini 2.5 Pro, Gemini 2.5 Flash, Mistral Small 3.1, Command A
- [x] Updated pricing on all existing models to April 2026 rates
- [x] Total model count: 10 → 21
- [x] Updated `README.md` with full provider/model table and changelog section

### v1.3.1 — Data freshness + schema cleanup (April 2026)
- [x] "Data last updated" badge reads `updated` field from `models.json`
- [x] CI JSON schema updated to accept optional fields (`longContextThreshold`, `audioInputRate`, `audioOutputRate`, `perMinute`)
- [x] `CONTRIBUTING.md` updated to reflect 21-model scope

---

## 🔥 v1.3.2 — Filters and navigation (next)

> Goal: make the 21-model list scannable without scrolling through every card.

- [ ] Provider filter bar (OpenAI / Anthropic / Google / Mistral / Cohere / xAI / Open)
- [ ] Verdict filter toggle (good / warn / bad)
- [ ] Empty state when filters return no models
- [ ] Keep filter state shareable in the URL hash

---

## 📊 v1.3.3 — Cost chart clarity

> Goal: fix the linear scale breaking when o3 ($40) and Flash-Lite ($0.10) share the same axis.

- [ ] Add log-scale toggle for the monthly cost bar chart
- [ ] Make zero/near-zero values safe in log mode (clamp to a minimum positive floor)
- [ ] Add helper text explaining why log mode exists
- [ ] Confirm the chart still reads clearly in dark mode

---

## 📊 v1.3.4 — Final QA and polish

- [ ] Verify all 21 model cards render correctly (colors, radar scores, verdict badges)
- [ ] Verify radar selection still works across the expanded model set
- [ ] Check mobile layout with long model names
- [ ] Check dark mode contrast for new colors and badges
- [ ] Update `ROADMAP.md` checkboxes after each merge

---

## 📊 v1.4.0 — Richer comparison tools

- [ ] Benchmark tab — surface `benchmarks` object per model in a dedicated panel
- [ ] "Best for my budget" quick filter — user sets monthly budget, highlights fitting models
- [ ] Side-by-side model comparison (select 2–3 models, compare radar + pricing in a table)
- [ ] Cost-per-task presets (e.g. "summarise 10K docs/day", "code review pipeline") that pre-fill the calculator

---

## 🛠️ v1.5.0 — Maintenance & DX

- [ ] Auto-pricing sync — GitHub Actions scheduled workflow that pings OpenRouter pricing endpoint and opens a PR when rates change
- [ ] `data/models.json` changelog — track per-model price history in a separate `data/history.json`
- [ ] Stale-data warning — CI comment on PRs if `updated` date in `models.json` is >30 days old
- [ ] Dependabot for CDN versions (Chart.js, Lucide)

---

## 🚀 v2.0.0 — Embed & integrations

- [ ] Embed mode — `?embed=1` strips nav, renders just the calculator for blog/docs use
- [ ] API route suggestions — exportable JSON config mapping workload types to recommended model IDs
- [ ] OpenRouter integration — live pricing pulled at runtime with a fallback to `models.json`
- [ ] i18n scaffold — Arabic (RTL) + English as first two locales

---

## 💡 Backlog (unscheduled)

- [ ] Dark mode radar chart color adjustments for improved contrast
- [ ] Mobile bottom sheet for model detail (replaces inline expand on small screens)
- [ ] Keyboard shortcut help modal (`?` key)
- [ ] Print / PDF export of cost comparison
- [ ] GitHub Discussions for community model suggestions

---

_Last updated: 2026-04-22_
