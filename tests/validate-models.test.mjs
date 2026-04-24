/* End-to-end test for scripts/validate-models.mjs.
 * We invoke the script as a subprocess against fixture JSON files written to
 * a temp dir, then assert exit code and stderr content. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/validate-models.mjs');

function runValidator(jsonObj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'amr-test-'));
  const file = path.join(dir, 'models.json');
  fs.writeFileSync(file, JSON.stringify(jsonObj, null, 2));
  const result = spawnSync('node', [SCRIPT, file], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

const validModel = {
  id: 'test-1',
  name: 'Test Model',
  provider: 'OpenAI',
  inputRate: 1.0,
  outputRate: 4.0,
  contextWindow: '128K tokens',
  color: '#abcdef',
  bestAt: 'Testing',
  verdict: 'good',
  verdictLabel: 'Test',
  take: 'Plain prose without HTML special characters.',
  radar: { coding: 5, longContext: 5, voice: 5, computerUse: 5, costEfficiency: 5 }
};

test('the real data/models.json passes validation', () => {
  const r = spawnSync('node', [SCRIPT, path.resolve('data/models.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, `validator failed:\n${r.stdout}\n${r.stderr}`);
});

test('valid minimal fixture passes', () => {
  const r = runValidator({ updated: '2026-04-22', models: [validModel] });
  assert.equal(r.status, 0, r.stderr);
});

test('rejects missing required field', () => {
  const m = { ...validModel };
  delete m.color;
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /missing required field: color/);
});

test('rejects duplicate id', () => {
  const r = runValidator({ updated: '2026-04-22', models: [validModel, { ...validModel, color: '#123456' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /duplicate id: test-1/);
});

test('rejects duplicate color', () => {
  const r = runValidator({ updated: '2026-04-22', models: [validModel, { ...validModel, id: 'test-2' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /duplicate color: #abcdef/);
});

test('rejects invalid color format', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, color: 'red' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /invalid color: red/);
});

test('rejects invalid verdict', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, verdict: 'meh' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /invalid verdict: meh/);
});

test('rejects invalid provider', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, provider: 'TotallyMadeUp' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /invalid provider/);
});

test('rejects radar value out of [0, 10]', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, radar: { ...validModel.radar, coding: 11 } }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /radar\.coding out of range/);
});

test('rejects non-integer radar', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, radar: { ...validModel.radar, coding: 7.5 } }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /radar\.coding out of range/);
});

test('rejects HTML-unsafe < or > in user-facing fields (XSS scan)', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, take: 'Bad <script>alert(1)</script>' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /HTML-unsafe characters/);
});

test('rejects javascript: URI in user-facing fields', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, bestAt: 'click javascript:alert(1)' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /HTML-unsafe characters/);
});

test('allows apostrophes and ampersands in prose', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, take: "Anthropic's safety profile & cost." }] });
  assert.equal(r.status, 0, r.stderr);
});

test('rejects bad updated date format', () => {
  const r = runValidator({ updated: 'April 22 2026', models: [validModel] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /YYYY-MM-DD/);
});

test('rejects negative pricing', () => {
  const r = runValidator({ updated: '2026-04-22', models: [{ ...validModel, inputRate: -1 }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /inputRate must be null or a non-negative number/);
});

test('rejects longContextInputRate without threshold', () => {
  const m = { ...validModel, longContextInputRate: 5 };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /longContextInputRate but no longContextThreshold/);
});
