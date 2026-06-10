# Data Refresh Diff — 2026 Q2

> **Status:** PROPOSAL — pending maintainer confirmation. **No price in `data/models.json` has been changed by this PR.**
> **Verified at:** 2026-04-24 (this document); `data/models.json` `updated` field still reads `2026-04-22`.
> **Author:** Auto-generated diff against the public pricing pages cited in [`RESEARCH.md`](../RESEARCH.md). Each finding lists the source URL the maintainer needs to re-verify before any value moves.

This report compares every priced model in [`data/models.json`](../data/models.json) against the provider's current official pricing page. **Do not merge price changes from this document until the maintainer has independently verified each provider's page** — provider pricing pages change without changelog notice, and a 2-week-old snapshot can already be stale.

---

## How to read this document

Each finding is one of:

| Tag                           | Meaning                                                                                                  |
|------------------------------ |--------------------------------------------------------------------------------------------------------- |
| **MATCH**                     | Dataset value still matches the live pricing page. No action needed.                                     |
| **DRIFT — confirm & update**  | Dataset value differs from the live pricing page. Maintainer must re-verify and update.                  |
| **NEW MODEL — consider add**  | A new model now appears on the live page that is not yet in the dataset.                                 |
| **POSSIBLY DEPRECATED**       | Model in dataset no longer appears on the live pricing page. Maintainer should confirm whether to retire it or move it to a "legacy" section. |
| **SCHEMA GAP**                | The live page exposes a tier/field the dataset cannot represent (e.g. long-context output rate). Schema change required first. |
| **VERIFY MANUALLY**           | Automated fetch failed (403, dynamic JS, etc.). Maintainer must check by hand.                            |

---

## OpenAI — `openai.com/api/pricing`

