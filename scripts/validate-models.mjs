#!/usr/bin/env node
/**
 * Single source of truth for `data/models.json` validation.
 * Used by `.github/workflows/validate.yml` and `.github/workflows/pages.yml`.
 *
 * Exit code 0 = valid, 1 = one or more errors.
 *
 * Checks:
 *   - top-level shape (`updated` ISO-ish string, `models` array)
 *   - per-model required fields
 *   - unique `id` and `color`
 *   - color format `#rrggbb`
 *   - whitelisted `verdict`
 *   - radar object: required keys, integers in [0, 10]
 *   - XSS-character scan on every user-facing string field — the dashboard
 *     renders these via innerHTML, so any of < > & " ' must come pre-escaped
 *     and is rejected at the data layer to keep authoring obvious.
 *   - optional `source` (https URL) + `verifiedAt` (YYYY-MM-DD) provenance
 *     fields — must appear together; `verifiedAt` must be ≤ top-level `updated`.
 *   - optional `sidebarPicks` and `categoryWinners` arrays: structure +
 *     XSS scan on prose fields, and every `modelId` must reference an
 *     existing model id.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const FILE = process.argv[2] || path.join(process.cwd(), 'data', 'models.json');

const REQUIRED = ['id', 'name', 'provider', 'inputRate', 'outputRate', 'contextWindow', 'color', 'bestAt', 'verdict', 'verdictLabel', 'take', 'radar'];
const RADAR_KEYS = ['coding', 'longContext', 'voice', 'computerUse', 'costEfficiency'];
const VALID_VERDICTS = new Set(['good', 'warn', 'bad']);
const VALID_PROVIDERS = new Set([
  'OpenAI', 'Anthropic', 'Google', 'Mistral', 'Cohere', 'xAI',
  'Meta / hosted vendors', 'Open / self-host'
]);
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* Fields rendered into the DOM. The runtime escapes all five HTML special
 * characters defensively, but `<` / `>` and javascript:/data:text/html URI
 * schemes in prose data are virtually always either a copy-paste mistake or
 * an injection attempt — flag them at the data layer. Apostrophes and
 * ampersands are common in English prose and are handled by `esc()`. */
const USER_FACING_STRING_FIELDS = ['name', 'provider', 'contextWindow', 'bestAt', 'verdictLabel', 'take'];
const HTML_UNSAFE_RE = /[<>]|javascript:|data:text\/html/i;

const errors = [];
function fail(msg) { errors.push(msg); }

let raw;
try {
  raw = fs.readFileSync(FILE, 'utf8');
} catch (e) {
  console.error(`ERROR: cannot read ${FILE}: ${e.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`ERROR: ${FILE} is not valid JSON: ${e.message}`);
  process.exit(1);
}

if (!data || typeof data !== 'object') fail('top-level must be an object');
if (typeof data.updated !== 'string' || !DATE_RE.test(data.updated)) {
  fail(`top-level "updated" must be a YYYY-MM-DD string (got ${JSON.stringify(data.updated)})`);
}
if (!Array.isArray(data.models)) fail('top-level "models" must be an array');

const ids = new Map();
const colors = new Map();

if (Array.isArray(data.models)) {
  data.models.forEach((m, i) => {
    const tag = `models[${i}]${m && m.id ? ` ("${m.id}")` : ''}`;

    if (!m || typeof m !== 'object') { fail(`${tag} must be an object`); return; }

    for (const key of REQUIRED) {
      if (!(key in m)) fail(`${tag} missing required field: ${key}`);
    }

    if (typeof m.id === 'string') {
      if (ids.has(m.id)) fail(`${tag} duplicate id: ${m.id} (also at models[${ids.get(m.id)}])`);
      else ids.set(m.id, i);
    }

    if (typeof m.color === 'string') {
      if (!COLOR_RE.test(m.color)) fail(`${tag} invalid color: ${m.color} (expected #rrggbb)`);
      else if (colors.has(m.color)) fail(`${tag} duplicate color: ${m.color} (also at models[${colors.get(m.color)}])`);
      else colors.set(m.color, i);
    }

    if (m.provider != null && !VALID_PROVIDERS.has(m.provider)) {
      fail(`${tag} invalid provider: ${m.provider} — allowed: ${[...VALID_PROVIDERS].join(', ')}`);
    }

    if (m.verdict != null && !VALID_VERDICTS.has(m.verdict)) {
      fail(`${tag} invalid verdict: ${m.verdict} — allowed: ${[...VALID_VERDICTS].join(', ')}`);
    }

    if (m.radar && typeof m.radar === 'object') {
      for (const k of RADAR_KEYS) {
        if (!(k in m.radar)) fail(`${tag} radar.${k} missing`);
        else {
          const v = m.radar[k];
          if (!Number.isInteger(v) || v < 0 || v > 10) fail(`${tag} radar.${k} out of range 0-10: ${v}`);
        }
      }
    } else if (m.radar !== undefined) {
      fail(`${tag} radar must be an object`);
    }

    /* XSS-character scan on user-facing string fields */
    for (const field of USER_FACING_STRING_FIELDS) {
      const v = m[field];
      if (typeof v === 'string' && HTML_UNSAFE_RE.test(v)) {
        fail(`${tag} field "${field}" contains HTML-unsafe characters: ${JSON.stringify(v)}`);
      }
    }

    /* Pricing field types — null or non-negative number */
    for (const field of ['inputRate', 'outputRate', 'longContextInputRate', 'longContextThreshold', 'audioInputRate', 'audioOutputRate', 'perMinute']) {
      if (field in m && m[field] !== null) {
        if (typeof m[field] !== 'number' || m[field] < 0 || !Number.isFinite(m[field])) {
          fail(`${tag} ${field} must be null or a non-negative number (got ${JSON.stringify(m[field])})`);
        }
      }
    }

    /* longContextInputRate without threshold is meaningless */
    if (m.longContextInputRate != null && m.longContextThreshold == null) {
      fail(`${tag} has longContextInputRate but no longContextThreshold`);
    }

    /* Provenance: optional `source` (https URL) + optional `verifiedAt` (YYYY-MM-DD).
     * Optional today so existing rows stay valid; the dashboard surfaces them when present.
     * If either is supplied, both must be — a URL with no verification date is misleading,
     * and a date with no URL has nothing to point at. */
    const hasSource = 'source' in m && m.source !== null && m.source !== '';
    const hasVerifiedAt = 'verifiedAt' in m && m.verifiedAt !== null && m.verifiedAt !== '';
    if (hasSource !== hasVerifiedAt) {
      fail(`${tag} must specify both "source" and "verifiedAt" together (or neither); got source=${JSON.stringify(m.source)}, verifiedAt=${JSON.stringify(m.verifiedAt)}`);
    }
    if (hasSource) {
      if (typeof m.source !== 'string') {
        fail(`${tag} source must be a string (got ${typeof m.source})`);
      } else if (!/^https?:\/\/[^\s<>"']+$/i.test(m.source)) {
        fail(`${tag} source must be an http(s) URL with no whitespace or HTML-unsafe characters (got ${JSON.stringify(m.source)})`);
      } else if (HTML_UNSAFE_RE.test(m.source)) {
        fail(`${tag} source contains HTML-unsafe characters: ${JSON.stringify(m.source)}`);
      }
    }
    if (hasVerifiedAt) {
      if (typeof m.verifiedAt !== 'string' || !DATE_RE.test(m.verifiedAt)) {
        fail(`${tag} verifiedAt must be a YYYY-MM-DD string (got ${JSON.stringify(m.verifiedAt)})`);
      } else if (m.verifiedAt > data.updated) {
        /* The per-model verification date should never be later than the file-level
         * "updated" timestamp — otherwise the file is claiming to know about
         * verifications that happened after it was last touched. */
        fail(`${tag} verifiedAt (${m.verifiedAt}) is after top-level updated (${data.updated})`);
      }
    }
  });
}

