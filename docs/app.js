/* FitLog – persönliches Trainingstagebuch.
   Läuft komplett im Browser, Daten liegen nur lokal (localStorage) auf dem Gerät. */
'use strict';

/* =====================================================================
   Konstanten & Hilfsfunktionen
   ===================================================================== */

const STORE_KEY = 'fitlog.v1';
const GROUPS = ['Brust', 'Rücken', 'Schultern', 'Arme', 'Beine', 'Core', 'Sonstiges'];
const STARTER_EXERCISES = [
  ['Bankdrücken', 'Brust'], ['Schrägbankdrücken', 'Brust'], ['Fliegende am Kabel', 'Brust'], ['Liegestütze', 'Brust'],
  ['Kreuzheben', 'Rücken'], ['Klimmzüge', 'Rücken'], ['Latziehen', 'Rücken'], ['Rudern mit Langhantel', 'Rücken'], ['Rudern am Kabel', 'Rücken'],
  ['Schulterdrücken', 'Schultern'], ['Seitheben', 'Schultern'], ['Face Pulls', 'Schultern'],
  ['Bizepscurls', 'Arme'], ['Hammercurls', 'Arme'], ['Trizepsdrücken', 'Arme'], ['Dips', 'Arme'],
  ['Kniebeugen', 'Beine'], ['Beinpresse', 'Beine'], ['Rumänisches Kreuzheben', 'Beine'], ['Ausfallschritte', 'Beine'],
  ['Beinbeuger', 'Beine'], ['Beinstrecker', 'Beine'], ['Wadenheben', 'Beine'],
  ['Beinheben hängend', 'Core'], ['Crunches am Kabel', 'Core'],
];

const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  (function add(list) {
    for (const c of list) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) add(c);
      else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
  })(kids);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  train: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 15l4-5 3 3 5-6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".6"/><circle cx="4.5" cy="12" r=".6"/><circle cx="4.5" cy="18" r=".6"/>',
  data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/>',
};
function icon(name, size = 22) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  })) svg.setAttribute(k, v);
  svg.innerHTML = ICONS[name] || ''; // nur eigene, statische Strings
  return svg;
}
const iconBtn = (name, label, onclick, cls = '') =>
  h('button', { class: `icon-btn ${cls}`.trim(), type: 'button', 'aria-label': label, title: label, onclick }, icon(name, 22));

const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* egal */ } };

/* ----- Datum & Zahlen ----- */

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromDateStr = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => toDateStr(new Date());
const addDays = (s, n) => { const d = fromDateStr(s); d.setDate(d.getDate() + n); return toDateStr(d); };
const weekStart = (s) => addDays(s, -((fromDateStr(s).getDay() + 6) % 7)); // Montag

const dfShort = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const dfDay = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });
const dfFull = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dfYear = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
const dfMonth = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const fmt = (n) => nf.format(Math.round(n * 10) / 10);

function relDay(s) {
  const l = dateLabel(s);
  return l === 'Heute' || l === 'Gestern' || l === 'Morgen' ? l.toLowerCase() : dfDay.format(fromDateStr(s));
}

function dateLabel(s) {
  const t = todayStr();
  if (s === t) return 'Heute';
  if (s === addDays(t, -1)) return 'Gestern';
  if (s === addDays(t, 1)) return 'Morgen';
  return dfShort.format(fromDateStr(s));
}

function parseNum(v, integer = false) {
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 9999) return null;
  return integer ? Math.round(n) : n;
}
const numToInput = (n) => (n == null ? '' : String(n).replace('.', ','));

/* =====================================================================
   Daten (Zustand + Speicher)
   ===================================================================== */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function freshState() {
  return {
    version: 1,
    exercises: STARTER_EXERCISES.map(([name, group]) => ({ id: uid(), name, group, archived: false })),
    workouts: [],
    bodyweight: [],
    settings: { theme: 'auto', lastExport: null },
  };
}

/** Prüft & bereinigt geladene/importierte Daten. Wirft bei völlig ungültigem Format. */
function sanitize(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.workouts) || !Array.isArray(d.exercises)) {
    throw new Error('Das ist keine FitLog-Datei.');
  }
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(+v) && +v >= 0 ? +v : null);
  const exercises = d.exercises
    .filter((e) => e && typeof e.id === 'string' && typeof e.name === 'string')
    .map((e) => ({ id: e.id, name: e.name.slice(0, 80), group: GROUPS.includes(e.group) ? e.group : 'Sonstiges', archived: !!e.archived }));
  const known = new Set(exercises.map((e) => e.id));

  const byDate = new Map();
  for (const w of d.workouts) {
    if (!w || typeof w.date !== 'string' || !DATE_RE.test(w.date) || !Array.isArray(w.entries)) continue;
    const entries = w.entries
      .filter((en) => en && typeof en.exerciseId === 'string' && Array.isArray(en.sets))
      .map((en) => ({ exerciseId: en.exerciseId, sets: en.sets.map((s) => ({ w: num(s && s.w), r: num(s && s.r) })) }));
    for (const en of entries) {
      if (!known.has(en.exerciseId)) {
        known.add(en.exerciseId);
        exercises.push({ id: en.exerciseId, name: 'Unbekannte Übung', group: 'Sonstiges', archived: true });
      }
    }
    const prev = byDate.get(w.date);
    if (prev) prev.entries.push(...entries); // gleiche Tage zusammenführen
    else byDate.set(w.date, { id: typeof w.id === 'string' ? w.id : uid(), date: w.date, note: typeof w.note === 'string' ? w.note : '', entries });
  }

  const bw = new Map();
  for (const b of Array.isArray(d.bodyweight) ? d.bodyweight : []) {
    if (b && typeof b.date === 'string' && DATE_RE.test(b.date) && Number.isFinite(+b.kg) && +b.kg > 0) bw.set(b.date, { date: b.date, kg: +b.kg });
  }
  const st = d.settings || {};
  return {
    version: 1,
    exercises,
    workouts: [...byDate.values()],
    bodyweight: [...bw.values()],
    settings: {
      theme: ['auto', 'light', 'dark'].includes(st.theme) ? st.theme : 'auto',
      lastExport: typeof st.lastExport === 'string' ? st.lastExport : null,
    },
  };
}