| Dataset model | Field            | Dataset    | Live page (2026-04-24) | Status                          |
|---            |---               |---         |---                     |---                              |
| `gpt-5-4`     | input            | $2.50      | $2.50                  | **MATCH**                       |
| `gpt-5-4`     | output           | **$10.00** | **$15.00**             | **DRIFT — confirm & update**    |
| `gpt-5-4`     | long-ctx input   | $5.00 (>272K) | "rates above are <270K" — long-ctx tier exists but not enumerated on the flagship card | **VERIFY MANUALLY** (check ["Explore detailed pricing"](https://openai.com/api/pricing/)) |
| `gpt-5-4`     | cached input     | (not in schema) | $0.25            | **SCHEMA GAP** — Feature D will introduce this field |
| `gpt-4-1`, `gpt-4-1-mini`, `gpt-4-1-nano`, `o3`, `o4-mini` | all | as in dataset | not visible on the flagship pricing page; appears the page now lists only GPT-5.5 / GPT-5.4 / GPT-5.4-mini at the top | **POSSIBLY DEPRECATED** — verify on ["Explore detailed pricing"](https://openai.com/api/pricing/) which links a more comprehensive table; do **not** retire silently |

**New flagship models on the live page that are NOT in the dataset:**

| Model        | Input     | Cached input | Output    | Status                             |
|---           |---        |---           |---        |---                                 |
| GPT-5.5      | $5.00     | $0.50        | $30.00    | **NEW MODEL — consider add**       |
| GPT-5.4 mini | $0.75     | $0.075       | $4.50     | **NEW MODEL — consider add**       |

OpenAI's flagship pricing card is now scoped to context lengths under 270K and introduces a Standard / Batch −50% / Data residency +10% toggle. Bake the Batch toggle into Feature C (calculator batch toggle).

---

## Anthropic — `anthropic.com/pricing`

| Dataset model        | Field   | Dataset    | Live page  | Status                           |
|---                   |---      |---         |---         |---                               |
| `claude-opus-4-6`    | input   | $5.00      | $5.00      | **MATCH** (still listed under "Legacy models") |
| `claude-opus-4-6`    | output  | $25.00     | $25.00     | **MATCH**                        |
| `claude-sonnet-4-5`  | input   | $3.00      | $3.00      | **MATCH**                        |
| `claude-sonnet-4-5`  | output  | $15.00     | $15.00     | **MATCH**                        |
| `claude-haiku-4`     | input   | $0.80      | (not on live page; superseded by Haiku 4.5 at $1.00) | **POSSIBLY DEPRECATED** |
| `claude-haiku-4`     | output  | $4.00      | (not on live page; superseded by Haiku 4.5 at $5.00) | **POSSIBLY DEPRECATED** |
| (all Anthropic)      | prompt cache write/read | (not in schema) | published per model | **SCHEMA GAP** — Feature D candidate |

**New flagship models on the live page that are NOT in the dataset:**

| Model       | Input | Output | Cache write | Cache read | Status                       |
|---          |---    |---     |---          |---         |---                           |
| Opus 4.7    | $5    | $25    | $6.25       | $0.50      | **NEW MODEL — consider add** (current Anthropic flagship; replaces Opus 4.6 in the "frontier" slot) |
| Sonnet 4.6  | $3    | $15    | $3.75       | $0.30      | **NEW MODEL — consider add** |
| Haiku 4.5   | $1    | $5     | $1.25       | $0.10      | **NEW MODEL — consider add** (replaces Haiku 4 at the cheap-tier slot) |

Anthropic also published US-only inference at 1.1× pricing — relevant for any "data residency" UI we add later (e.g. with Tier 2 idea #10 — region/residency field).

---

## Google — `ai.google.dev/pricing`

| Dataset model            | Field                | Dataset                     | Live page                     | Status                              |
|---                       |---                   |---                          |---                            |---                                  |
| `gemini-2-5-pro`         | input                | $1.25                       | $1.25                         | **MATCH**                           |
| `gemini-2-5-pro`         | output               | $10.00                      | $10.00                        | **MATCH**                           |
| `gemini-2-5-pro`         | long-ctx input >200K | $2.50                       | $2.50                         | **MATCH**                           |
| `gemini-2-5-pro`         | long-ctx output >200K| (not in schema)             | **$15.00**                    | **SCHEMA GAP** — long-context **output** tier not representable; only `longContextInputRate` exists |
| `gemini-2-5-flash`       | input                | **$0.15**                   | **$0.30** (text/image/video)  | **DRIFT — confirm & update** (+100%) |
| `gemini-2-5-flash`       | output               | **$0.60**                   | **$2.50**                     | **DRIFT — confirm & update** (+316%) |
| `gemini-3-1-flash-lite`  | input                | $0.10                       | currently labeled "Preview" at $0.25 (text/image/video), $0.50 (audio) | **DRIFT — confirm & update** (or wait for GA pricing) |
| `gemini-3-1-flash-lite`  | output               | $0.40                       | $1.50 (Preview)               | **DRIFT — confirm & update**        |
| `gemini-flash-live`      | input (text)         | $0.50                       | "3.1 Flash Live Preview": $0.75 text / $3.00 audio / $1.00 image-video | **DRIFT — confirm & update** |
| `gemini-flash-live`      | output (text)        | $2.00                       | $4.50 text                    | **DRIFT — confirm & update**        |
| `gemini-flash-live`      | audio in / audio out | $3 / $12                    | $3 / $12                      | **MATCH** (audio rates unchanged)    |

**New flagship model NOT in the dataset:**

| Model            | Input          | Output (incl. thinking) | Cache | Status                       |
|---               |---             |---                      |---    |---                           |
| Gemini 3.1 Pro   | $2 (≤200K) / $4 (>200K) | $12 / $18      | $0.20 / $0.40 | **NEW MODEL — consider add** (current Google flagship; competes head-to-head with GPT-5.5 and Opus 4.7) |
| Gemini 2.5 Flash-Lite | $0.10 (text) / $0.30 (audio) | $0.40 | $0.025 / $0.075 | **NEW MODEL — consider add** (this matches the dataset's current `gemini-3-1-flash-lite` rates, suggesting the dataset's IDs may be misnamed — see below) |
| Gemini 2.5 Computer Use Preview | (separate pricing) | | | **NEW MODEL — consider add** (computer-use specific tier; relevant to the dashboard's "computer use" KPI) |

**Naming concern:** the dataset's `gemini-3-1-flash-lite` at $0.10/$0.40 closely matches the live page's **Gemini 2.5 Flash-Lite** ($0.10 / $0.40), not the "3.1 Flash-Lite Preview" ($0.25 / $1.50). The maintainer should confirm whether this is a stale rename or the dataset is tracking the wrong generation.

---

## Mistral — `mistral.ai/technology/#pricing`

| Dataset model        | Status                                                                                              |
|---                   |---                                                                                                  |
| `mistral-medium-3`   | **VERIFY MANUALLY** — public pricing not exposed on `mistral.ai/technology` (page is product-marketing only). Check `console.mistral.ai/pricing` or the dedicated `mistral.ai/pricing` page. |
| `mistral-small-3-1`  | **VERIFY MANUALLY** — same as above.                                                                |

**Likely new model on the page:** Mistral Large 3 is mentioned on the technology page; the dataset has no Large-tier model. Worth investigating for **NEW MODEL — consider add**.

> **Action:** swap the source URL in `RESEARCH.md` from `mistral.ai/technology/#pricing` to a real per-token pricing page (Mistral has moved their public price card; verify).

---

## Cohere — `cohere.com/pricing`

| Dataset model     | Status                                                                                                 |
|---                |---                                                                                                     |
| `command-a`       | **VERIFY MANUALLY** — Cohere's public pricing page no longer surfaces a per-million-token price for Command A. The page now markets enterprise (Model Vault, North, Compass) and pushes "Request a demo" / "Contact sales" for production usage. The FAQ continues to list legacy Command R+ pricing but does not list Command A. |
| `command-r-plus`  | **MATCH** — FAQ explicitly lists "Command R+ 08-2024 pricing is $2.50/1M input and $10.00/1M output", same as the dataset.                                                                                                       |

> **Action:** if Cohere has truly retired public per-token pricing for Command A, the dataset's `command-a` entry should either (a) move to "vendor-quoted" semantics (like Grok 3), or (b) explicitly cite the historical published price + verifiedAt date.

---

## xAI — `x.ai/api`

| Dataset model | Status                                                                              |
|---            |---                                                                                  |
| `grok-3`      | **VERIFY MANUALLY** — automated fetch returned `403 Forbidden` (xAI blocks scraping). Dataset already has null pricing with note "Pricing volatile; verify before routing." The dashboard's existing posture is correct. |

---

## Open / self-host

| Dataset models                                       | Status                                                  |
|---                                                   |---                                                      |
| `llama-4-maverick`, `deepseek-reasoning`, `qwen-coding` | **OUT OF SCOPE** — vendor / self-host; null rates by design. No drift to detect. |

---

## Summary — proposed changes (none auto-applied)

| # | Action                                                                       | Risk      | Recommended ordering |
|---|---                                                                           |---        |---                   |
| 1 | Confirm + update **GPT-5.4 output** $10 → $15                                | Low       | 1st                  |
| 2 | Confirm + update **Gemini 2.5 Flash** $0.15/$0.60 → $0.30/$2.50              | Medium    | 2nd                  |
| 3 | Confirm + update **Gemini Flash Live text** $0.50/$2 → $0.75/$4.50           | Medium    | 3rd                  |
| 4 | Confirm + update **Gemini 3.1 Flash-Lite** to GA pricing once "Preview" tag drops | Low (wait for GA) | 4th         |
| 5 | Decide: retire **Claude Haiku 4** or pin its `verifiedAt` to a known historical date | Low       | 5th                  |
| 6 | Add **Gemini 2.5 Pro long-context output rate** (schema gap; needs `longContextOutputRate` field) | Schema | 6th    |
| 7 | Confirm Cohere Command A is still publicly priced, or convert to "vendor-quoted" | Low      | 7th                  |
| 8 | Verify Mistral pricing on the new page (URL drift in RESEARCH.md)            | Low       | 8th                  |
| 9 | Consider adding new flagships: GPT-5.5, GPT-5.4 mini, Opus 4.7, Sonnet 4.6, Haiku 4.5, Gemini 3.1 Pro | High (changes "default picks") | 9th — separate PR(s) |
| 10 | Consider OpenAI legacy models (GPT-4.1, o3, etc.) — verify against detailed-pricing page before retiring | Medium | 10th               |

### Important — what this PR does and does not do

- This PR **only adds this report** and a one-paragraph cross-reference banner at the top of `RESEARCH.md` that links to it. It does not modify `data/models.json` or any UI.
- The findings above are **automated diffs** — they may be noisy. A human maintainer must re-fetch each pricing page and confirm before any number moves.
- The `verifiedAt` field proposed in **Feature A** (per-model `source` URL + verifiedAt date) would let us detect this drift on a continuous basis and surface it in the UI itself rather than via a one-off audit.
