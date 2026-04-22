# CI Pipeline

Documentation for `.github/workflows/pages.yml`.

---

## Overview

Every push to `main` — and every Monday at 07:00 UTC via a scheduled run — triggers a three-job pipeline:

```
validate  →  deploy  →  health-check
```

`deploy` only runs if `validate` passes. `health-check` only runs if `deploy` succeeds.

---

## Jobs

### `validate`

Runs on `ubuntu-latest`. Steps:

| Step | What it checks |
|---|---|
| **Validate models.json schema** | Parses `data/models.json`; enforces required fields, unique IDs, unique colors, valid verdict values (`good`/`warn`/`bad`), valid hex colors, and radar scores in range 0–10 for all five keys |
| **Verify changelog exists** | Asserts `CHANGELOG.md` is present (`test -f`) |
| **Lint HTML** | Runs `htmlhint index.html` using rules from `.htmlhintrc`; currently set to `|| true` so lint warnings are reported but do not block deploy |

#### Running validation locally

```bash
# JSON schema
node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('data/models.json','utf8'));
  console.log(data.models.length + ' models found');
"

# HTML lint
npx htmlhint index.html --config .htmlhintrc
```

---

### `deploy`

Runs on `ubuntu-latest`. Needs: `validate`.

| Step | Action |
|---|---|
| Checkout | `actions/checkout@v4` |
| Setup Pages | `actions/configure-pages@v5` |
| Upload artifact | `actions/upload-pages-artifact@v3` — uploads the full repo root as the Pages artifact |
| Deploy | `actions/deploy-pages@v4` — publishes to `https://samotech.github.io/ai-model-router/` |

The deployment URL is exposed as `${{ steps.deployment.outputs.page_url }}` and shown in the GitHub Actions summary.

---

### `health-check`

Runs on `ubuntu-latest`. Needs: `deploy`.

Waits 20 seconds for Pages CDN propagation, then:

1. `curl` the live site root — asserts HTTP 200
2. `curl` `data/models.json` — asserts HTTP 200

If either check fails, the job exits with code 1 and the workflow run is marked failed.

---

## Triggers

| Trigger | Condition |
|---|---|
| `push` | Any push to `main` |
| `workflow_dispatch` | Manual trigger from the Actions tab |
| `schedule` | Every Monday at 07:00 UTC (`cron: '0 7 * * 1'`) |

The scheduled run re-validates the schema and re-deploys Pages even with no code changes. This catches drift (e.g. stale pricing fields) on a weekly cadence.

---

## Concurrency

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

Only one Pages deployment runs at a time. Rapid pushes cancel the in-progress run and start a new one.

---

## Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

`id-token: write` is required by `actions/deploy-pages` for OIDC-based deployment.

---

## Adding a new validation rule

1. Edit the `node <<'EOF' ... EOF` block in the `validate` job
2. Test locally with `node -e "..."` before pushing
3. Coordinate with the AI Research Lead if the rule touches JSON schema fields
4. Update this file to document the new check

---

## Upgrading Actions

All Actions are pinned to major version tags (`@v4`, `@v5`). To upgrade:

```bash
# Check for newer versions at
https://github.com/actions/checkout/releases
https://github.com/actions/setup-node/releases
https://github.com/actions/configure-pages/releases
https://github.com/actions/upload-pages-artifact/releases
https://github.com/actions/deploy-pages/releases
```