function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch (e) {
    console.warn('Gespeicherte Daten nicht lesbar:', e);
    if (raw) lsSet(`${STORE_KEY}.corrupt-${Date.now()}`, raw); // Rohdaten sichern, nie still überschreiben
  }
  return freshState();
}

let state = loadState();
let saveTimer = null;
let savePending = false; // nur schreiben, wenn es wirklich Änderungen gibt
let saveFailedShown = false;

function save(now = false) {
  clearTimeout(saveTimer);
  savePending = true;
  const write = () => {
    savePending = false;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      saveFailedShown = false;
    } catch (e) {
      if (!saveFailedShown) toast('Speichern nicht möglich – bitte Backup erstellen!', true);
      saveFailedShown = true;
    }
  };
  if (now) write(); else saveTimer = setTimeout(write, 250);
}
const flushSave = () => { if (savePending) save(true); };
addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });

/* ----- Abfragen ----- */

const exById = (id) => state.exercises.find((e) => e.id === id);
const exName = (id) => (exById(id) ? exById(id).name : 'Unbekannte Übung');
const workoutOn = (date) => state.workouts.find((w) => w.date === date);
function ensureWorkout(date) {
  let w = workoutOn(date);
  if (!w) { w = { id: uid(), date, note: '', entries: [] }; state.workouts.push(w); }
  return w;
}
function pruneWorkout(date) {
  const w = workoutOn(date);
  if (w && !w.entries.length && !w.note) state.workouts = state.workouts.filter((x) => x !== w);
}
function previousWorkout(date) {
  return state.workouts.filter((w) => w.date < date && w.entries.length).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

const isDone = (s) => s.r > 0;
const setW = (s) => s.w || 0;
const e1rm = (w, r) => (r <= 1 ? w : w * (1 + r / 30)); // Epley

function agg(sets) {
  let maxW = 0, best1 = 0, volume = 0, maxReps = 0;
  for (const s of sets) {
    maxW = Math.max(maxW, s.w);
    best1 = Math.max(best1, e1rm(s.w, s.r));
    volume += s.w * s.r;
    maxReps = Math.max(maxReps, s.r);
  }
  return { maxW, e1rm: best1, volume, maxReps };
}

/** Alle Einheiten je Übung: Map<exerciseId, [{date, sets, maxW, e1rm, volume, maxReps}]> (älteste zuerst) */
function sessionsMap() {
  const m = new Map();
  for (const w of state.workouts) {
    for (const en of w.entries) {
      const sets = en.sets.filter(isDone).map((s) => ({ w: setW(s), r: s.r }));
      if (!sets.length) continue;
      if (!m.has(en.exerciseId)) m.set(en.exerciseId, []);
      m.get(en.exerciseId).push({ date: w.date, sets, ...agg(sets) });
    }
  }
  for (const arr of m.values()) arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return m;
}
const sessionsFor = (id) => sessionsMap().get(id) || [];
const lastSessionBefore = (id, date) => sessionsFor(id).filter((s) => s.date < date).pop();

/** Neuer Rekord gegenüber allen früheren Einheiten? */
function isRecord(exId, date, rawSets) {
  const prev = sessionsFor(exId).filter((s) => s.date < date);
  if (!prev.length) return false;
  const cur = agg(rawSets.filter(isDone).map((s) => ({ w: setW(s), r: s.r })));
  const prevW = Math.max(...prev.map((s) => s.maxW));
  if (cur.maxW > 0 || prevW > 0) return cur.maxW > prevW;
  return cur.maxReps > Math.max(...prev.map((s) => s.maxReps));
}

function fmtSets(sets) {
  const groups = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.w === s.w) last.r.push(s.r); else groups.push({ w: s.w, r: [s.r] });
  }
  return groups.map((g) => `${g.w > 0 ? `${fmt(g.w)} kg` : 'Eigengew.'} × ${g.r.join(', ')}`).join(' · ');
}

function workoutStats(w) {
  let sets = 0, volume = 0;
  for (const en of w.entries) for (const s of en.sets) if (isDone(s)) { sets += 1; volume += setW(s) * s.r; }
  return { sets, volume };
}

/* =====================================================================
   UI-Grundgerüst
   ===================================================================== */

const ui = { tab: 'training', date: todayStr(), progMode: 'ex', progEx: null, progMetric: 'weight' };
const viewEl = $('#view');
const tabsEl = $('#tabs');

const TABS = [
  { id: 'training', label: 'Training', icon: 'train', render: renderTraining },
  { id: 'history', label: 'Verlauf', icon: 'history', render: renderHistory },
  { id: 'progress', label: 'Fortschritt', icon: 'chart', render: renderProgress },
  { id: 'exercises', label: 'Übungen', icon: 'list', render: renderExercises },
  { id: 'data', label: 'Daten', icon: 'data', render: renderData },
];

function render({ keepScroll = true } = {}) {
  const top = viewEl.scrollTop;
  const tab = TABS.find((t) => t.id === ui.tab);
  viewEl.replaceChildren(tab.render());
  viewEl.scrollTop = keepScroll ? top : 0;
  tabsEl.replaceChildren(...TABS.map((t) =>
    h('button', {
      type: 'button',
      'aria-current': t.id === ui.tab ? 'page' : false,
      onclick: () => { if (ui.tab !== t.id) { ui.tab = t.id; render({ keepScroll: false }); } else viewEl.scrollTo({ top: 0, behavior: 'smooth' }); },
    }, icon(t.icon, 24), h('span', {}, t.label))));
}
function go(tab, extra = {}) { Object.assign(ui, extra, { tab }); render({ keepScroll: false }); }

