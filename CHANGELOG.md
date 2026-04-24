# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed
- **Split `index.html` into three files: `index.html` + `assets/styles.css` + `assets/app.js`** (loaded with `defer`). The `<style>` block (267 lines) and the main `<script>` block (476 lines) were extracted verbatim. Browser caching, sourcemap-readiness, and DevTools editing are all materially better. To prevent a flash-of-unstyled-theme on cold load, a tiny ~340-byte inline `<script>` in `<head>` synchronously reads the stored theme and applies `data-theme` on `<html>` before paint; the rest of the theme code lives in `app.js`.
- **Tightened CSP `script-src`: dropped `'unsafe-inline'`.** With all app JS now external, `script-src` is `'self' 'sha256-n+ktr0bQsfq5R1rL3aqXtp6k6QdevtQRa6o//2PzlX0=' https://cdn.jsdelivr.net`. The hash whitelists exactly the inline theme bootstrap; arbitrary inline `<script>` blocks are now blocked even if a contributor adds one. `style-src` still allows `'unsafe-inline'` because the HTML uses inline `style="…"` attributes; CSS injection risk is materially lower than JS injection, so this is an acceptable trade-off.
- **`CONTRIBUTING.md` updated** to document the new file layout and the rule that new inline scripts require a CSP hash update.

