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

/* ─── Optional homepage highlights (sidebarPicks, categoryWinners) ─── */

const validWinners = [
  { category: 'coding',  label: 'Coding winner',  modelId: 'test-1', tagline: 'Best at code' },
  { category: 'context', label: 'Context winner', modelId: 'test-1', tagline: 'Big window' },
  { category: 'voice',   label: 'Voice winner',   modelId: 'test-1', tagline: 'Realtime audio', displayName: 'Short Name' },
  { category: 'cheap',   label: 'Cheap traffic',  modelId: 'test-1', tagline: 'Cheapest' }
];

test('accepts valid sidebarPicks + categoryWinners', () => {
  const r = runValidator({
    updated: '2026-04-22',
    sidebarPicks:    [{ modelId: 'test-1', label: 'Best test' }],
    categoryWinners: validWinners,
    models: [validModel]
  });
  assert.equal(r.status, 0, r.stderr);
});

test('rejects sidebarPicks referencing unknown modelId', () => {
  const r = runValidator({
    updated: '2026-04-22',
    sidebarPicks: [{ modelId: 'does-not-exist', label: 'oops' }],
    models: [validModel]
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sidebarPicks\[0\] references unknown modelId: does-not-exist/);
});

test('rejects categoryWinners with invalid category', () => {
  const bad = [{ ...validWinners[0], category: 'speed' }];
  const r = runValidator({
    updated: '2026-04-22',
    categoryWinners: bad,
    models: [validModel]
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /categoryWinners\[0\] invalid category: speed/);
});

test('rejects duplicate categoryWinners entries for the same category', () => {
  const dup = [validWinners[0], { ...validWinners[0] }];
  const r = runValidator({
    updated: '2026-04-22',
    categoryWinners: dup,
    models: [validModel]
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /duplicate category: coding/);
});

test('rejects HTML-unsafe characters in sidebarPicks label', () => {
  const r = runValidator({
    updated: '2026-04-22',
    sidebarPicks: [{ modelId: 'test-1', label: '<img src=x>' }],
    models: [validModel]
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sidebarPicks\[0\] field "label" contains HTML-unsafe characters/);
});

test('rejects HTML-unsafe characters in categoryWinners tagline', () => {
  const r = runValidator({
    updated: '2026-04-22',
    categoryWinners: [{ ...validWinners[0], tagline: '<script>alert(1)</script>' }],
    models: [validModel]
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /categoryWinners\[0\] field "tagline" contains HTML-unsafe characters/);
});

test('rejects missing required fields on sidebarPicks/categoryWinners entries', () => {
  const r1 = runValidator({
    updated: '2026-04-22',
    sidebarPicks: [{ modelId: 'test-1' }],
    models: [validModel]
  });
  assert.equal(r1.status, 1);
  assert.match(r1.stderr, /sidebarPicks\[0\] missing string field: label/);

  const r2 = runValidator({
    updated: '2026-04-22',
    categoryWinners: [{ category: 'coding', modelId: 'test-1', tagline: 'x' }],
    models: [validModel]
  });
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /categoryWinners\[0\] missing string field: label/);
});

test('rejects longContextInputRate without threshold', () => {
  const m = { ...validModel, longContextInputRate: 5 };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /longContextInputRate but no longContextThreshold/);
});

/* ─── source + verifiedAt provenance fields ─── */

test('accepts model with source + verifiedAt', () => {
  const m = { ...validModel, source: 'https://openai.com/api/pricing/', verifiedAt: '2026-04-22' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 0, r.stderr);
});

test('accepts model with neither source nor verifiedAt (both optional)', () => {
  const r = runValidator({ updated: '2026-04-22', models: [validModel] });
  assert.equal(r.status, 0, r.stderr);
});

test('rejects source without verifiedAt', () => {
  const m = { ...validModel, source: 'https://openai.com/api/pricing/' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /must specify both "source" and "verifiedAt" together/);
});

test('rejects verifiedAt without source', () => {
  const m = { ...validModel, verifiedAt: '2026-04-22' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /must specify both "source" and "verifiedAt" together/);
});

test('rejects non-https source URL scheme', () => {
  const m = { ...validModel, source: 'ftp://openai.com/pricing', verifiedAt: '2026-04-22' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /source must be an http\(s\) URL/);
});

test('rejects javascript: in source URL', () => {
  const m = { ...validModel, source: 'javascript:alert(1)', verifiedAt: '2026-04-22' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  /* Either the http(s)-only check fires first, or the HTML_UNSAFE_RE check does — both are correct rejections. */
  assert.match(r.stderr, /source/);
});

test('rejects malformed verifiedAt', () => {
  const m = { ...validModel, source: 'https://openai.com/api/pricing/', verifiedAt: 'April 22 2026' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /verifiedAt must be a YYYY-MM-DD/);
});

test('rejects verifiedAt later than top-level updated', () => {
  const m = { ...validModel, source: 'https://openai.com/api/pricing/', verifiedAt: '2026-05-01' };
  const r = runValidator({ updated: '2026-04-22', models: [m] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /verifiedAt .* is after top-level updated/);
});