let toastTimer;
function toast(msg, isErr = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `show${isErr ? ' err' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 2800);
}

const pageHead = (title, right) => h('header', { class: 'page-head' }, h('h1', {}, title), right);

function segmented(options, value, onChange, label) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': label || false },
    options.map(([v, text]) => h('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => onChange(v) }, text)));
}

function openSheet(title, body) {
  const root = $('#sheet-root');
  const bodyWrap = h('div', { class: 'sheet-body' }, body);
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('h2', {}, title), iconBtn('x', 'Schließen', () => close())), bodyWrap);
  const backdrop = h('div', { class: 'backdrop', onclick: (e) => { if (e.target === backdrop) close(); } }, sheet);
  root.append(backdrop);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.remove('open');
    setTimeout(() => { backdrop.remove(); if (!root.children.length) document.body.classList.remove('modal-open'); }, 230);
  }
  return { close, setBody: (el) => bodyWrap.replaceChildren(el) };
}

/* =====================================================================
   Tab: Training
   ===================================================================== */

const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function installBanner() {
  if (isStandalone() || !isIOS() || lsGet('fitlog.hideInstall')) return null;
  return h('div', { class: 'banner' },
    h('div', {},
      h('strong', {}, 'Als App aufs iPhone'),
      'Tippe in Safari auf „Teilen“ → „Zum Home-Bildschirm“. Trage Daten erst danach in der App vom Icon ein – sie hat einen eigenen Speicher.'),
    iconBtn('x', 'Hinweis schließen', () => { lsSet('fitlog.hideInstall', '1'); render(); }));
}

function renderTraining() {
  const date = ui.date;
  const w = workoutOn(date);
  const page = h('div', { class: 'page' });
  const banner = installBanner();
  if (banner) page.append(banner);
  page.append(dateBar(date));

  if (!w || !w.entries.length) {
    const prev = previousWorkout(date);
    page.append(h('div', { class: 'empty' },
      h('div', { class: 'empty-icon' }, icon('train')),
      h('h2', {}, 'Noch nichts eingetragen'),
      h('p', {}, 'Füge deine erste Übung hinzu und trage Gewicht und Wiederholungen ein.')));
    page.append(h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => pickExercise(date) }, icon('plus', 20), 'Übung hinzufügen'),
      prev ? h('button', { class: 'btn btn-block', type: 'button', onclick: () => copyWorkout(prev, date) }, `Training vom ${dfDay.format(fromDateStr(prev.date))} übernehmen`) : null));
    return page;
  }

  const summary = h('div', { class: 'card summary', 'aria-label': 'Zusammenfassung' });
  const items = w.entries.map((en) => entryCard(w, en, () => updateAll()));
  function updateAll() {
    items.forEach((i) => i.refresh());
    const st = workoutStats(w);
    summary.replaceChildren(
      h('div', {}, h('b', {}, String(w.entries.length)), h('span', {}, w.entries.length === 1 ? 'Übung' : 'Übungen')),
      h('div', {}, h('b', {}, String(st.sets)), h('span', {}, st.sets === 1 ? 'Satz' : 'Sätze')),
      h('div', {}, h('b', {}, `${nf.format(Math.round(st.volume))} kg`), h('span', {}, 'Volumen')));
  }
  updateAll();

  page.append(h('div', { class: 'stack' },
    items.map((i) => i.el),
    h('button', { class: 'btn btn-dashed', type: 'button', onclick: () => pickExercise(date) }, icon('plus', 20), 'Übung hinzufügen'),
    summary,
    h('textarea', {
      class: 'input', rows: '2', placeholder: 'Notiz zum Training (optional)', 'aria-label': 'Notiz zum Training',
      oninput: (e) => { w.note = e.target.value; save(); },
    }, w.note || ''),
    h('button', {
      class: 'btn btn-danger btn-block', type: 'button',
      onclick: () => {
        if (!confirm(`Das ganze Training vom ${dfFull.format(fromDateStr(date))} löschen?`)) return;
        state.workouts = state.workouts.filter((x) => x !== w);
        save(true); render();
      },
    }, icon('trash', 20), 'Training löschen')));
  return page;
}

function dateBar(date) {
  const set = (d) => { ui.date = d; render({ keepScroll: false }); };
  return h('div', { class: 'datebar' },
    iconBtn('chevL', 'Vorheriger Tag', () => set(addDays(date, -1))),
    h('label', { class: 'datebar-label' },
      h('strong', {}, dateLabel(date)),
      h('span', {}, dfFull.format(fromDateStr(date))),
      h('input', {
        type: 'date', class: 'date-native', value: date, 'aria-label': 'Datum wählen',
        onchange: (e) => { if (DATE_RE.test(e.target.value)) set(e.target.value); },
      })),
    iconBtn('chevR', 'Nächster Tag', () => set(addDays(date, 1))));
}

function copyWorkout(src, date) {
  const w = ensureWorkout(date);
  for (const en of src.entries) w.entries.push({ exerciseId: en.exerciseId, sets: en.sets.map((s) => ({ w: s.w, r: s.r })) });
  save(true);
  render();
}

function newEntry(exId, date) {
  const last = lastSessionBefore(exId, date);
  const first = last ? last.sets[0] : null;
  return { exerciseId: exId, sets: [first ? { w: first.w || null, r: first.r } : { w: null, r: null }] };
}

function pickExercise(date) {
  const w = workoutOn(date);
  openExercisePicker({
    excludeIds: w ? w.entries.map((e) => e.exerciseId) : [],
    onPick: (exId) => {
      const wo = ensureWorkout(date);
      wo.entries.push(newEntry(exId, date));
      save(true);
      render();
      requestAnimationFrame(() => { viewEl.scrollTo({ top: viewEl.scrollHeight, behavior: 'smooth' }); });
    },
  });
}

function entryCard(w, entry, onChange) {
  const ex = exById(entry.exerciseId);
  const last = lastSessionBefore(entry.exerciseId, w.date);
  const setsEl = h('div', { class: 'sets' });
  const volEl = h('span', { class: 'vol' });
  const prEl = h('span', { class: 'pr', hidden: true }, icon('star', 14), 'Neuer Rekord');

  const changed = () => { save(); onChange(); };

  function drawSets() {
    setsEl.replaceChildren(
      h('div', { class: 'set-head', 'aria-hidden': 'true' }, h('span', {}, 'Satz'), h('span', {}, 'kg'), h('span', {}, 'Wdh.'), h('span')),
      ...entry.sets.map((s, i) => h('div', { class: 'set-row' },
        h('span', { class: 'set-n' }, String(i + 1)),
        numInput(s.w, 'decimal', `Gewicht Satz ${i + 1} in Kilogramm`, (v) => { s.w = v; changed(); }, false),
        numInput(s.r, 'numeric', `Wiederholungen Satz ${i + 1}`, (v) => { s.r = v; changed(); }, true),
        iconBtn('x', `Satz ${i + 1} entfernen`, () => { entry.sets.splice(i, 1); drawSets(); save(true); onChange(); }))));
  }
  drawSets();

  const addSet = () => {
    const prevSet = entry.sets[entry.sets.length - 1] || (last ? last.sets[0] : null);
    entry.sets.push(prevSet ? { w: prevSet.w || null, r: prevSet.r } : { w: null, r: null });
    drawSets(); save(true); onChange();
  };

  const el = h('section', { class: 'card', 'aria-label': exName(entry.exerciseId) },
    h('div', { class: 'entry-head' },
      h('div', { class: 'titles' }, h('h3', {}, exName(entry.exerciseId)), ex ? h('span', { class: 'chip' }, ex.group) : null),
      iconBtn('chart', 'Fortschritt ansehen', () => go('progress', { progMode: 'ex', progEx: entry.exerciseId })),
      iconBtn('trash', 'Übung aus Training entfernen', () => {
        const filled = entry.sets.some((s) => s.w != null || s.r != null);
        if (filled && !confirm(`„${exName(entry.exerciseId)}“ aus diesem Training entfernen?`)) return;
        w.entries.splice(w.entries.indexOf(entry), 1);
        pruneWorkout(w.date); save(true); render();
      }, 'danger')),
    h('p', { class: 'hint' },
      last ? [`Letztes Mal (${dfDay.format(fromDateStr(last.date))}): `, h('b', {}, fmtSets(last.sets))] : 'Noch keine Vergleichswerte – das ist dein Startpunkt.'),
    setsEl,
    h('div', { class: 'entry-foot' },
      h('button', { class: 'btn btn-small', type: 'button', onclick: addSet }, icon('plus', 18), 'Satz'),
      prEl, volEl));

  function refresh() {
    const done = entry.sets.filter(isDone);
    const vol = done.reduce((a, s) => a + setW(s) * s.r, 0);
    volEl.textContent = vol > 0 ? `Volumen ${nf.format(Math.round(vol))} kg` : '';
    prEl.hidden = !isRecord(entry.exerciseId, w.date, entry.sets);
  }
  return { el, refresh };
}

function numInput(value, mode, label, onVal, integer) {
  return h('input', {
    class: 'num', type: 'text', inputmode: mode, enterkeyhint: 'next', autocomplete: 'off', autocorrect: 'off',
    placeholder: '–', 'aria-label': label, value: numToInput(value),
    onfocus: (e) => { const t = e.target; setTimeout(() => { try { t.setSelectionRange(0, t.value.length); } catch { /* egal */ } }, 0); },
    oninput: (e) => onVal(parseNum(e.target.value, integer)),
  });
}

/* ----- Übungs-Auswahl & -Formular ----- */

function exerciseForm({ exercise, name = '', onSubmit, submitLabel }) {
  const nameIn = h('input', { class: 'input', type: 'text', value: exercise ? exercise.name : name, maxlength: '80', placeholder: 'z. B. Bankdrücken', autocapitalize: 'words', 'aria-label': 'Name der Übung' });
  const groupSel = h('select', { class: 'select', 'aria-label': 'Muskelgruppe' },
    GROUPS.map((g) => h('option', { value: g, selected: (exercise ? exercise.group : 'Sonstiges') === g }, g)));
  const form = h('form', { class: 'form-grid', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      const n = nameIn.value.trim();
      if (!n) { toast('Bitte einen Namen eingeben', true); nameIn.focus(); return; }
      const dupe = state.exercises.find((x) => !x.archived && x.name.toLowerCase() === n.toLowerCase() && (!exercise || x.id !== exercise.id));
      if (dupe) { toast('Diese Übung gibt es schon', true); return; }
      onSubmit(n, groupSel.value);
    } },
    h('label', { class: 'field' }, h('span', {}, 'Name'), nameIn),
    h('label', { class: 'field' }, h('span', {}, 'Muskelgruppe'), groupSel),
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, submitLabel));
  return form;
}

function openExercisePicker({ onPick, excludeIds = [] }) {
  const search = h('input', { class: 'input', type: 'search', placeholder: 'Übung suchen …', 'aria-label': 'Übung suchen', autocomplete: 'off', autocorrect: 'off' });
  const list = h('div', { class: 'picker-list' });
  const sheet = openSheet('Übung hinzufügen', h('div', {}, search, list));

  function createFlow(prefill) {
    const form = exerciseForm({
      name: prefill, submitLabel: 'Anlegen & hinzufügen',
      onSubmit: (n, g) => {
        const ex = { id: uid(), name: n, group: g, archived: false };
        state.exercises.push(ex); save(true);
        sheet.close(); onPick(ex.id);
      },
    });
    sheet.setBody(form);
    const inp = $('input', form); if (inp) inp.focus();
  }

  function draw() {
    const q = search.value.trim().toLowerCase();
    const items = state.exercises.filter((e) => !e.archived && e.name.toLowerCase().includes(q));
    list.replaceChildren();
    const exact = state.exercises.some((e) => !e.archived && e.name.toLowerCase() === q);
    list.append(h('button', { class: 'btn btn-dashed', type: 'button', style: 'margin:12px 0 0', onclick: () => createFlow(q ? search.value.trim() : '') },
      icon('plus', 20), q && !exact ? `„${search.value.trim()}“ neu anlegen` : 'Neue Übung anlegen'));
    for (const g of GROUPS) {
      const gi = items.filter((e) => e.group === g);
      if (!gi.length) continue;
      list.append(h('h3', { class: 'group-title' }, g),
        h('div', { class: 'list' }, gi.map((e) => {
          const used = excludeIds.includes(e.id);
          return h('button', { class: 'row pick-row', type: 'button', disabled: used, onclick: () => { sheet.close(); onPick(e.id); } },
            h('span', { class: 'main title' }, e.name), used ? h('small', {}, 'schon im Training') : null);
        })));
    }
  }
  search.addEventListener('input', draw);
  draw();
}

/* =====================================================================
   Tab: Verlauf
   ===================================================================== */

function statTile(label, value, unit, sub) {
  return h('div', { class: 'tile' },
    h('div', { class: 'label' }, label),
    h('div', { class: 'value' }, value, unit ? h('small', {}, ` ${unit}`) : null),
    sub ? h('div', { class: 'sub' }, sub) : null);
}

function renderHistory() {
  const page = h('div', { class: 'page' }, pageHead('Verlauf'));
  const workouts = state.workouts.filter((w) => w.entries.length).sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!workouts.length) {
    page.append(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, icon('history')), h('h2', {}, 'Noch keine Trainings'), h('p', {}, 'Sobald du ein Training einträgst, siehst du es hier.')));
    return page;
  }
  const ws = weekStart(todayStr());
  const week = workouts.filter((w) => w.date >= ws && w.date <= addDays(ws, 6));
  const tot = week.reduce((a, w) => { const s = workoutStats(w); return { sets: a.sets + s.sets, volume: a.volume + s.volume }; }, { sets: 0, volume: 0 });
  page.append(h('div', { class: 'tiles' },
    statTile('Diese Woche', String(week.length), week.length === 1 ? 'Training' : 'Trainings'),
    statTile('Sätze', String(tot.sets)),
    statTile('Volumen (kg)', nf.format(Math.round(tot.volume)))));

  let month = '';
  let listEl = null;
  for (const w of workouts) {
    const m = dfMonth.format(fromDateStr(w.date));
    if (m !== month) {
      month = m;
      page.append(h('h2', { class: 'group-title' }, m));
      listEl = h('div', { class: 'list' });
      page.append(listEl);
    }
    const st = workoutStats(w);
    listEl.append(h('button', { class: 'row', type: 'button', onclick: () => go('training', { date: w.date }) },
      h('div', { class: 'main' },
        h('div', { class: 'title' }, dfShort.format(fromDateStr(w.date))),
        h('div', { class: 'sub' }, w.entries.map((e) => exName(e.exerciseId)).join(' · '))),
      h('div', { class: 'end' }, h('b', {}, `${nf.format(Math.round(st.volume))} kg`), h('small', {}, `${st.sets} ${st.sets === 1 ? 'Satz' : 'Sätze'}`)),
      h('span', { class: 'chev' }, icon('chevR', 18))));
  }
  return page;
}

/* =====================================================================
   Tab: Fortschritt
   ===================================================================== */

const METRICS = {
  weight: { short: 'Gewicht', title: 'Top-Gewicht pro Einheit', unit: 'kg', get: (s) => s.maxW },
  e1rm: { short: '1RM', title: 'Geschätztes 1RM (Epley-Formel)', unit: 'kg', get: (s) => s.e1rm },
  volume: { short: 'Volumen', title: 'Volumen pro Einheit (kg × Wdh.)', unit: 'kg', get: (s) => s.volume },
  reps: { short: 'Wdh.', title: 'Meiste Wiederholungen in einem Satz', unit: 'Wdh.', get: (s) => s.maxReps },
};

function deltaEl(diff, unit, goodWhenUp = true) {
  if (!Number.isFinite(diff)) return '–';
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return h('span', { class: 'delta' }, `±0 ${unit}`);
  const up = rounded > 0;
  return h('span', { class: `delta${up && goodWhenUp ? ' up' : ''}` }, icon(up ? 'up' : 'down', 16), `${up ? '+' : '−'}${fmt(Math.abs(rounded))} ${unit}`);
}

function renderProgress() {
  const page = h('div', { class: 'page' }, pageHead('Fortschritt'));
  page.append(segmented([['ex', 'Übung'], ['all', 'Übersicht'], ['bw', 'Körpergewicht']], ui.progMode, (v) => { ui.progMode = v; render({ keepScroll: false }); }, 'Ansicht'));
  if (ui.progMode === 'bw') page.append(...bodyweightView());
  else if (ui.progMode === 'all') page.append(...overviewView());
  else page.append(...exerciseProgressView());
  return page;
}

function exercisesWithData() {
  const map = sessionsMap();
  return state.exercises
    .filter((e) => map.has(e.id))
    .map((e) => ({ ex: e, sessions: map.get(e.id) }))
    .sort((a, b) => (a.sessions[a.sessions.length - 1].date < b.sessions[b.sessions.length - 1].date ? 1 : -1));
}

function noDataEmpty() {
  return h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, icon('chart')), h('h2', {}, 'Noch keine Daten'),
    h('p', {}, 'Trage Gewichte und Wiederholungen im Training ein – dann erscheint hier deine Entwicklung.'),
    h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('training') }, 'Zum Training'));
}

function exerciseProgressView() {
  const data = exercisesWithData();
  if (!data.length) return [noDataEmpty()];
  if (!data.some((d) => d.ex.id === ui.progEx)) ui.progEx = data[0].ex.id;
  const { ex, sessions } = data.find((d) => d.ex.id === ui.progEx);

  const hasWeight = sessions.some((s) => s.maxW > 0);
  const metricKey = hasWeight ? ui.progMetric : 'reps';
  const m = METRICS[metricKey];
  const points = sessions.map((s) => ({ t: fromDateStr(s.date).getTime(), y: m.get(s), date: s.date, detail: fmtSets(s.sets) })).filter((p) => p.y > 0);

  const out = [];
  out.push(h('div', { style: 'margin-bottom:12px' },
    h('select', {
      class: 'select', 'aria-label': 'Übung wählen',
      onchange: (e) => { ui.progEx = e.target.value; render({ keepScroll: false }); },
    }, data.map((d) => h('option', { value: d.ex.id, selected: d.ex.id === ui.progEx }, d.ex.name)))));

  if (hasWeight) {
    out.push(h('div', { style: 'margin-bottom:12px' },
      segmented(Object.entries(METRICS).map(([k, v]) => [k, v.short]), metricKey, (v) => { ui.progMetric = v; render(); }, 'Kennzahl')));
  }

  if (points.length) {
    const best = points.reduce((a, p) => (p.y > a.y ? p : a), points[0]);
    const first = points[0];
    const lastP = points[points.length - 1];
    out.push(h('div', { class: 'tiles' },
      statTile('Bestwert', fmt(best.y), m.unit, dfDay.format(fromDateStr(best.date))),
      statTile('Zuletzt', fmt(lastP.y), m.unit, dfDay.format(fromDateStr(lastP.date))),
      h('div', { class: 'tile' }, h('div', { class: 'label' }, 'Seit Start'),
        h('div', { class: 'value delta-val' }, points.length > 1 ? deltaEl(lastP.y - first.y, m.unit) : '–'),
        h('div', { class: 'sub' }, `${sessions.length} ${sessions.length === 1 ? 'Einheit' : 'Einheiten'}`))));
    out.push(h('div', { class: 'card', style: 'margin-bottom:14px' },
      h('h2', { class: 'card-title' }, m.title),
      lineChart(points, { unit: m.unit, aria: `${m.title} für ${ex.name}` }),
      points.length < 2 ? h('p', { class: 'chart-note' }, 'Ab der zweiten Einheit entsteht eine Kurve.') : null));
  } else {
    out.push(h('p', { class: 'muted' }, 'Für diese Kennzahl gibt es noch keine Werte.'));
  }

  out.push(h('h2', { class: 'group-title' }, 'Alle Einheiten'));
  out.push(h('div', { class: 'list' }, [...sessions].reverse().map((s) =>
    h('button', { class: 'row', type: 'button', onclick: () => go('training', { date: s.date }) },
      h('div', { class: 'main' }, h('div', { class: 'title' }, dfShort.format(fromDateStr(s.date))), h('div', { class: 'sub' }, fmtSets(s.sets))),
      h('div', { class: 'end' }, h('b', {}, `${fmt(m.get(s))} ${m.unit}`)),
      h('span', { class: 'chev' }, icon('chevR', 18))))));
  return out;
}

function overviewView() {
  const data = exercisesWithData();
  if (!data.length) return [noDataEmpty()];
  return [h('div', { class: 'list' }, data.map(({ ex, sessions }) => {
    const hasWeight = sessions.some((s) => s.maxW > 0);
    const get = hasWeight ? METRICS.weight.get : METRICS.reps.get;
    const unit = hasWeight ? 'kg' : 'Wdh.';
    const best = Math.max(...sessions.map(get));
    const diff = get(sessions[sessions.length - 1]) - get(sessions[0]);
    return h('button', { class: 'row', type: 'button', onclick: () => go('progress', { progMode: 'ex', progEx: ex.id }) },
      h('div', { class: 'main' }, h('div', { class: 'title' }, ex.name),
        h('div', { class: 'sub' }, `${sessions.length} ${sessions.length === 1 ? 'Einheit' : 'Einheiten'} · zuletzt ${relDay(sessions[sessions.length - 1].date)}`)),
      h('div', { class: 'end' }, h('b', {}, `${fmt(best)} ${unit}`), h('small', {}, sessions.length > 1 ? deltaEl(diff, unit) : 'erste Einheit')),
      h('span', { class: 'chev' }, icon('chevR', 18)));
  }))];
}

function bodyweightView() {
  const bw = [...state.bodyweight].sort((a, b) => (a.date < b.date ? -1 : 1));
  const dateIn = h('input', { class: 'input', type: 'date', value: todayStr(), 'aria-label': 'Datum' });
  const kgIn = h('input', { class: 'input', type: 'text', inputmode: 'decimal', placeholder: bw.length ? numToInput(bw[bw.length - 1].kg) : 'z. B. 80,5', 'aria-label': 'Körpergewicht in Kilogramm', autocomplete: 'off', enterkeyhint: 'done' });
  const submit = () => {
    const kg = parseNum(kgIn.value);
    if (!kg || kg < 20 || kg > 400) { toast('Bitte ein gültiges Gewicht eingeben', true); kgIn.focus(); return; }
    if (!DATE_RE.test(dateIn.value)) { toast('Bitte ein Datum wählen', true); return; }
    state.bodyweight = state.bodyweight.filter((b) => b.date !== dateIn.value);
    state.bodyweight.push({ date: dateIn.value, kg });
    save(true); toast('Gespeichert'); render();
  };

  const out = [];
  out.push(h('form', { class: 'card form-grid', style: 'margin-bottom:14px', onsubmit: (e) => { e.preventDefault(); submit(); } },
    h('div', { class: 'form-row' },
      h('label', { class: 'field grow' }, h('span', {}, 'Datum'), dateIn),
      h('label', { class: 'field', style: 'width:120px' }, h('span', {}, 'Gewicht (kg)'), kgIn)),
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Gewicht speichern')));

  if (!bw.length) {
    out.push(h('p', { class: 'muted' }, 'Trage dein Körpergewicht ein, um den Verlauf zu sehen – zum Beispiel einmal pro Woche morgens.'));
    return out;
  }
  const first = bw[0], last = bw[bw.length - 1];
  const points = bw.map((b) => ({ t: fromDateStr(b.date).getTime(), y: b.kg, date: b.date, detail: '' }));
  out.push(h('div', { class: 'tiles' },
    statTile('Aktuell', fmt(last.kg), 'kg', dfDay.format(fromDateStr(last.date))),
    h('div', { class: 'tile' }, h('div', { class: 'label' }, 'Seit Start'),
      h('div', { class: 'value delta-val' }, bw.length > 1 ? deltaEl(last.kg - first.kg, 'kg', false) : '–'),
      h('div', { class: 'sub' }, `ab ${dfDay.format(fromDateStr(first.date))}`)),
    statTile('Einträge', String(bw.length))));
  out.push(h('div', { class: 'card', style: 'margin-bottom:14px' },
    h('h2', { class: 'card-title' }, 'Körpergewicht'),
    lineChart(points, { unit: 'kg', aria: 'Verlauf des Körpergewichts' }),
    bw.length < 2 ? h('p', { class: 'chart-note' }, 'Ab dem zweiten Eintrag entsteht eine Kurve.') : null));
  out.push(h('h2', { class: 'group-title' }, 'Einträge'));
  out.push(h('div', { class: 'list' }, [...bw].reverse().slice(0, 30).map((b) =>
    h('div', { class: 'row' },
      h('div', { class: 'main' }, h('div', { class: 'title' }, dfYear.format(fromDateStr(b.date)))),
      h('div', { class: 'end' }, h('b', {}, `${fmt(b.kg)} kg`)),
      iconBtn('trash', `Eintrag vom ${dfYear.format(fromDateStr(b.date))} löschen`, () => {
        if (!confirm('Diesen Eintrag löschen?')) return;
        state.bodyweight = state.bodyweight.filter((x) => x.date !== b.date); save(true); render();
      }, 'danger')))));
  return out;
}

/* ----- Liniendiagramm (SVG, ohne Bibliothek) ----- */

function niceTicks(lo, hi, n) {
  const raw = (hi - lo) / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw);
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

/** points: [{t (ms), y, date, detail}] – zeitlich sortiert. */
function lineChart(points, { unit = '', aria = 'Verlauf' } = {}) {
  const H = 230, M = { t: 22, r: 18, b: 30, l: 46 };
  const wrap = h('div', { class: 'chart', tabindex: '0', role: 'group', 'aria-label': `${aria}. Pfeiltasten wechseln den Wert.` });
  const tip = h('div', { class: 'readout', 'aria-live': 'polite' });
  wrap.append(tip);
  let sel = points.length - 1;
  let geo = null;
  let parts = null;
  let drawnW = 0;
  const fmtVal = (v) => `${nf.format(Math.round(v * 10) / 10)}${unit ? ` ${unit}` : ''}`;
  const mk = (name, attrs = {}, text) => {
    const n = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };

  function draw() {
    const W = wrap.clientWidth;
    if (!W) return;
    drawnW = W;
    const old = $('svg', wrap); if (old) old.remove();

    const ys = points.map((p) => p.y);
    let lo = Math.min(...ys), hi = Math.max(...ys);
    const pad = lo === hi ? Math.max(1, Math.abs(lo) * 0.1) : (hi - lo) * 0.18;
    lo -= pad; hi += pad;
    if (Math.min(...ys) >= 0 && lo < 0) lo = 0;
    const ticks = niceTicks(lo, hi, 4);
    const dLo = ticks[0], dHi = ticks[ticks.length - 1];

    const t0 = points[0].t, t1 = points[points.length - 1].t;
    const innerL = M.l + 10, innerR = W - M.r - 10;
    const X = (t) => (t1 === t0 ? (innerL + innerR) / 2 : innerL + ((t - t0) / (t1 - t0)) * (innerR - innerL));
    const Y = (v) => H - M.b - ((v - dLo) / (dHi - dLo)) * (H - M.t - M.b);
    geo = { X, Y };

    const svg = mk('svg', { class: 'chart-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
    for (const tv of ticks) {
      const y = Y(tv);
      svg.append(mk('line', { class: tv === dLo ? 'axis' : 'grid', x1: M.l, x2: W - M.r, y1: y, y2: y }));
      svg.append(mk('text', { class: 'tick', x: M.l - 8, y, dy: '0.32em', 'text-anchor': 'end' }, nf2.format(tv)));
    }
    // X-Achse
    const spanDays = (t1 - t0) / 864e5;
    const df = spanDays > 330 ? new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit' }) : dfDay;
    const nt = t1 === t0 ? 1 : Math.max(2, Math.min(5, Math.floor((W - M.l - M.r) / 78)));
    for (let i = 0; i < nt; i++) {
      const frac = nt === 1 ? 0 : i / (nt - 1);
      const t = t0 + frac * (t1 - t0);
      const anchor = nt === 1 ? 'middle' : i === 0 ? 'start' : i === nt - 1 ? 'end' : 'middle';
      svg.append(mk('text', { class: 'tick', x: X(t), y: H - 8, 'text-anchor': anchor }, df.format(new Date(t))));
    }
    // Fläche + Linie
    if (points.length > 1) {
      const lineD = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('');
      svg.append(mk('path', { class: 'area', d: `${lineD}L${X(t1).toFixed(1)} ${Y(dLo).toFixed(1)}L${X(t0).toFixed(1)} ${Y(dLo).toFixed(1)}Z` }));
      svg.append(mk('path', { class: 'line', d: lineD }));
    }
    const cross = mk('line', { class: 'cross', y1: M.t - 6, y2: H - M.b });
    svg.append(cross);
    // Marker (bei sehr vielen Punkten nur Auswahl + Ende)
    if (points.length <= 40) for (const p of points) svg.append(mk('circle', { class: 'dot', cx: X(p.t), cy: Y(p.y), r: 4 }));
    const selDot = mk('circle', { class: 'dot sel', r: 6 });
    svg.append(selDot);
    // Direkte Beschriftung: Endwert und (falls abweichend) Maximum
    const label = (p) => {
      const x = X(p.t);
      const anchor = x > W - M.r - 36 ? 'end' : x < M.l + 20 ? 'start' : 'middle';
      svg.append(mk('text', { class: 'dlabel', x: anchor === 'end' ? x + 6 : anchor === 'start' ? x - 6 : x, y: Y(p.y) - 12, 'text-anchor': anchor }, fmtVal(p.y)));
    };
    const lastP = points[points.length - 1];
    const maxP = points.reduce((a, p) => (p.y > a.y ? p : a), points[0]);
    label(lastP);
    if (maxP !== lastP && Math.abs(X(maxP.t) - X(lastP.t)) > 64) label(maxP);

    const overlay = mk('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent' });
    const pick = (e) => {
      const px = e.clientX - svg.getBoundingClientRect().left;
      let best = 0, bd = Infinity;
      points.forEach((p, i) => { const d = Math.abs(X(p.t) - px); if (d < bd) { bd = d; best = i; } });
      select(best);
    };
    overlay.addEventListener('pointerdown', pick);
    overlay.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) pick(e); });
    svg.append(overlay);

    wrap.append(svg);
    parts = { cross, selDot };
    select(sel);
  }

  function select(i) {
    sel = Math.max(0, Math.min(points.length - 1, i));
    if (!geo || !parts) return;
    const p = points[sel];
    const x = geo.X(p.t), y = geo.Y(p.y);
    parts.cross.setAttribute('x1', x); parts.cross.setAttribute('x2', x);
    parts.selDot.setAttribute('cx', x); parts.selDot.setAttribute('cy', y);
    tip.replaceChildren(...[
      h('div', { class: 't-top' },
        h('span', { class: 't-val' }, h('span', { class: 't-key' }), fmtVal(p.y)),
        h('span', { class: 't-date' }, dfYear.format(fromDateStr(p.date)))),
      h('div', { class: 't-detail' }, p.detail || '\u00a0'),
    ]);
  }

  wrap.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft') select(sel - 1);
    else if (k === 'ArrowRight') select(sel + 1);
    else if (k === 'Home') select(0);
    else if (k === 'End') select(points.length - 1);
    else return;
    e.preventDefault();
  });

  if ('ResizeObserver' in window) new ResizeObserver(() => { if (wrap.clientWidth !== drawnW) draw(); }).observe(wrap);
  else requestAnimationFrame(draw);
  return wrap;
}

/* =====================================================================
   Tab: Übungen
   ===================================================================== */

function renderExercises() {
  const map = sessionsMap();
  const page = h('div', { class: 'page' }, pageHead('Übungen',
    h('button', { class: 'btn btn-small btn-primary', type: 'button', onclick: addExerciseSheet }, icon('plus', 18), 'Neu')));

  const active = state.exercises.filter((e) => !e.archived);
  for (const g of GROUPS) {
    const gi = active.filter((e) => e.group === g).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (!gi.length) continue;
    page.append(h('h2', { class: 'group-title' }, g),
      h('div', { class: 'list' }, gi.map((e) => {
        const n = (map.get(e.id) || []).length;
        return h('button', { class: 'row', type: 'button', onclick: () => editExerciseSheet(e) },
          h('div', { class: 'main' }, h('div', { class: 'title' }, e.name)),
          h('small', { class: 'muted' }, n ? `${n}×` : ''),
          h('span', { class: 'chev' }, icon('chevR', 18)));
      })));
  }
  const archived = state.exercises.filter((e) => e.archived);
  if (archived.length) {
    page.append(h('h2', { class: 'group-title' }, 'Ausgeblendet'),
      h('div', { class: 'list' }, archived.map((e) =>
        h('div', { class: 'row' },
          h('div', { class: 'main' }, h('div', { class: 'title muted' }, e.name)),
          h('button', { class: 'btn btn-small', type: 'button', onclick: () => { e.archived = false; save(true); render(); } }, 'Wiederherstellen')))));
  }
  return page;
}

function addExerciseSheet() {
  const sheet = openSheet('Neue Übung', h('div'));
  sheet.setBody(exerciseForm({
    submitLabel: 'Anlegen',
    onSubmit: (n, g) => { state.exercises.push({ id: uid(), name: n, group: g, archived: false }); save(true); sheet.close(); render(); toast('Übung angelegt'); },
  }));
}

function editExerciseSheet(ex) {
  const used = state.workouts.some((w) => w.entries.some((e) => e.exerciseId === ex.id));
  const sheet = openSheet('Übung bearbeiten', h('div'));
  const form = exerciseForm({
    exercise: ex, submitLabel: 'Speichern',
    onSubmit: (n, g) => { ex.name = n; ex.group = g; save(true); sheet.close(); render(); },
  });
  const remove = h('button', {
    class: 'btn btn-danger btn-block', type: 'button',
    onclick: () => {
      if (used) {
        if (!confirm(`„${ex.name}“ ausblenden? Dein bisheriger Verlauf bleibt erhalten.`)) return;
        ex.archived = true;
      } else {
        if (!confirm(`„${ex.name}“ löschen?`)) return;
        state.exercises = state.exercises.filter((x) => x !== ex);
      }
      save(true); sheet.close(); render();
    },
  }, icon('trash', 20), used ? 'Ausblenden' : 'Löschen');
  sheet.setBody(h('div', { class: 'form-grid' }, form, remove, used ? h('p', { class: 'small muted' }, 'Diese Übung hat Einträge im Verlauf und wird deshalb nur ausgeblendet.') : null));
}

/* =====================================================================
   Tab: Daten (Backup, Darstellung)
   ===================================================================== */

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

async function exportBackup() {
  const name = `fitlog-backup-${todayStr()}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'FitLog Backup' });
    } else {
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: name });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return; // Teilen abgebrochen
    toast('Backup fehlgeschlagen', true);
    return;
  }
  state.settings.lastExport = new Date().toISOString();
  save(true); toast('Backup erstellt'); render();
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onerror = () => toast('Datei konnte nicht gelesen werden', true);
  reader.onload = () => {
    let next;
    try { next = sanitize(JSON.parse(String(reader.result))); } catch (e) { toast(e.message || 'Ungültige Datei', true); return; }
    const msg = `Backup laden?\n\n${next.workouts.length} Trainings, ${next.exercises.length} Übungen, ${next.bodyweight.length} Gewichtseinträge.\n\nDeine aktuellen Daten werden dadurch ersetzt.`;
    if (!confirm(msg)) return;
    state = next; save(true); applyTheme(); toast('Backup geladen'); go('training');
  };
  reader.readAsText(file);
}