### Fixed
- **Shared/bookmarked URLs now restore filters correctly on initial load.** Previously, opening `…/#provider=OpenAI&inputTokens=…` would silently drop the `provider`/`verdict` params: `loadData()` called `calculateCosts()` before `applyFilterFromHash()`, and `calculateCosts` ended with `syncHash()`, which `replaceState`-d the URL using only calculator params (since `filterProvider` / `filterVerdict` were still `null`). By the time `applyFilterFromHash` read `location.hash`, the filter params had already been overwritten. Now `calculateCosts({ skipHashSync: true })` defers the URL write until after filters are applied. (Caught by Devin Review on PR #10; previously broke the dashboard's documented "shareable scenario" feature.)
- **`hashchange` listener no longer leaves stale filter state** when navigating to a hash without `provider`/`verdict` params. Previously, activating a filter, then pressing back to a filter-less hash, would leave the filter active in state — and the subsequent `calculateCosts()` would `replaceState` the stale filter back into the URL, corrupting the history entry. `applyFilterFromHash` now resets `filterProvider`/`filterVerdict` to `null` before applying, and the hashchange handler passes `applyOnly: true` plus `skipHashSync: true` so we never `replaceState` from inside a hashchange. (Caught by Devin Review on PR #8.)
- **`CONTRIBUTING.md`** corrected to reflect the actual two CDN libraries (Chart.js + Lucide); Tailwind was removed in PR #8 but the doc still listed it.

### Security
- **XSS hardening of `data/models.json` rendering** — every JSON-sourced field (`name`, `provider`, `bestAt`, `take`, `verdictLabel`, `contextWindow`, benchmark keys/values, calculator rows, error messages) is now passed through an `esc()` helper before `innerHTML` interpolation. Previously, a contributor could have injected HTML via fields like `take` and executed JS on every visitor. `verdictBadge` whitelists the verdict CSS class against `good|warn|bad` instead of interpolating raw.
- **Content Security Policy** — added a meta CSP restricting scripts to `self` + `cdn.jsdelivr.net`, styles to `self` + `fontshare`, fonts to `fontshare`, with `frame-ancestors 'none'` and `form-action 'none'`.
- **Subresource Integrity (SRI)** — Chart.js and Lucide CDN scripts now load with `integrity=` (sha-384) and `crossorigin="anonymous"` attributes; `referrerpolicy="no-referrer"` set on both.
- **Removed Tailwind Play CDN** — `cdn.tailwindcss.com` ships a 300 KB JIT compiler explicitly not for production. Verified zero Tailwind utility classes were actually in use; layout is custom CSS only.
- **`scripts/validate-models.mjs`** — single source of truth for `data/models.json` validation. Includes an XSS-character scan that rejects `<`, `>`, `javascript:`, and `data:text/html` in user-facing string fields at the data layer.
- **`validate.yml`** — added explicit `permissions: contents: read` (was inheriting repo defaults).

### Added
- `RESEARCH.md` — pricing sources, benchmark methodology notes, and full 21-model audit
- `docs/ci.md` — full CI pipeline documentation covering all three jobs (`validate`, `deploy`, `health-check`)
- `docs/adding-a-model.md` — step-by-step contributor guide for adding new entries to `data/models.json`
- `.htmlhintrc` — HTML lint configuration for CI
- `scripts/validate-models.mjs` — consolidated JSON validator used by both workflows
- `tests/calculator.test.mjs` — unit tests for cost-calculator math (long-context tiering, voice pricing, self-host exclusion)
- `tests/validate-models.test.mjs` — end-to-end tests for the JSON validator

### Changed
- **Theme persists to `localStorage`** — explicit theme picks now survive page refresh; falls back to `prefers-color-scheme` only when no stored preference exists.
- **`hashchange` listener** — back/forward navigation across filter and calculator state now reflects in the UI (was previously ignored).
- **`pages.yml`** — both workflows now invoke `scripts/validate-models.mjs` and run `node --test 'tests/*.test.mjs'`. The dead "write `.htmlhintrc` if missing" step was removed (it ran *after* the lint step that consumed it). Removed `|| true` from the htmlhint step so HTML lint failures actually block the deploy. Pages artifact now contains only `index.html`, `assets/`, `data/`, `.nojekyll` instead of the entire repo root.
- **Client-side `validateEntry`** — now mirrors the server validator: requires `color` and `radar`, validates color format (`/^#[rrggbb]$/`), validates radar values are integers in `[0, 10]`, validates verdict is one of `good|warn|bad`.

### Fixed
- `m.longContextInputRate ? …` interpolation guard now uses `!= null` so a hypothetical `0` rate would still render correctly.
- `validate.yml` and `pages.yml` had drifted JSON-validation rules; consolidated.

---

## [1.3.2] - 2026-04-22

### Fixed
- **Grok 3 calculator inclusion** — `inputRate` and `outputRate` were set to numeric values, causing Grok 3 to appear in cost estimates despite the exclusion note explicitly listing it as excluded. Both fields are now `null`, consistent with Llama 4 Maverick, DeepSeek, and Qwen
- **Long-context surcharge scope** — `calculateCosts()` applied the long-context pricing tier only to GPT-5.4 via a hardcoded ID check. Replaced with a generic check: any model with `longContextInputRate` and `longContextThreshold` in JSON now uses the higher rate when the average prompt exceeds the threshold. Gemini 2.5 Pro (threshold: 200K tokens, surcharge rate: $2.5/1M) is now priced correctly for long prompts
- **Radar default selection** — `buildRadarControls()` seeded the radar with the first 4 models in JSON order (all OpenAI). Changed to an explicit category-winner list: Claude Opus 4.6, GPT-5.4, Gemini 3.1 Flash-Lite, Gemini Flash Live. Falls back to first 4 if none of those IDs are present
- **Value matrix long-ctx label** — the long-context rate column now shows the threshold inline (e.g. `$2.5 long-ctx >200K`) so users know when the surcharge activates
- **Calculator hint text** — `calcHint` now dynamically lists every model whose surcharge is active instead of hardcoding "GPT-5.4"

---

## [1.3.1] - 2026-04-22

### Added
- **"Data last updated" badge** — `data/models.json` now includes an `updated` field (ISO date string); the Notes section reads and displays it live
- **CI schema tolerates optional fields** — validator no longer errors on extra keys (`longContextThreshold`, `audioInputRate`, `audioOutputRate`, `perMinute`); optional pricing fields are silently accepted
- **`CONTRIBUTING.md`** — added contributor guide covering price updates, new model additions, UI changes, code style, and issue reporting

---

## [1.2.0] - 2026-04-22

### Added
- **21-model coverage** — expanded from 9 to 21 models across OpenAI, Anthropic, Google, Mistral, Cohere, Meta, xAI, DeepSeek, and Qwen
- **Audio pricing fields** — `audioInputRate`, `audioOutputRate`, `perMinute` added to JSON schema for voice-capable models (Gemini Flash Live)
- **Long-context tiered pricing** — `longContextInputRate` and `longContextThreshold` fields added; GPT-5.4 and Gemini 2.5 Pro carry tiered input rates
- **Provider grouping in value matrix** — models from the same provider appear together for easier scanning
- **Radar chip selector** — all 21 models available as toggle chips; up to 6 can be compared simultaneously on the radar chart
- **CI weekly schedule** — `pages.yml` now runs schema validation every Monday at 07:00 UTC to catch stale or drifted data

### Fixed
- **Duplicate color validation** — CI now rejects entries with duplicate `color` hex values
- **Duplicate ID validation** — CI now rejects entries with duplicate `id` values

---

## [1.1.1] - 2026-04-22

### Fixed
- **`NO_ANIMATION` constant** — extracted shared Chart.js animation-disable config into a single top-level constant; previously duplicated across radar and bar chart initialisers
- **Input debounce** — calculator inputs now debounce at 300 ms; previously each keystroke triggered an immediate full chart redraw
- **Chart container height** — `.chart-wrap` now uses a fixed `height: 280px` with `position: relative` and `canvas { position: absolute; inset: 0 }` to prevent unbounded growth on re-render
- **Lucide icon version pinned** — CDN import updated from unpkg `latest` to a pinned `0.469.0` release on jsDelivr

---

## [1.1.0] - 2026-04-22

### Fixed
- **Theme init race condition** — theme is now applied synchronously before any data fetch
- **Client-side JSON validation** — each model entry is validated for required fields and radar keys at runtime
- **Radar chart model cap** — replaced hardcoded 4-model limit with an interactive chip selector supporting up to 6 models
- **Bar/radar chart axis colors on theme switch** — axis tick and grid colors now update correctly via `colorVar()` when toggling dark/light mode
- **`cache: 'no-store'` → `cache: 'no-cache'`** — model data now revalidates via ETag/Last-Modified instead of bypassing the browser cache entirely
- **`contextWindow` field inconsistency** — vague prose strings replaced with actual token counts
- **`<meta name="theme-color">`** — added and updated dynamically on theme toggle
- **Calculator exclusion note** — open/self-hosted models clearly labelled as excluded from cost calculator
- **`aria-live` on calculator results** — screen readers now announce cost updates when inputs change
- **`<noscript>` fallback** — users with JavaScript disabled see an explanatory banner
- **Skip link** — "Skip to content" added as the first focusable element
- **`scope="col"` on all table headers** — improves screen reader table navigation
- **Decorative logo `alt` corrected** — mobile nav logo now uses `alt=""` as a decorative duplicate

---

## [1.0.0] - 2026-04-19

### Added
- Initial release with workload router, usage calculator, radar scorecard, and value matrix
- Static HTML + JSON architecture with zero build step
- GitHub Pages deployment via CI
- Light/dark mode with system preference detection
- URL hash state sync for shareable calculator scenarios
- 10 models at launch across OpenAI, Anthropic, and Google
