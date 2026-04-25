# Research Notes

Pricing sources, benchmark methodology, and model audit log for `data/models.json`.

> **Maintainer:** AI Research Lead  
> **Update cadence:** On every model launch or pricing change. Weekly check every Monday.

> ⚠️ **Pending refresh — 2026 Q2.** See [`docs/data-refresh-2026-Q2.md`](docs/data-refresh-2026-Q2.md) for an auto-generated diff between this dataset and the provider pricing pages cited below. Several drift findings (e.g. GPT-5.4 output, Gemini 2.5 Flash, Gemini Flash Live) and new flagships (GPT-5.5, Opus 4.7, Gemini 3.1 Pro) need a maintainer to re-verify before any number is touched here. **Do not edit `data/models.json` based on the diff alone.**

---

## Pricing sources

| Provider | Pricing page |
|---|---|
| OpenAI | https://openai.com/api/pricing/ |
| Anthropic | https://www.anthropic.com/pricing |
| Google (Vertex / AI Studio) | https://ai.google.dev/pricing |
| Mistral | https://mistral.ai/technology/#pricing |
| Cohere | https://cohere.com/pricing |
| xAI | https://x.ai/api |
| Meta (via hosted vendors) | https://llama.meta.com/ — check Together AI, Fireworks, Replicate for rate cards |
| DeepSeek | https://platform.deepseek.com/usage — self-host; no fixed API price |
| Qwen (Alibaba) | https://qwenlm.github.io/ — self-host; no fixed API price |

---

## Benchmark methodology notes

- **SWE-Bench Verified** — software engineering tasks; score = % of issues resolved. Use Verified subset only (full SWE-Bench is noisier). Source: https://www.swebench.com/
- **SWE-Bench Pro** — harder, real-world filtered subset. Higher bar than Verified.
- **TerminalBench 2** — agentic terminal task completion. Source: vendor blogs.
- **OSWorld** — computer-use GUI automation benchmark. Source: https://os-world.github.io/
- **AIME 2025** — American Invitational Mathematics Examination; measures hard math reasoning.
- **MMLU** — Massive Multitask Language Understanding; broad knowledge. Source: https://arxiv.org/abs/2009.03300
- **TTFT** — Time To First Token; latency metric, not quality. Source: vendor benchmarks.

> All scores in `data/models.json` are **routing heuristics**, not definitive rankings. Methodology varies across labs. Do not cite them as absolute truth.

---

## Current model audit — April 2026

### OpenAI

| Model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| GPT-5.4 | $2.50 | $10.00 | Long-ctx surcharge $5.00 above 272K tokens. Source: openai.com/api/pricing |
| GPT-4.1 | $2.00 | $8.00 | No long-ctx tier. Source: openai.com/api/pricing |
| GPT-4.1 Mini | $0.40 | $1.60 | Source: openai.com/api/pricing |
| GPT-4.1 Nano | $0.10 | $0.40 | Source: openai.com/api/pricing |
| o3 | $10.00 | $40.00 | Source: openai.com/api/pricing |
| o4-mini | $1.10 | $4.40 | Source: openai.com/api/pricing |

### Anthropic

| Model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| Claude Opus 4.6 | $5.00 | $25.00 | Source: anthropic.com/pricing |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Source: anthropic.com/pricing |
| Claude Haiku 4 | $0.80 | $4.00 | Source: anthropic.com/pricing |

### Google

| Model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| Gemini 2.5 Pro | $1.25 | $10.00 | Long-ctx surcharge $2.50 above 200K tokens. Source: ai.google.dev/pricing |
| Gemini 2.5 Flash | $0.15 | $0.60 | Source: ai.google.dev/pricing |
| Gemini 3.1 Flash-Lite | $0.10 | $0.40 | Source: ai.google.dev/pricing |
| Gemini Flash Live | $0.50 text / $3.00 audio in | $2.00 text / $12.00 audio out | $0.018/min voice. Source: ai.google.dev/pricing |

### Mistral

| Model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| Mistral Medium 3 | $0.40 | $2.00 | Source: mistral.ai/technology/#pricing |
| Mistral Small 3.1 | $0.10 | $0.30 | Source: mistral.ai/technology/#pricing |

### Cohere

| Model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| Command A | $2.50 | $10.00 | Source: cohere.com/pricing |
| Command R+ | $2.50 | $10.00 | Source: cohere.com/pricing |

### xAI

| Model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| Grok 3 | — | — | Pricing volatile; null in JSON. Verify before routing traffic. Source: x.ai/api |

### Open / self-host

| Model | Notes |
|---|---|
| Llama 4 Maverick | No fixed API price. Check Together AI / Fireworks / Replicate for current hosted rates. |
| DeepSeek reasoning class | Self-host only in JSON. platform.deepseek.com has a hosted API — verify rates separately. |
| Qwen coding class | Self-host only in JSON. Check Alibaba Cloud / qwenlm.github.io for hosted options. |

---

## Proposed additions (next cycle)

- [ ] **Gemini 2.5 Flash Thinking** — reasoning variant of Flash; check if pricing differs from base Flash
- [ ] **Claude Haiku 4.5** — if released; slot between Haiku 4 and Sonnet 4.5
- [ ] **GPT-4o** — legacy but still widely deployed; worth tracking for migration comparisons

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-04-22 | Initial audit of all 21 models; pricing verified against official pages | AI Research Lead |
