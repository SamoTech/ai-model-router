'use strict';

/* ─── HTML escape — applied to every JSON-sourced string before innerHTML ─── */
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(v) {
  if (v == null) return '';
  return String(v).replace(/[&<>"']/g, c => ESC_MAP[c]);
}

/* ─── Theme init — synchronous, before any fetch ─── */
const THEME_STORAGE_KEY = 'ai-model-router:theme';
function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch (_) { return null; }
}
let currentTheme =
  readStoredTheme() ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function applyThemeTokens(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.getElementById('themeColorMeta');
  if (meta) meta.content = theme === 'dark' ? '#12110f' : '#f7f6f2';
  document.querySelectorAll('[data-theme-toggle]').forEach(btn =>
    btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode')
  );
}
applyThemeTokens(currentTheme);
function setTheme(next) {
  currentTheme = next;
  applyThemeTokens(next);
  try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (_) { /* private mode / quota */ }
  /* Theme change requires full chart re-init to pick up new CSS color vars */
  if (modelData.length) { destroyCharts(); initRadar(); calculateCosts(); }
}

/* ─── State ─── */
let modelData        = [];
let barChart         = null;
let radarChart       = null;
let radarSelectedIds = [];

/* Active filters: null = no filter active */
let filterProvider = null;  /* string | null */
let filterVerdict  = null;  /* 'good' | 'warn' | 'bad' | null */

/* ─── Shared Chart.js animation config ─── */
const NO_ANIMATION = {
  animation: false, animations: false,
  transitions: { active: { animation: { duration: 0 } } }
};

/* ─── Utilities ─── */
const dollars  = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
const colorVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ─── URL hash state — includes calculator params AND filters ─── */
const CALC_PARAMS = ['inputTokens', 'outputTokens', 'avgPrompt', 'voiceMinutes'];

function syncHash() {
  const p = new URLSearchParams();
  CALC_PARAMS.forEach(id => p.set(id, document.getElementById(id).value));
  if (filterProvider) p.set('provider', filterProvider);
  if (filterVerdict)  p.set('verdict',  filterVerdict);
  history.replaceState(null, '', '#' + p.toString());
}

function restoreFromHash() {
  const p = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  CALC_PARAMS.forEach(id => { const v = p.get(id); if (v !== null) document.getElementById(id).value = v; });
  return p;
}

/* Read filters from `p` and make state match it exactly.
 * `applyOnly` mode is for back/forward navigation: caller must NOT call
 * syncHash() afterwards — doing so inside a hashchange handler corrupts
 * the history entry the user just navigated to (replaceState rewrites
 * the current entry). For initial-load mode (default), syncHash() is
 * called so that any filter set via `setProviderFilter`/`setVerdictFilter`
 * is reflected in the URL. */
function applyFilterFromHash(p, { applyOnly = false } = {}) {
  filterProvider = null;
  filterVerdict  = null;
  const prov = p.get('provider');
  const verd = p.get('verdict');
  if (prov) setProviderFilter(prov, false);
  if (verd) setVerdictFilter(verd, false);
  renderFilteredMatrix();
  updateFilterUI();
  if (!applyOnly) syncHash();
}

/* ─── Verdict badge helper — verdict is whitelisted, label is escaped ─── */
const VALID_VERDICTS = ['good', 'warn', 'bad'];
function verdictBadge(v, l) {
  const verdictClass = VALID_VERDICTS.includes(v) ? v : 'warn';
  return `<span class="badge ${verdictClass}">${esc(l)}</span>`;
}

/* ─── Per-entry validation — mirrors scripts/validate-models.mjs ─── */
const REQUIRED_FIELDS = ['id','name','provider','contextWindow','bestAt','verdict','verdictLabel','take','color','radar'];
const REQUIRED_RADAR  = ['coding','longContext','voice','computerUse','costEfficiency'];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const SOURCE_URL_RE = /^https?:\/\/[^\s<>"']+$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validateEntry(m, idx) {
  const missing = REQUIRED_FIELDS.filter(f => m[f] === undefined || m[f] === null || m[f] === '');
  if (missing.length) throw new Error(`Model at index ${idx} ("${m.id || 'unknown'}") missing fields: ${missing.join(', ')}`);
  if (!VALID_VERDICTS.includes(m.verdict)) throw new Error(`Model "${m.id}" invalid verdict: ${m.verdict}`);
  if (typeof m.color !== 'string' || !COLOR_RE.test(m.color)) throw new Error(`Model "${m.id}" invalid color: ${m.color}`);
  if (typeof m.radar !== 'object' || !m.radar) throw new Error(`Model "${m.id}" radar missing`);
  const mr = REQUIRED_RADAR.filter(k => m.radar[k] === undefined);
  if (mr.length) throw new Error(`Model "${m.id}" radar missing: ${mr.join(', ')}`);
  for (const k of REQUIRED_RADAR) {
    const val = m.radar[k];
    if (!Number.isInteger(val) || val < 0 || val > 10) throw new Error(`Model "${m.id}" radar.${k} out of range 0-10: ${val}`);
  }
  /* Provenance fields are optional but if either appears, both must — and the
   * server validator (scripts/validate-models.mjs) is authoritative. We only
   * enforce the URL-shape check here so a malformed source can't slip past
   * the client renderer (the matrix interpolates m.source into an href). */
  const hasSrc = m.source != null && m.source !== '';
  const hasVer = m.verifiedAt != null && m.verifiedAt !== '';
  if (hasSrc !== hasVer) throw new Error(`Model "${m.id}" must specify both source and verifiedAt together`);
  if (hasSrc && (typeof m.source !== 'string' || !SOURCE_URL_RE.test(m.source))) {
    throw new Error(`Model "${m.id}" source must be an http(s) URL: ${m.source}`);
  }
  if (hasVer && (typeof m.verifiedAt !== 'string' || !DATE_RE.test(m.verifiedAt))) {
    throw new Error(`Model "${m.id}" verifiedAt must be YYYY-MM-DD: ${m.verifiedAt}`);
  }
}

/* ─── Filter logic ─── */
function setProviderFilter(value, sync) {
  filterProvider = (filterProvider === value) ? null : value;
  if (sync !== false) { renderFilteredMatrix(); updateFilterUI(); syncHash(); }
}

function setVerdictFilter(value, sync) {
  filterVerdict = (filterVerdict === value) ? null : value;
  if (sync !== false) { renderFilteredMatrix(); updateFilterUI(); syncHash(); }
}

function clearAllFilters() {
  filterProvider = null;
  filterVerdict  = null;
  renderFilteredMatrix();
  updateFilterUI();
  syncHash();
}

/* ─── Build provider filter chips from JSON (no hardcoding) ─── */
function buildProviderFilters() {
  const seen = new Set();
  const providers = [];
  modelData.forEach(m => {
    const label = (m.provider === 'Meta / hosted vendors' || m.provider === 'Open / self-host')
      ? 'Open' : m.provider;
    if (!seen.has(label)) { seen.add(label); providers.push(label); }
  });

  const container = document.getElementById('providerFilters');
  container.innerHTML = providers.map(p =>
    `<button class="filter-chip" data-provider="${esc(p)}" aria-pressed="false">${esc(p)}</button>`
  ).join('');
  container.querySelectorAll('[data-provider]').forEach(btn =>
    btn.addEventListener('click', () => setProviderFilter(btn.dataset.provider))
  );
}

function filteredModelsResolved() {
  return modelData.filter(m => {
    const provOk = filterProvider === null ||
      (filterProvider === 'Open'
        ? (m.provider === 'Meta / hosted vendors' || m.provider === 'Open / self-host')
        : m.provider === filterProvider);
    const verdOk = filterVerdict === null || m.verdict === filterVerdict;
    return provOk && verdOk;
  });
}

/* ─── Render: filtered matrix rows + empty state ─── */
function renderFilteredMatrix() {
  const rows = filteredModelsResolved();
  const tbody = document.getElementById('matrixBody');
  const empty = document.getElementById('matrixEmpty');

  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.classList.add('visible');
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    return;
  }
  empty.classList.remove('visible');
  tbody.innerHTML = rows.map(m => {
    const hasLongCtx  = m.longContextInputRate != null && m.longContextThreshold != null;
    const inputCell   = m.inputRate != null ? `$${esc(m.inputRate)}` : 'Vendor / self-host';
    const longCtxNote = hasLongCtx
      ? ` <span class="small faint">($${esc(m.longContextInputRate)} long-ctx &gt;${esc((m.longContextThreshold/1000).toFixed(0))}K)</span>`
      : '';
    const outputCell  = m.outputRate != null ? `$${esc(m.outputRate)}` : 'Vendor / self-host';
    const audioNote   = m.audioOutputRate != null
      ? ` <span class="small faint">/ $${esc(m.audioOutputRate)} audio</span>`
      : '';
    return `
    <tr>
      <td><strong>${esc(m.name)}</strong>${sourceLink(m)}</td>
      <td>${esc(m.provider)}</td>
      <td>${inputCell}${longCtxNote}</td>
      <td>${outputCell}${audioNote}</td>
      <td>${esc(m.contextWindow)}</td>
      <td>${esc(m.bestAt)}</td>
      <td>${verdictBadge(m.verdict, m.verdictLabel)}</td>
      <td>${esc(m.take)}</td>
    </tr>`;
  }).join('');
}

