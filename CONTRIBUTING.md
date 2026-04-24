# Contributing to AI Model Router

Thanks for your interest. Contributions are welcome and kept simple on purpose.

## The fastest contribution: update a price or verdict

1. Edit `data/models.json` directly on GitHub (pencil icon in the file view)
2. Change `inputRate`, `outputRate`, `verdict`, `take`, or any other field
3. Commit directly to `main` or open a PR
4. CI validates the schema and redeploys Pages automatically

## Adding a new model

The dashboard currently covers **21 models** across 9 providers. A new model earns a slot when it introduces a materially different capability tier, price point, or routing tradeoff — not simply because it was announced.

1. Fork the repo and create a branch
2. Copy an existing entry in `data/models.json` as a template
3. Fill in all **required** fields:
   ```
   id  name  provider  contextWindow  bestAt  verdict  verdictLabel  take
   ```
4. Add **optional pricing fields** where known (`null` is correct for self-hosted / vendor-negotiated models):

   | Field | Type | When to set |
   |---|---|---|
   | `inputRate` | `number\|null` | Standard input price per 1 M tokens. Set `null` for self-hosted models (Llama, Grok, DeepSeek, Qwen — these are excluded from the cost calculator). |
   | `outputRate` | `number\|null` | Output price per 1 M tokens. |
   | `longContextInputRate` | `number\|null` | Higher input rate applied when prompt exceeds `longContextThreshold`. |
   | `longContextThreshold` | `number\|null` | Token count at which `longContextInputRate` activates (e.g. `200000`). Required if `longContextInputRate` is set. |
   | `audioInputRate` | `number\|null` | Per-1 M-token rate for audio input (voice-capable models). |
   | `audioOutputRate` | `number\|null` | Per-1 M-token rate for audio output. |
   | `perMinute` | `number\|null` | Per-minute rate for live/streaming audio sessions. |

5. Pick a **unique** `color` hex — CI will reject duplicates
6. Set all five `radar` scores (0–10): `coding`, `longContext`, `voice`, `computerUse`, `costEfficiency`
7. Add benchmark claims to `benchmarks` (freeform key/value, e.g. `"SWE-bench": "72.5%"`)
8. Open a pull request with a one-line description of the model and why it belongs

### Self-hosted / open models

Models without a fixed public API price (Llama 4 Maverick, Grok 3, DeepSeek V3/R1, Qwen) must have `inputRate: null` and `outputRate: null`. The cost calculator skips any model where `inputRate` is `null`, and the exclusion note in the UI already lists these models by name. Setting numeric rates for open models will silently include them in cost estimates — that is a bug.

## UI changes

- All dashboard logic lives in `index.html` as a self-contained static file
- No build step, no bundler, no dependencies to install
- Test locally with `npx serve .` or `python -m http.server 8080`
- Make sure the dashboard still loads correctly with `data/models.json` before opening a PR

## Code style

- Keep `index.html` as a single file (inline CSS + JS)
- CSS custom properties for all colors and spacing — no hardcoded hex values in component styles
- No external runtime dependencies beyond the two CDN libraries already loaded (Chart.js, Lucide). Both ship with SRI hashes; if you bump the pinned version you must also update the `integrity=` attribute. There is no Tailwind in this project — all styling is custom CSS in the `<style>` block in `index.html`.
- Extract shared config into named constants (e.g. `NO_ANIMATION`, `RADAR_DEFAULT_IDS`) rather than repeating literals
- Calculator inputs debounce at 300 ms — keep it that way; do not add immediate `input` listeners that trigger chart redraws

## What makes a good PR

- One clear change per PR
- Updated `data/models.json` with a source link in the PR description if pricing changed
- No new CDN dependencies without discussion
- Update `CHANGELOG.md` with the version bump and a brief description of the change

## Reporting outdated data

Open an issue with the model name, the current value, the correct value, and a link to the official pricing page.
