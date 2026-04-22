# Adding a Model

Step-by-step guide for adding a new entry to `data/models.json`.

No local setup is required — you can do this entirely on GitHub.com.

---

## Before you start

- Verify the model is publicly available (not just announced)
- Have the official pricing page open (see [RESEARCH.md](../RESEARCH.md) for URLs)
- Check that the model's `id` and `color` are not already used in the file

---

## Step 1 — Open `data/models.json`

Go to [data/models.json](https://github.com/SamoTech/ai-model-router/blob/main/data/models.json) and click the pencil icon to edit.

---

## Step 2 — Copy the template

Add a new object inside the `"models"` array. Copy this template and fill in every field:

```jsonc
{
  "id":           "provider-model-name",   // unique kebab-case, e.g. "gemini-2-5-flash"
  "name":         "Provider Model Name",   // display name shown in all UI
  "provider":     "Google",                // see allowed values below
  "inputRate":    0.15,                    // USD per 1M input tokens; null if self-hosted
  "outputRate":   0.60,                    // USD per 1M output tokens; null if self-hosted
  "contextWindow": "1M tokens",            // human-readable string
  "color":        "#52c26a",              // unique hex not used by any other model
  "bestAt":       "One-line routing hint",
  "verdict":      "good",                  // "good" | "warn" | "bad"
  "verdictLabel": "Short label",           // 2–4 words shown in the badge
  "take":         "One or two sentences. Opinionated. No marketing copy.",
  "benchmarks":   {},                      // optional key/value pairs, e.g. { "MMLU": "85%" }
  "radar": {
    "coding":         7,   // integer 0–10
    "longContext":     8,
    "voice":          5,
    "computerUse":    5,
    "costEfficiency": 9
  }
}
```

### Allowed `provider` values

```
OpenAI | Anthropic | Google | Mistral | Cohere | xAI | Meta / hosted vendors | Open / self-host
```

### Optional pricing fields

Only add these if they apply:

```jsonc
"longContextInputRate":  2.50,    // surcharge rate above threshold
"longContextThreshold": 200000,  // token count where surcharge activates
"audioInputRate":        3.00,   // voice models only
"audioOutputRate":       12.00,  // voice models only
"perMinute":             0.018   // voice cost per minute
```

---

## Step 3 — Pick a unique color

Every model needs a unique `color` hex. The CI validator will reject duplicates.

Colors already in use are listed in `data/models.json`. Pick something visually distinct from its neighbours in the same provider group.

---

## Step 4 — Set radar scores

All five keys are required. Score 0–10 based on:

| Dimension | What to score |
|---|---|
| `coding` | SWE-Bench Verified or equivalent; agentic code quality |
| `longContext` | Context window size + retrieval quality at long range |
| `voice` | Native realtime audio / voice capability |
| `computerUse` | OSWorld or GUI automation benchmark |
| `costEfficiency` | Price per 1M tokens relative to quality delivered |

Scores are routing heuristics, not definitive rankings. Use your judgement relative to existing entries.

---

## Step 5 — Update the `updated` date

Change the top-level `"updated"` field to today's date in `YYYY-MM-DD` format:

```json
{
  "updated": "2026-04-22",
  "models": [ ... ]
}
```

---

## Step 6 — Commit directly to `main`

Scroll down, write a commit message like:

```
data: add Gemini 2.5 Flash Thinking
```

Commit to `main`. CI will validate the schema and redeploy Pages automatically.

---

## Step 7 — Verify

1. Check the [Actions tab](https://github.com/SamoTech/ai-model-router/actions) — `validate` job should pass
2. After deploy, open [the live dashboard](https://samotech.github.io/ai-model-router/) and confirm the model appears in the value matrix
3. Check the calculator excludes it if `inputRate` is `null`

---

## Common mistakes

| Mistake | Error from CI |
|---|---|
| Duplicate `id` | `duplicate id: your-model-id` |
| Duplicate `color` | `duplicate color: #xxxxxx` |
| Invalid `verdict` | `invalid verdict for your-model-id` |
| Radar score outside 0–10 | `radar.coding invalid for your-model-id` |
| Missing required field | `model[N] missing fieldName` |
| Invalid color hex | `invalid color for your-model-id` |

All errors block the deploy. Fix the JSON and push again.