/* ─── Provenance link for the matrix's Model column ───
 * Renders a small "↗ verified YYYY-MM-DD" link next to the model name when both
 * `source` and `verifiedAt` are present in JSON. The validator already enforces
 * that they appear together and that source matches /^https?:…/, so the
 * URL is safe to interpolate after esc(). The link opens in a new tab with
 * rel="noopener noreferrer" so the source page can't reach back into ours. */
function sourceLink(m) {
  if (!m.source || !m.verifiedAt) return '';
  const url = esc(m.source);
  const date = esc(m.verifiedAt);
  return ` <a class="source-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="View ${esc(m.provider)} pricing source (verified ${date})" title="Verified ${date} — ${url}">verified ${date}<span aria-hidden="true"> ↗</span></a>`;
}

function renderMatrix() { renderFilteredMatrix(); }

/* ─── Update filter chip active states + count badge + clear button ─── */
function updateFilterUI() {
  document.querySelectorAll('[data-provider]').forEach(btn => {
    const active = btn.dataset.provider === filterProvider;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
  document.querySelectorAll('[data-verdict]').forEach(btn => {
    const active = btn.dataset.verdict === filterVerdict;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
  const count = (filterProvider ? 1 : 0) + (filterVerdict ? 1 : 0);
  const badge = document.getElementById('filterCount');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
  const clearBtn = document.getElementById('filterClearBtn');
  clearBtn.classList.toggle('visible', count > 0);
  if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
}

/* ─── Render: Sidebar picks ─── */
function renderSidebar() {
  const picks = [
    ['Best coding agent', 'Claude Opus 4.6'],
    ['Best long context + computer use', 'GPT-5.4'],
    ['Best cheap traffic', 'Gemini 3.1 Flash-Lite'],
    ['Best voice / realtime', 'Gemini Flash Live'],
  ];
  const el = document.getElementById('sidebarPicks');
  el.classList.remove('loading');
  el.innerHTML = picks.map(([label, name]) =>
    `<div><strong>${esc(name)}</strong><div class="small muted">${esc(label)}</div></div>`
  ).join('');
}

/* ─── Render: Benchmark rows ─── */
function renderBenchmarks(updated) {
  const prioritized = ['GPT-5.4', 'Claude Opus 4.6', 'Gemini 3.1 Flash-Lite'];
  const rows = modelData
    .filter(m => prioritized.includes(m.name))
    .map(m => {
      const bm = Object.entries(m.benchmarks || {});
      const values = bm.length
        ? bm.map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ')
        : 'No benchmark claims stored.';
      return `<div class="result-row"><div><strong>${esc(m.name)}</strong><div class="small muted">${values}</div></div><div style="text-align:right"><strong>${esc(m.provider)}</strong></div></div>`;
    }).join('');
  document.getElementById('benchmarkRows').innerHTML = rows;
  document.getElementById('updatedAt').textContent = updated;
}

/* ─── Radar ─── */
const MAX_RADAR = 6;
const RADAR_DEFAULT_IDS = ['claude-opus-4-6', 'gpt-5-4', 'gemini-3-1-flash-lite', 'gemini-flash-live'];

function buildRadarControls() {
  const container = document.getElementById('radarControls');
  const modelsWithRadar = modelData.filter(m => m.radar);
  const seedIds = RADAR_DEFAULT_IDS.filter(id => modelsWithRadar.some(m => m.id === id));
  radarSelectedIds = seedIds.length > 0 ? seedIds : modelsWithRadar.slice(0, 4).map(m => m.id);
  /* m.color is validated by validateEntry against /^#[0-9a-fA-F]{6}$/, so safe to inline in style */
  container.innerHTML = modelsWithRadar.map(m => {
    const isActive = radarSelectedIds.includes(m.id);
    const styleAttr = isActive ? `border-color:${m.color};color:${m.color}` : '';
    return `<button class="radar-chip ${isActive ? 'active' : ''}" data-model-id="${esc(m.id)}" style="${styleAttr}" aria-pressed="${isActive}">${esc(m.name)}</button>`;
  }).join('');
  container.querySelectorAll('.radar-chip').forEach(btn =>
    btn.addEventListener('click', () => toggleRadarModel(btn.dataset.modelId))
  );
}

function toggleRadarModel(id) {
  const idx = radarSelectedIds.indexOf(id);
  if (idx > -1) { if (radarSelectedIds.length === 1) return; radarSelectedIds.splice(idx, 1); }
  else { if (radarSelectedIds.length >= MAX_RADAR) return; radarSelectedIds.push(id); }
  document.querySelectorAll('.radar-chip').forEach(btn => {
    const active = radarSelectedIds.includes(btn.dataset.modelId);
    btn.classList.toggle('active', active);
    const m = modelData.find(x => x.id === btn.dataset.modelId);
    btn.style.borderColor = active ? m.color : 'transparent';
    btn.style.color = active ? m.color : '';
    btn.setAttribute('aria-pressed', active);
  });
  updateRadar();
}

function destroyCharts() {
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (barChart)   { barChart.destroy();  barChart  = null; }
}

/* ─── initRadar: create instance once; reuse on subsequent calls ─── */
function initRadar() {
  if (typeof Chart === 'undefined') return;
  const labels = ['Coding', 'Long context', 'Voice', 'Computer use', 'Cost efficiency'];
  const datasets = modelData.filter(m => m.radar && radarSelectedIds.includes(m.id)).map(m => ({
    label: m.name,
    data: [m.radar.coding, m.radar.longContext, m.radar.voice, m.radar.computerUse, m.radar.costEfficiency],
    borderColor: m.color, backgroundColor: m.color + '22',
  }));

  if (radarChart) {
    /* Reuse existing instance — update data in place, no flicker */
    radarChart.data.datasets = datasets;
    radarChart.options.scales.r.pointLabels.color = colorVar('--color-text-muted');
    radarChart.options.plugins.legend.labels.color = colorVar('--color-text-muted');
    radarChart.update('none');
    return;
  }

  radarChart = new Chart(document.getElementById('radarChart'), {
    type: 'radar', data: { labels, datasets },
    options: {
      ...NO_ANIMATION, responsive: true, maintainAspectRatio: false,
      scales: { r: { min: 0, max: 10, ticks: { display: false }, grid: { color: 'rgba(128,128,128,0.15)' }, pointLabels: { color: colorVar('--color-text-muted'), font: { size: 12 } } } },
      plugins: { legend: { labels: { color: colorVar('--color-text-muted'), boxWidth: 14 } } }
    }
  });
}

/* ─── updateRadar: mutate datasets on chip toggle, never destroy ─── */
function updateRadar() {
  if (!radarChart) { initRadar(); return; }
  radarChart.data.datasets = modelData
    .filter(m => m.radar && radarSelectedIds.includes(m.id))
    .map(m => ({
      label: m.name,
      data: [m.radar.coding, m.radar.longContext, m.radar.voice, m.radar.computerUse, m.radar.costEfficiency],
      borderColor: m.color, backgroundColor: m.color + '22',
    }));
  radarChart.update('none');
}

/* ─── Calculator ─── */
/* Pass `{ skipHashSync: true }` from inside a hashchange handler so we
 * don't replaceState() over the history entry the user just navigated to. */
function calculateCosts({ skipHashSync = false } = {}) {
  if (!modelData.length) return;
  const input        = Number(document.getElementById('inputTokens').value  || 0);
  const output       = Number(document.getElementById('outputTokens').value || 0);
  const avgPrompt    = Number(document.getElementById('avgPrompt').value    || 0);
  const voiceMinutes = Number(document.getElementById('voiceMinutes').value || 0);
  const calcModels   = modelData.filter(m => m.inputRate !== null);
  const longCtxActive = [];

  const rows = calcModels.map(m => {
    const hasLongCtx       = m.longContextInputRate != null && m.longContextThreshold != null;
    const longCtxTriggered = hasLongCtx && avgPrompt > m.longContextThreshold;
    const effectiveInRate  = longCtxTriggered ? m.longContextInputRate : m.inputRate;
    if (longCtxTriggered) longCtxActive.push(`${m.name} (>${(m.longContextThreshold/1000).toFixed(0)}K tokens → $${m.longContextInputRate}/1M)`);
    let total = (input / 1e6) * effectiveInRate + (output / 1e6) * (m.outputRate || 0);
    if (m.perMinute && voiceMinutes > 0) total += voiceMinutes * m.perMinute;
    return { ...m, effectiveInRate, total };
  }).sort((a, b) => a.total - b.total);

  document.getElementById('calcResults').innerHTML = rows.map((r, i) =>
    `<div class="result-row">
      <div><div><strong>${i + 1}. ${esc(r.name)}</strong></div>
      <div class="small muted">Input $${esc(r.effectiveInRate)}/1M · Output $${esc(r.outputRate)}/1M</div></div>
      <div style="text-align:right"><strong>${esc(dollars(r.total))}</strong></div>
    </div>`
  ).join('');

  document.getElementById('calcHint').textContent = longCtxActive.length > 0
    ? 'Long-context surcharge active for: ' + longCtxActive.join('; ') + '.'
    : 'All models on base input rates (avg prompt within standard pricing tier).';

  if (typeof Chart === 'undefined') return;
  const labels    = rows.map(r => r.name);
  const data      = rows.map(r => Number(r.total.toFixed(2)));
  const colors    = rows.map(r => r.color);
  const axisColor = colorVar('--color-text-muted');
  const gridColor = currentTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (!barChart) {
    barChart = new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Monthly cost', data, borderRadius: 10, backgroundColor: colors }] },
      options: { ...NO_ANIMATION, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: axisColor }, grid: { display: false } }, y: { ticks: { color: axisColor }, grid: { color: gridColor } } } }
    });
  } else {
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    barChart.data.datasets[0].backgroundColor = colors;
    barChart.options.scales.x.ticks.color = axisColor;
    barChart.options.scales.y.ticks.color = axisColor;
    barChart.options.scales.y.grid.color   = gridColor;
    barChart.update('none');
  }
  if (!skipHashSync) syncHash();
}