/* ─── Optional homepage highlight arrays ────────────────────────────────── */

const VALID_CATEGORIES = new Set(['coding', 'context', 'voice', 'cheap']);

function validateRefArray(arr, fieldName, perItemFn) {
  if (arr === undefined) return;
  if (!Array.isArray(arr)) { fail(`top-level "${fieldName}" must be an array`); return; }
  arr.forEach((entry, i) => {
    const tag = `${fieldName}[${i}]`;
    if (!entry || typeof entry !== 'object') { fail(`${tag} must be an object`); return; }
    if (typeof entry.modelId !== 'string')   { fail(`${tag} missing string field: modelId`); return; }
    if (!ids.has(entry.modelId))             { fail(`${tag} references unknown modelId: ${entry.modelId}`); }
    perItemFn(entry, tag);
  });
}

validateRefArray(data.sidebarPicks, 'sidebarPicks', (entry, tag) => {
  if (typeof entry.label !== 'string') { fail(`${tag} missing string field: label`); return; }
  if (HTML_UNSAFE_RE.test(entry.label)) fail(`${tag} field "label" contains HTML-unsafe characters: ${JSON.stringify(entry.label)}`);
});

const seenCategories = new Set();
validateRefArray(data.categoryWinners, 'categoryWinners', (entry, tag) => {
  if (typeof entry.category !== 'string')          { fail(`${tag} missing string field: category`); }
  else if (!VALID_CATEGORIES.has(entry.category))  { fail(`${tag} invalid category: ${entry.category} — allowed: ${[...VALID_CATEGORIES].join(', ')}`); }
  else if (seenCategories.has(entry.category))     { fail(`${tag} duplicate category: ${entry.category}`); }
  else                                             { seenCategories.add(entry.category); }
  for (const f of ['label', 'tagline']) {
    if (typeof entry[f] !== 'string') { fail(`${tag} missing string field: ${f}`); }
    else if (HTML_UNSAFE_RE.test(entry[f])) fail(`${tag} field "${f}" contains HTML-unsafe characters: ${JSON.stringify(entry[f])}`);
  }
  if (entry.displayName !== undefined) {
    if (typeof entry.displayName !== 'string') { fail(`${tag} field "displayName" must be a string when present`); }
    else if (HTML_UNSAFE_RE.test(entry.displayName)) fail(`${tag} field "displayName" contains HTML-unsafe characters: ${JSON.stringify(entry.displayName)}`);
  }
});

if (errors.length) {
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\n${errors.length} validation error(s) in ${FILE}`);
  process.exit(1);
}

console.log(`OK — ${data.models.length} models passed validation (${FILE})`);
