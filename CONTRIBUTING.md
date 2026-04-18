# Contributing to AI Model Router

Thanks for your interest. Contributions are welcome and kept simple on purpose.

## The fastest contribution: update a price or verdict

1. Edit `data/models.json` directly on GitHub (pencil icon in the file view)
2. Change `inputRate`, `outputRate`, `verdict`, `take`, or any other field
3. Commit directly to `main` or open a PR
4. CI validates the schema and redeploys Pages automatically

## Adding a new model

1. Fork the repo and create a branch
2. Copy an existing entry in `data/models.json` as a template
3. Fill in all required fields: `id name provider contextWindow bestAt verdict verdictLabel take`
4. Add pricing fields where known (`null` is fine for self-hosted models)
5. Pick a unique `color` hex
6. Set all five `radar` scores (0–10)
7. Open a pull request with a one-line description of what the model is and why it belongs

## UI changes

- All dashboard logic lives in `index.html` as a self-contained static file
- No build step, no bundler, no dependencies to install
- Test locally with `npx serve .` or `python -m http.server 8080`
- Make sure the dashboard still loads correctly with `data/models.json` before opening a PR

## Code style

- Keep `index.html` as a single file (inline CSS + JS)
- CSS custom properties for all colors and spacing—no hardcoded hex values in component styles
- No external runtime dependencies beyond the three CDN libraries already loaded (Chart.js, Lucide, Tailwind)

## What makes a good PR

- One clear change per PR
- Updated `data/models.json` with a source link in the PR description if pricing changed
- No new CDN dependencies without discussion

## Reporting outdated data

Open an issue with the model name, the current value, the correct value, and a link to the official pricing page.