/* ─── Single debounce timer for calculator inputs ─── */
let calcDebounce;
function debouncedCalculate() { clearTimeout(calcDebounce); calcDebounce = setTimeout(calculateCosts, 300); }

/* ─── Error rendering ─── */
function renderError(message) {
  destroyCharts();
  const safe = esc(message);
  document.getElementById('matrixBody').innerHTML    = `<tr><td colspan="8"><div class="error-box" role="alert">${safe}</div></td></tr>`;
  document.getElementById('benchmarkRows').innerHTML = `<div class="error-box" role="alert">${safe}</div>`;
  document.getElementById('sidebarPicks').classList.remove('loading');
  document.getElementById('sidebarPicks').innerHTML  = `<div class="error-box" role="alert">${safe}</div>`;
  document.getElementById('updatedAt').textContent   = 'Unavailable';
  document.getElementById('statusBox').className     = 'error-box';
  document.getElementById('statusBox').textContent   = message;
  document.getElementById('calcResults').innerHTML   = `<div class="error-box" role="alert">Unable to calculate costs until model data loads.</div>`;
  document.getElementById('calcHint').textContent    = '';
}

/* ─── Data loader ─── */
async function loadData() {
  try {
    const res = await fetch('./data/models.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load model data (HTTP ${res.status})`);
    const data = await res.json();
    if (!data || !Array.isArray(data.models)) throw new Error('Invalid data/models.json: "models" array missing');
    data.models.forEach((m, idx) => validateEntry(m, idx));
    modelData = data.models;
    renderMatrix();
    renderSidebar();
    renderBenchmarks(data.updated || 'Unknown');
    document.getElementById('statusBox').className   = 'muted';
    document.getElementById('statusBox').textContent = `Loaded ${modelData.length} models successfully.`;
    buildProviderFilters();
    buildRadarControls();
    initRadar();
    /* Skip hash sync here: filterProvider/filterVerdict are still null at this point,
     * so syncHash() would overwrite the URL with only calculator params and strip any
     * provider/verdict params from the incoming shared/bookmarked link before
     * applyFilterFromHash can read them. applyFilterFromHash below calls syncHash()
     * itself once filters are applied. */
    calculateCosts({ skipHashSync: true });
    const hashParams = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    applyFilterFromHash(hashParams);
  } catch (err) {
    renderError(err.message || 'Dashboard failed to load model data.');
  }
}

/* ─── Init ─── */
function init() {
  restoreFromHash();
  document.querySelectorAll('[data-theme-toggle]').forEach(btn =>
    btn.addEventListener('click', () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'))
  );
  CALC_PARAMS.forEach(id =>
    document.getElementById(id).addEventListener('input', debouncedCalculate)
  );
  document.getElementById('filterClearBtn').addEventListener('click', clearAllFilters);
  document.getElementById('emptyStateClear').addEventListener('click', clearAllFilters);
  document.querySelectorAll('[data-verdict]').forEach(btn =>
    btn.addEventListener('click', () => setVerdictFilter(btn.dataset.verdict))
  );
  window.addEventListener('hashchange', () => {
    const p = restoreFromHash();
    applyFilterFromHash(p, { applyOnly: true });
    if (modelData.length) calculateCosts({ skipHashSync: true });
  });
  if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  loadData();
}

window.addEventListener('DOMContentLoaded', init);
