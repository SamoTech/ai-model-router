# Changelog

All notable changes to this project will be documented here.

## [1.3.2] - 2026-04-22

### Fixed
- **Grok 3 calculator inclusion** — `inputRate` and `outputRate` were set to numeric values, causing Grok 3 to appear in cost estimates despite the exclusion note explicitly listing it as excluded. Both fields are now `null`, consistent with Llama 4 Maverick, DeepSeek, and Qwen
- **Long-context surcharge scope** — `calculateCosts()` applied the long-context pricing tier only to GPT-5.4 via a hardcoded ID check. Replaced with a generic check: any model with `longContextInputRate` and `longContextThreshold` in JSON now uses the higher rate when the average prompt exceeds the threshold. Gemini 2.5 Pro (threshold: 200K tokens, surcharge rate: $2.5/1M) is now priced correctly for long prompts
- **Radar default selection** — `buildRadarControls()` seeded the radar with the first 4 models in JSON order (all OpenAI). Changed to an explicit category-winner list: Claude Opus 4.6, GPT-5.4, Gemini 3.1 Flash-Lite, Gemini Flash Live. Falls back to first 4 if none of those IDs are present
- **Value matrix long-ctx label** — the long-context rate column now shows the threshold inline (e.g. `$2.5 long-ctx >200K`) so users know when the surcharge activates
- **Calculator hint text** — `calcHint` now dynamically lists every model whose surcharge is active instead of hardcoding "GPT-5.4"

## [1.3.1] - 2026-04-22

### Added
- **"Data last updated" badge** — `data/models.json` now includes an `updated` field (ISO date string); the Notes section reads and displays it live
- **CI schema tolerates optional fields** — validator no longer errors on extra keys (`longContextThreshold`, `audioInputRate`, `audioOutputRate`, `perMinute`); optional pricing fields are silently accepted
- **`CONTRIBUTING.md`** — added contributor guide covering price updates, new model additions, UI changes, code style, and issue reporting

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

## [1.1.1] - 2026-04-22

### Fixed
- **`NO_ANIMATION` constant** — extracted shared Chart.js animation-disable config (`animation: false`, `animations: false`, active-state transition override) into a single top-level constant; previously duplicated across radar and bar chart initialisers
- **Input debounce** — calculator inputs now debounce at 300 ms; previously each keystroke triggered an immediate full chart redraw
- **Chart container height** — `.chart-wrap` now uses a fixed `height: 280px` with `position: relative` and `canvas { position: absolute; inset: 0 }`; previously Chart.js could grow the container unboundedly on re-render
- **Lucide icon version pinned** — CDN import updated from unpkg `latest` to a pinned `0.469.0` release on jsDelivr; eliminates non-deterministic icon resolution on every page load

## [1.1.0] - 2026-04-22

### Fixed
- **Theme init race condition** — theme is now applied synchronously before any data fetch; `setTheme()` no longer calls chart renderers when `modelData` is empty
- **Client-side JSON validation** — each model entry is validated for required fields and radar keys at runtime; corrupted or CDN-cached stale JSON now surfaces a clear error instead of silently breaking charts
- **Radar chart 4-model hard cap removed** — replaced with an interactive model selector; up to 6 models can be compared simultaneously with toggle chips
- **Bar/radar chart axis colors on theme switch** — axis tick and grid colors now update correctly via `colorVar()` when toggling dark/light mode
- **`cache: 'no-store'` → `cache: 'no-cache'`** — model data now revalidates via ETag/Last-Modified instead of bypassing the browser cache entirely, improving repeat-load performance
- **`contextWindow` field inconsistency** — Gemini 3.1 Flash-Lite and other vague prose strings replaced with actual token counts (e.g. `1M tokens`, `128K tokens`)
- **`<meta name="theme-color">`** — added and updated dynamically on theme toggle for correct mobile browser chrome color
- **Calculator exclusion note** — open/self-hosted models (Llama 4 Maverick, Grok 3, DeepSeek, Qwen) are now clearly labelled as excluded from the cost calculator with an explanatory inline note
- **`aria-live` on calculator results** — screen readers now announce cost updates when inputs change
- **`<noscript>` fallback** — users with JavaScript disabled now see an explanatory banner instead of a blank page
- **Skip link** — "Skip to content" added as the first focusable element for keyboard navigation
- **`scope="col"` on all table headers** — improves screen reader table navigation across all three tables
- **Decorative logo `alt` corrected** — mobile nav logo instance now uses `alt=""` as it is a decorative duplicate

## [1.0.0] - 2026-04-19

### Added
- Initial release with workload router, usage calculator, radar scorecard, and value matrix
- Static HTML + JSON architecture with zero build step
- GitHub Pages deployment via CI
- Light/dark mode with system preference detection
- URL hash state sync for shareable calculator scenarios