function renderData() {
  const page = h('div', { class: 'page' }, pageHead('Daten'));
  const last = state.settings.lastExport;
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); } });

  page.append(h('div', { class: 'stack' },
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, 'Backup'),
      h('p', { class: 'small', style: 'margin-bottom:12px' }, 'Deine Daten liegen nur auf diesem iPhone. Sichere sie ab und zu – z. B. in „Dateien“ oder iCloud Drive. Das Backup ist eine einfache JSON-Datei.'),
      h('p', { class: 'small muted', style: 'margin-bottom:12px' }, last ? `Letztes Backup: ${dfYear.format(new Date(last))}` : 'Noch kein Backup erstellt.'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: exportBackup }, icon('share', 20), 'Backup sichern'),
        h('button', { class: 'btn btn-block', type: 'button', onclick: () => fileIn.click() }, 'Backup laden'),
        fileIn)),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, 'Darstellung'),
      segmented([['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']], state.settings.theme, (v) => { state.settings.theme = v; save(true); applyTheme(); render(); }, 'Darstellung')),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, 'Als App auf dem iPhone'),
      h('ol', { class: 'small', style: 'margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px' },
        h('li', {}, 'Seite in Safari öffnen.'),
        h('li', {}, 'Auf „Teilen“ (Quadrat mit Pfeil) tippen.'),
        h('li', {}, '„Zum Home-Bildschirm“ wählen und „Hinzufügen“.'),
        h('li', {}, 'Ab jetzt über das Icon öffnen – das funktioniert auch offline.'))),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, 'Zurücksetzen'),
      h('button', {
        class: 'btn btn-danger btn-block', type: 'button',
        onclick: () => {
          if (!confirm('Wirklich ALLE Trainings, Übungen und Gewichte löschen?')) return;
          if (!confirm('Das kann nicht rückgängig gemacht werden. Hast du ein Backup?\n\nJetzt endgültig löschen?')) return;
          state = freshState(); save(true); applyTheme(); toast('Alles zurückgesetzt'); go('training');
        },
      }, icon('trash', 20), 'Alle Daten löschen')),
    h('p', { class: 'small muted', style: 'text-align:center' }, `FitLog · ${state.workouts.length} Trainings gespeichert`)));
  return page;
}

/* =====================================================================
   Start
   ===================================================================== */

applyTheme();
render();

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e)); });
}
