/* Unit tests for the cost-calculator pricing logic.
 * The browser app keeps the math inline in index.html; this file mirrors it
 * as a pure function so we can regression-test the long-context-tier and
 * voice-pricing rules. Sync changes here with calculateCosts() in index.html. */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/** Mirrors the pricing math in index.html#calculateCosts.
 * Returns { total, effectiveInRate, longCtxTriggered } for a single model. */
export function priceModel(model, { input, output, avgPrompt, voiceMinutes }) {
  if (model.inputRate == null) return null; /* self-hosted excluded */
  const hasLongCtx = model.longContextInputRate != null && model.longContextThreshold != null;
  const longCtxTriggered = hasLongCtx && avgPrompt > model.longContextThreshold;
  const effectiveInRate = longCtxTriggered ? model.longContextInputRate : model.inputRate;
  let total = (input / 1e6) * effectiveInRate + (output / 1e6) * (model.outputRate || 0);
  if (model.perMinute && voiceMinutes > 0) total += voiceMinutes * model.perMinute;
  return { total, effectiveInRate, longCtxTriggered };
}

const flagship = { id: 'gpt-5-4', inputRate: 2.5, outputRate: 10, longContextInputRate: 5, longContextThreshold: 272000 };
const sonnet   = { id: 'claude-sonnet-4-5', inputRate: 3, outputRate: 15 };
const flashLive = { id: 'gemini-flash-live', inputRate: 0.5, outputRate: 2, perMinute: 0.018 };
const llama    = { id: 'llama-4-maverick', inputRate: null, outputRate: null };

test('self-hosted models are excluded (inputRate null)', () => {
  assert.equal(priceModel(llama, { input: 1e6, output: 1e6, avgPrompt: 1000, voiceMinutes: 0 }), null);
});

test('base-rate pricing — 1M input + 1M output', () => {
  const r = priceModel(sonnet, { input: 1e6, output: 1e6, avgPrompt: 1000, voiceMinutes: 0 });
  assert.equal(r.total, 18); /* 3 + 15 */
  assert.equal(r.longCtxTriggered, false);
});

test('long-context surcharge does NOT trigger below threshold', () => {
  const r = priceModel(flagship, { input: 1e6, output: 0, avgPrompt: 271999, voiceMinutes: 0 });
  assert.equal(r.effectiveInRate, 2.5);
  assert.equal(r.total, 2.5);
  assert.equal(r.longCtxTriggered, false);
});

test('long-context surcharge triggers above threshold', () => {
  const r = priceModel(flagship, { input: 1e6, output: 0, avgPrompt: 280000, voiceMinutes: 0 });
  assert.equal(r.effectiveInRate, 5);
  assert.equal(r.total, 5);
  assert.equal(r.longCtxTriggered, true);
});

test('long-context applies generically — no hardcoded model id', () => {
  const generic = { id: 'fictional', inputRate: 1, outputRate: 2, longContextInputRate: 4, longContextThreshold: 100000 };
  const r = priceModel(generic, { input: 2e6, output: 0, avgPrompt: 200000, voiceMinutes: 0 });
  assert.equal(r.effectiveInRate, 4);
  assert.equal(r.total, 8);
  assert.equal(r.longCtxTriggered, true);
});

test('voice perMinute additive on top of token cost', () => {
  const r = priceModel(flashLive, { input: 1e6, output: 0, avgPrompt: 1000, voiceMinutes: 60 });
  /* 0.5 (input) + 60 * 0.018 (voice) = 0.5 + 1.08 */
  assert.equal(Number(r.total.toFixed(4)), 1.58);
});

test('zero voiceMinutes does not add voice cost even on voice model', () => {
  const r = priceModel(flashLive, { input: 1e6, output: 0, avgPrompt: 1000, voiceMinutes: 0 });
  assert.equal(r.total, 0.5);
});

test('outputRate=0 treated as zero (not NaN)', () => {
  const free = { id: 'free', inputRate: 1, outputRate: 0 };
  const r = priceModel(free, { input: 1e6, output: 1e6, avgPrompt: 0, voiceMinutes: 0 });
  assert.equal(r.total, 1);
});
