# Changelog

All notable changes to this project will be documented here.

## [1.0.0] - 2026-04-19

### Added
- Initial release with workload router, usage calculator, radar scorecard, and value matrix
- Static HTML + JSON architecture with zero build step
- GitHub Pages deployment via CI
- Light/dark mode with system preference detection
- URL hash state sync for shareable calculator scenarios

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
