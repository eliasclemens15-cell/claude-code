/* FitLog – persönliches Trainingstagebuch.
   Läuft komplett im Browser, Daten liegen nur lokal (localStorage) auf dem Gerät. */
'use strict';

/* =====================================================================
   Konstanten & Hilfsfunktionen
   ===================================================================== */

const STORE_KEY = 'fitlog.v1';
const GROUPS = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Unterarme', 'Bauch', 'Beine', 'Gesäß', 'Waden', 'Ganzkörper', 'Sonstiges'];
const LEGACY_GROUPS = { Arme: 'Bizeps', Core: 'Bauch' }; // Gruppen der ersten App-Version

/* Übungskatalog: [Name, Standard-Pause in Sekunden, 't' = zeitbasiert (Sekunden statt Wiederholungen)].
   Wird beim ersten Start (und einmalig je CATALOG_VERSION) in die Übungsliste übernommen. */
const CATALOG_VERSION = 1;
const CATALOG = {
  Brust: [
    ['Bankdrücken', 150], ['Schrägbankdrücken', 120], ['Negativbankdrücken', 120],
    ['Bankdrücken mit Kurzhanteln', 120], ['Schrägbankdrücken mit Kurzhanteln', 120], ['Negativbankdrücken mit Kurzhanteln', 120],
    ['Bankdrücken an der Multipresse', 120], ['Schrägbankdrücken an der Multipresse', 120], ['Floor Press mit Kurzhanteln', 90],
    ['Brustpresse an der Maschine', 90], ['Brustpresse am Kabel', 75], ['Butterfly (Maschine)', 75],
    ['Fliegende mit Kurzhanteln', 75], ['Schrägbank-Fliegende mit Kurzhanteln', 75], ['Fliegende am Kabel', 60],
    ['Cable Crossover von oben', 60], ['Cable Crossover von unten', 60], ['Pullover mit Kurzhantel', 75], ['Svend Press', 60],
    ['Liegestütze', 60], ['Liegestütze mit erhöhten Füßen', 60], ['Brust-Dips', 90],
  ],
  Rücken: [
    ['Kreuzheben', 180], ['Sumo-Kreuzheben', 180], ['Trap-Bar-Kreuzheben', 180], ['Rack Pull', 150],
    ['Klimmzüge', 120], ['Klimmzüge im Untergriff (Chin-Ups)', 120], ['Klimmzüge mit engem Griff', 120], ['Klimmzüge mit Zusatzgewicht', 150],
    ['Assistierte Klimmzüge (Maschine)', 90], ['Latziehen', 90], ['Latziehen mit engem Griff', 90], ['Latziehen im Untergriff', 90],
    ['Latziehen einarmig', 75], ['Gerader Latzug (Straight-Arm Pulldown)', 60], ['Pullover am Kabel', 60],
    ['Rudern mit Langhantel', 120], ['Rudern im Untergriff', 120], ['Pendlay Row', 120], ['T-Bar-Rudern', 120],
    ['Rudern mit Kurzhantel', 90], ['Rudern am Kabel', 90], ['Rudern an der Maschine', 90], ['Brustgestütztes Rudern', 90],
    ['Meadows Row', 90], ['Seal Row', 90], ['Rudern am Körpergewicht (Inverted Row)', 75],
    ['Rückenstrecker (Hyperextension)', 60], ['Good Mornings', 90],
  ],
  Schultern: [
    ['Schulterdrücken', 120], ['Schulterdrücken mit Kurzhanteln', 90], ['Schulterdrücken an der Maschine', 90],
    ['Militärdrücken (stehend)', 120], ['Arnold Press', 90], ['Push Press', 120], ['Z-Press', 90], ['Landmine Press', 90], ['Pike-Liegestütze', 75],
    ['Seitheben', 60], ['Seitheben am Kabel', 60], ['Seitheben an der Maschine', 60],
    ['Frontheben mit Kurzhanteln', 60], ['Frontheben mit Scheibe', 60], ['Frontheben am Kabel', 60],
    ['Vorgebeugtes Seitheben', 60], ['Reverse Butterfly (Maschine)', 60], ['Face Pulls', 60],
    ['Aufrechtes Rudern', 75], ['Außenrotation am Kabel', 45],
    ['Schulterzucken mit Kurzhanteln', 60], ['Schulterzucken mit Langhantel', 60],
  ],
  Bizeps: [
    ['Bizepscurls', 75], ['Langhantel-Curls', 75], ['SZ-Stangen-Curls', 75], ['Kurzhantel-Curls', 75], ['Hammercurls', 75],
    ['Cross-Body-Hammercurls', 60], ['Konzentrationscurls', 60], ['Scott-Curls (Preacher Curls)', 75], ['Schrägbank-Curls', 75],
    ['Spider Curls', 60], ['Kabelcurls', 60], ['Kabelcurls mit Seil', 60], ['Bizepscurls an der Maschine', 60],
    ['Zottman Curls', 60], ['Drag Curls', 60],
  ],
  Trizeps: [
    ['Trizepsdrücken', 60], ['Trizepsdrücken mit Seil', 60], ['Trizepsdrücken mit Stange', 60], ['Trizepsdrücken einarmig (Umgriff)', 60],
    ['Überkopf-Trizepsstrecken mit Kurzhantel', 75], ['Überkopf-Trizepsstrecken am Kabel', 60],
    ['Stirndrücken mit SZ-Stange', 75], ['Stirndrücken mit Kurzhanteln', 75], ['Enges Bankdrücken', 120], ['JM Press', 90],
    ['Dips', 120], ['Bank-Dips', 60], ['Trizepsstrecken an der Maschine', 60],
    ['Kickbacks mit Kurzhantel', 60], ['Kickbacks am Kabel', 60], ['Diamond-Liegestütze', 60],
  ],
  Unterarme: [
    ['Handgelenkscurls', 45], ['Reverse-Handgelenkscurls', 45], ['Reverse Curls', 60],
    ["Farmer's Walk", 90, 't'], ['Dead Hang (Hängen an der Stange)', 60, 't'],
  ],
  Bauch: [
    ['Beinheben hängend', 60], ['Knieheben hängend', 60], ['Toes to Bar', 60], ['Beinheben liegend', 45],
    ['Crunches', 45], ['Crunches am Kabel', 60], ['Crunches an der Maschine', 60], ['Reverse Crunches', 45],
    ['Sit-ups', 45], ['Schrägbank-Sit-ups', 45], ['V-Ups', 45], ['Bicycle Crunches', 45], ['Russian Twists', 45],
    ['Cable Woodchopper', 60], ['Pallof Press', 45], ['Seitliches Beugen mit Kurzhantel', 45], ['Ab Wheel (Bauchroller)', 60],
    ['Mountain Climbers', 45], ['Dead Bug', 45], ['Bird Dog', 45],
    ['Plank', 45, 't'], ['Seitstütz (Side Plank)', 45, 't'], ['Hollow Hold', 45, 't'], ['L-Sit', 45, 't'],
  ],
  Beine: [
    ['Kniebeugen', 180], ['Frontkniebeugen', 180], ['Kniebeugen an der Multipresse', 120], ['Box Squats', 150], ['Zercher Squats', 150],
    ['Goblet Squats', 90], ['Hackenschmidt-Kniebeugen (Hack Squat)', 120], ['Pendulum Squat', 120], ['Pistol Squats', 90], ['Sissy Squats', 60],
    ['Sumo-Kniebeugen mit Kurzhantel', 90], ['Cossack Squats', 60],
    ['Beinpresse', 120], ['Beinpresse einbeinig', 90], ['Beinstrecker', 60],
    ['Ausfallschritte', 90], ['Ausfallschritte gehend', 90], ['Rückwärts-Ausfallschritte', 90], ['Seitliche Ausfallschritte', 75],
    ['Bulgarische Split Squats', 90], ['Step-Ups', 75],
    ['Rumänisches Kreuzheben', 150], ['Rumänisches Kreuzheben mit Kurzhanteln', 120], ['Steifbeiniges Kreuzheben', 150],
    ['Beinbeuger', 60], ['Beinbeuger sitzend', 60], ['Beinbeuger liegend', 60], ['Nordic Curls', 90],
    ['Adduktoren-Maschine', 60], ['Wandsitzen', 60, 't'],
  ],
  Gesäß: [
    ['Hip Thrusts mit Langhantel', 120], ['Hip Thrusts an der Maschine', 90], ['Hip Thrusts einbeinig', 75],
    ['Glute Bridge', 60], ['Einbeinige Glute Bridge', 60], ['Frog Pumps', 45], ['Kickbacks am Kabel (Gesäß)', 60],
    ['Gesäßpresse an der Maschine', 75], ['Abduktoren-Maschine', 60], ['Cable Pull-Through', 75],
    ['Curtsy Lunges', 75], ['Fire Hydrants', 45], ['Seitliches Beinheben', 45],
  ],
  Waden: [
    ['Wadenheben', 60], ['Wadenheben sitzend', 60], ['Wadenheben an der Beinpresse', 60], ['Wadenheben einbeinig', 45],
    ['Eselwadenheben', 60], ['Fußspitzen-Heben (Tibialis Raises)', 45],
  ],
  Ganzkörper: [
    ['Kettlebell Swings', 75], ['Kettlebell Snatch', 90], ['Turkish Get-Up', 90],
    ['Umsetzen (Clean)', 150], ['Power Clean', 150], ['Stoßen (Clean & Jerk)', 150], ['Reißen (Snatch)', 150], ['Thrusters', 120],
    ['Burpees', 60], ['Box Jumps', 90], ['Wall Balls', 75], ['Medizinball-Slams', 60],
    ['Sled Push', 120], ['Sled Pull', 120], ['Battle Ropes', 60, 't'], ['Bear Crawl', 60, 't'],
  ],
};

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
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  minus: '<path d="M5 12h14"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5"/>',
  more: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
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

const defaultSettings = () => ({ theme: 'auto', lastExport: null, restDefault: 90, restAuto: true, restSound: true, keepAwake: true });

function freshState() {
  const st = { version: 1, catalogVersion: 0, exercises: [], workouts: [], bodyweight: [], settings: defaultSettings() };
  ensureCatalog(st);
  return st;
}

/** Ergänzt den Übungskatalog (einmalig je Katalogversion), ohne vorhandene Übungen oder Einträge anzufassen. */
function ensureCatalog(st) {
  const have = st.catalogVersion || 0;
  if (have >= CATALOG_VERSION) return false;
  const byName = new Map(st.exercises.map((e) => [e.name.trim().toLowerCase(), e]));
  for (const [group, items] of Object.entries(CATALOG)) {
    for (const [name, rest, flag] of items) {
      const ex = byName.get(name.toLowerCase());
      if (ex) {
        if (have === 0) ex.group = group;           // Gruppen wurden mit dem Katalog verfeinert
        if (ex.rest == null) ex.rest = rest;
        if (flag === 't' && have === 0) ex.timed = true;
      } else {
        const created = { id: uid(), name, group, rest, timed: flag === 't', archived: false };
        st.exercises.push(created);
        byName.set(name.toLowerCase(), created);
      }
    }
  }
  st.catalogVersion = CATALOG_VERSION;
  return true;
}

/** Prüft & bereinigt geladene/importierte Daten. Wirft bei völlig ungültigem Format. */
function sanitize(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.workouts) || !Array.isArray(d.exercises)) {
    throw new Error('Das ist keine FitLog-Datei.');
  }
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(+v) && +v >= 0 ? +v : null);
  const restOf = (v) => { const r = v == null ? NaN : Math.round(+v); return r >= 15 && r <= 900 ? r : null; };
  const exercises = d.exercises
    .filter((e) => e && typeof e.id === 'string' && typeof e.name === 'string')
    .map((e) => {
      const g = LEGACY_GROUPS[e.group] || e.group;
      return { id: e.id, name: e.name.slice(0, 80), group: GROUPS.includes(g) ? g : 'Sonstiges', rest: restOf(e.rest), timed: !!e.timed, archived: !!e.archived };
    });
  const known = new Set(exercises.map((e) => e.id));

  const byDate = new Map();
  for (const w of d.workouts) {
    if (!w || typeof w.date !== 'string' || !DATE_RE.test(w.date) || !Array.isArray(w.entries)) continue;
    const entries = w.entries
      .filter((en) => en && typeof en.exerciseId === 'string' && Array.isArray(en.sets))
      .map((en) => ({
        exerciseId: en.exerciseId,
        sets: en.sets.map((s) => { const set = { w: num(s && s.w), r: num(s && s.r) }; if (s && s.d) set.d = true; return set; }),
      }));
    for (const en of entries) {
      if (!known.has(en.exerciseId)) {
        known.add(en.exerciseId);
        exercises.push({ id: en.exerciseId, name: 'Unbekannte Übung', group: 'Sonstiges', rest: null, timed: false, archived: true });
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
  const ds = defaultSettings();
  return {
    version: 1,
    catalogVersion: Number.isFinite(+d.catalogVersion) ? +d.catalogVersion : 0,
    exercises,
    workouts: [...byDate.values()],
    bodyweight: [...bw.values()],
    settings: {
      theme: ['auto', 'light', 'dark'].includes(st.theme) ? st.theme : 'auto',
      lastExport: typeof st.lastExport === 'string' ? st.lastExport : null,
      restDefault: restOf(st.restDefault) || ds.restDefault,
      restAuto: st.restAuto !== false,
      restSound: st.restSound !== false,
      keepAwake: st.keepAwake !== false,
    },
  };
}

let migratedOnLoad = false;
function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const st = sanitize(JSON.parse(raw));
      migratedOnLoad = ensureCatalog(st);
      return st;
    }
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
if (migratedOnLoad) save(true);

/* ----- Abfragen ----- */

let exCache = { arr: null, n: -1, map: null };
function exById(id) {
  if (exCache.arr !== state.exercises || exCache.n !== state.exercises.length) {
    exCache = { arr: state.exercises, n: state.exercises.length, map: new Map(state.exercises.map((e) => [e.id, e])) };
  }
  return exCache.map.get(id);
}
const exName = (id) => { const e = exById(id); return e ? e.name : 'Unbekannte Übung'; };
const isTimed = (id) => { const e = exById(id); return !!(e && e.timed); };
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

function agg(sets, timed = false) {
  let maxW = 0, best1 = 0, volume = 0, maxReps = 0;
  for (const s of sets) {
    maxW = Math.max(maxW, s.w);
    maxReps = Math.max(maxReps, s.r);
    if (!timed) { best1 = Math.max(best1, e1rm(s.w, s.r)); volume += s.w * s.r; } // Sekunden × kg ergibt kein sinnvolles Volumen
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
      m.get(en.exerciseId).push({ date: w.date, sets, ...agg(sets, isTimed(en.exerciseId)) });
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
  const cur = agg(rawSets.filter(isDone).map((s) => ({ w: setW(s), r: s.r })), isTimed(exId));
  const prevW = Math.max(...prev.map((s) => s.maxW));
  if (cur.maxW > 0 || prevW > 0) return cur.maxW > prevW;
  return cur.maxReps > Math.max(...prev.map((s) => s.maxReps));
}

function fmtSets(sets, timed = false) {
  const groups = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.w === s.w) last.r.push(s.r); else groups.push({ w: s.w, r: [s.r] });
  }
  return groups.map((g) => {
    const reps = g.r.join(', ');
    if (g.w > 0) return `${fmt(g.w)} kg × ${reps}${timed ? ' s' : ''}`;
    return timed ? `${reps} s` : `Eigengew. × ${reps}`;
  }).join(' · ');
}

function workoutStats(w) {
  let sets = 0, volume = 0;
  for (const en of w.entries) {
    const timed = isTimed(en.exerciseId);
    for (const s of en.sets) if (isDone(s)) { sets += 1; if (!timed) volume += setW(s) * s.r; }
  }
  return { sets, volume };
}

/* =====================================================================
   UI-Grundgerüst
   ===================================================================== */

const ui = { tab: 'training', date: todayStr(), progMode: 'ex', progEx: null, progMetric: 'weight', exQuery: '', exOpen: new Set() };
const viewEl = $('#view');
const tabsEl = $('#tabs');

const TABS = [
  { id: 'training', label: 'Training', icon: 'train', render: renderTraining },
  { id: 'history', label: 'Verlauf', icon: 'history', render: renderHistory },
  { id: 'progress', label: 'Fortschritt', icon: 'chart', render: renderProgress },
  { id: 'exercises', label: 'Übungen', icon: 'list', render: renderExercises },
  { id: 'more', label: 'Mehr', icon: 'more', render: renderSettings },
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
  const timed = !!(ex && ex.timed);
  const last = lastSessionBefore(entry.exerciseId, w.date);
  const setsEl = h('div', { class: 'sets' });
  const volEl = h('span', { class: 'vol' });
  const prEl = h('span', { class: 'pr', hidden: true }, icon('star', 14), 'Neuer Rekord');
  const repsWord = timed ? 'Sekunden' : 'Wiederholungen';

  const changed = () => { save(); onChange(); };

  function toggleDone(i) {
    const st = entry.sets[i];
    if (!st.d) {
      if (!(st.r > 0)) { toast(`Erst ${repsWord === 'Sekunden' ? 'die Sekunden' : 'die Wiederholungen'} eintragen`); return; }
      st.d = true;
      if (state.settings.restAuto) startRest(restFor(entry.exerciseId), exName(entry.exerciseId));
    } else {
      delete st.d;
    }
    save(true); drawSets(); onChange();
  }

  function drawSets() {
    setsEl.replaceChildren(
      h('div', { class: 'set-head', 'aria-hidden': 'true' }, h('span', {}, 'Satz'), h('span', {}, 'kg'), h('span', {}, timed ? 'Sek.' : 'Wdh.'), h('span', {}, 'Fertig')),
      ...entry.sets.map((st, i) => h('div', { class: `set-row${st.d ? ' done' : ''}` },
        h('span', { class: 'set-n' }, String(i + 1)),
        numInput(st.w, 'decimal', `Gewicht Satz ${i + 1} in Kilogramm`, (v) => { st.w = v; changed(); }, false),
        numInput(st.r, 'numeric', `${repsWord} Satz ${i + 1}`, (v) => { st.r = v; changed(); }, true),
        h('button', { class: 'check', type: 'button', 'aria-pressed': String(!!st.d), 'aria-label': `Satz ${i + 1} abhaken`, onclick: () => toggleDone(i) }, icon('check', 22)))));
  }
  drawSets();

  const addSet = () => {
    const prevSet = entry.sets[entry.sets.length - 1] || (last ? last.sets[0] : null);
    entry.sets.push(prevSet ? { w: prevSet.w || null, r: prevSet.r } : { w: null, r: null });
    drawSets(); save(true); onChange();
  };
  const removeLast = () => {
    if (!entry.sets.length) return;
    entry.sets.pop();
    drawSets(); save(true); onChange();
  };

  const el = h('section', { class: 'card', 'aria-label': exName(entry.exerciseId) },
    h('div', { class: 'entry-head' },
      h('div', { class: 'titles' }, h('h3', {}, exName(entry.exerciseId)), ex ? h('span', { class: 'chip' }, ex.group) : null),
      iconBtn('chart', 'Fortschritt ansehen', () => go('progress', { progMode: 'ex', progEx: entry.exerciseId })),
      iconBtn('trash', 'Übung aus Training entfernen', () => {
        const filled = entry.sets.some((st) => st.w != null || st.r != null);
        if (filled && !confirm(`„${exName(entry.exerciseId)}“ aus diesem Training entfernen?`)) return;
        w.entries.splice(w.entries.indexOf(entry), 1);
        pruneWorkout(w.date); save(true); render();
      }, 'danger')),
    h('p', { class: 'hint' },
      last ? [`Letztes Mal (${dfDay.format(fromDateStr(last.date))}): `, h('b', {}, fmtSets(last.sets, timed))] : 'Noch keine Vergleichswerte – das ist dein Startpunkt.'),
    setsEl,
    h('div', { class: 'entry-foot' },
      h('button', { class: 'btn btn-small', type: 'button', onclick: addSet }, icon('plus', 18), 'Satz'),
      h('button', { class: 'btn btn-small', type: 'button', 'aria-label': 'Letzten Satz entfernen', onclick: removeLast }, icon('minus', 18), 'Satz'),
      h('button', { class: 'btn btn-small', type: 'button', 'aria-label': `Pause starten (${fmtTime(restFor(entry.exerciseId))})`, onclick: () => startRest(restFor(entry.exerciseId), exName(entry.exerciseId)) },
        icon('timer', 18), fmtTime(restFor(entry.exerciseId))),
      prEl, volEl));

  function refresh() {
    const done = entry.sets.filter(isDone);
    if (timed) {
      const secs = done.reduce((a, st) => a + st.r, 0);
      volEl.textContent = secs > 0 ? `Gesamt ${fmtTime(secs)} min` : '';
    } else {
      const vol = done.reduce((a, st) => a + setW(st) * st.r, 0);
      volEl.textContent = vol > 0 ? `Volumen ${nf.format(Math.round(vol))} kg` : '';
    }
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

const fmtTime = (sec) => `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
const restFor = (exId) => { const e = exById(exId); return (e && e.rest) || state.settings.restDefault; };
const stepFor = (v, dir) => (dir > 0 ? (v < 120 ? 15 : 30) : (v <= 120 ? 15 : 30));

/** Plus/Minus-Zähler für Pausenzeiten (15 s … 15 min). */
function stepper(value, onChange) {
  let v = value;
  const val = h('output', { class: 'stepper-val' }, fmtTime(v));
  const set = (nv) => { v = Math.max(15, Math.min(900, nv)); val.textContent = fmtTime(v); onChange(v); };
  return h('div', { class: 'stepper' },
    h('button', { class: 'btn', type: 'button', 'aria-label': 'Pause kürzer', onclick: () => set(v - stepFor(v, -1)) }, icon('minus', 22)),
    val,
    h('button', { class: 'btn', type: 'button', 'aria-label': 'Pause länger', onclick: () => set(v + stepFor(v, 1)) }, icon('plus', 22)));
}

function toggleRow(label, hint, checked, onChange) {
  return h('label', { class: 'toggle-row' },
    h('div', {}, h('div', { class: 'title' }, label), hint ? h('div', { class: 'small muted' }, hint) : null),
    h('input', { type: 'checkbox', class: 'switch', checked: !!checked, 'aria-label': label, onchange: (e) => onChange(e.target.checked) }));
}

/** Pause pro Übung: „Standard“ (aus den Einstellungen) oder eigene Zeit. */
function restField(initial) {
  let custom = initial != null;
  let sec = initial != null ? initial : state.settings.restDefault;
  const out = h('div', { class: 'form-grid' });
  const draw = () => out.replaceChildren(...[
    h('div', { class: 'field' }, h('span', {}, 'Pause zwischen den Sätzen'),
      segmented([['std', `Standard (${fmtTime(state.settings.restDefault)})`], ['own', 'Eigene']], custom ? 'own' : 'std', (v) => { custom = v === 'own'; draw(); }, 'Pause')),
    custom ? stepper(sec, (v) => { sec = v; }) : null,
  ].filter(Boolean));
  draw();
  return { el: out, get: () => (custom ? sec : null) };
}

function exerciseForm({ exercise, name = '', group = 'Sonstiges', onSubmit, submitLabel }) {
  const nameIn = h('input', { class: 'input', type: 'text', value: exercise ? exercise.name : name, maxlength: '80', placeholder: 'z. B. Bankdrücken', autocapitalize: 'words', 'aria-label': 'Name der Übung' });
  const cur = exercise ? exercise.group : group;
  const groupSel = h('select', { class: 'select', 'aria-label': 'Muskelgruppe' }, GROUPS.map((g) => h('option', { value: g, selected: cur === g }, g)));
  const timedIn = h('input', { type: 'checkbox', class: 'switch', checked: !!(exercise && exercise.timed), 'aria-label': 'Zeitbasierte Übung' });
  const rest = restField(exercise ? exercise.rest : null);
  return h('form', {
    class: 'form-grid', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      const n = nameIn.value.trim();
      if (!n) { toast('Bitte einen Namen eingeben', true); nameIn.focus(); return; }
      const dupe = state.exercises.find((x) => !x.archived && x.name.toLowerCase() === n.toLowerCase() && (!exercise || x.id !== exercise.id));
      if (dupe) { toast('Diese Übung gibt es schon', true); return; }
      onSubmit(n, groupSel.value, { timed: timedIn.checked, rest: rest.get() });
    },
  },
  h('label', { class: 'field' }, h('span', {}, 'Name'), nameIn),
  h('label', { class: 'field' }, h('span', {}, 'Muskelgruppe'), groupSel),
  h('label', { class: 'toggle-row' }, h('div', {}, h('div', { class: 'title' }, 'Zeitbasiert'), h('div', { class: 'small muted' }, 'Sekunden statt Wiederholungen, z. B. Plank.')), timedIn),
  rest.el,
  h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, submitLabel));
}

function recentExerciseIds(limit = 8) {
  const seen = new Set();
  const out = [];
  for (const w of [...state.workouts].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    for (const en of w.entries) {
      if (seen.has(en.exerciseId)) continue;
      seen.add(en.exerciseId);
      const ex = exById(en.exerciseId);
      if (ex && !ex.archived) out.push(ex);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function openExercisePicker({ onPick, excludeIds = [] }) {
  let filter = 'alle';
  const search = h('input', { class: 'input', type: 'search', placeholder: `${state.exercises.filter((e) => !e.archived).length} Übungen durchsuchen …`, 'aria-label': 'Übung suchen', autocomplete: 'off', autocorrect: 'off' });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Muskelgruppe filtern' });
  const list = h('div', { class: 'picker-list' });
  const sheet = openSheet('Übung hinzufügen', h('div', {}, h('div', { class: 'picker-head' }, search, chips), list));

  function drawChips() {
    chips.replaceChildren(...[['alle', 'Alle'], ...GROUPS.map((g) => [g, g])].map(([v, text]) =>
      h('button', { class: 'chip-btn', type: 'button', 'aria-pressed': String(v === filter), onclick: () => { filter = v; drawChips(); draw(); } }, text)));
  }

  function createFlow(prefill) {
    const form = exerciseForm({
      name: prefill, group: filter !== 'alle' ? filter : 'Sonstiges', submitLabel: 'Anlegen & hinzufügen',
      onSubmit: (n, g, o) => {
        const ex = { id: uid(), name: n, group: g, rest: o.rest, timed: o.timed, archived: false };
        state.exercises.push(ex); save(true);
        sheet.close(); onPick(ex.id);
      },
    });
    sheet.setBody(form);
    const inp = $('input', form); if (inp) inp.focus();
  }

  const row = (e) => {
    const used = excludeIds.includes(e.id);
    return h('button', { class: 'row pick-row', type: 'button', disabled: used, onclick: () => { sheet.close(); onPick(e.id); } },
      h('span', { class: 'main title' }, e.name), used ? h('small', {}, 'schon im Training') : null);
  };

  function draw() {
    const q = search.value.trim().toLowerCase();
    const items = state.exercises.filter((e) => !e.archived
      && (!q || e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q))
      && (filter === 'alle' || e.group === filter));
    const exact = state.exercises.some((e) => !e.archived && e.name.toLowerCase() === q);
    list.replaceChildren(h('button', { class: 'btn btn-dashed', type: 'button', style: 'margin:12px 0 0', onclick: () => createFlow(q ? search.value.trim() : '') },
      icon('plus', 20), q && !exact ? `„${search.value.trim()}“ neu anlegen` : 'Neue Übung anlegen'));
    if (!q && filter === 'alle') {
      const rec = recentExerciseIds();
      if (rec.length) list.append(h('h3', { class: 'group-title' }, 'Zuletzt verwendet'), h('div', { class: 'list' }, rec.map(row)));
    }
    for (const g of GROUPS) {
      const gi = items.filter((e) => e.group === g);
      if (!gi.length) continue;
      list.append(h('h3', { class: 'group-title' }, `${g} · ${gi.length}`), h('div', { class: 'list' }, gi.map(row)));
    }
    if (!items.length) list.append(h('p', { class: 'muted', style: 'text-align:center;margin:20px 0 0' }, 'Keine passende Übung gefunden.'));
  }
  search.addEventListener('input', draw);
  drawChips();
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

function metricDef(key, timed) {
  const m = METRICS[key];
  return key === 'reps' && timed ? { short: 'Zeit', title: 'Längste Zeit in einem Satz', unit: 'Sek.', get: m.get } : m;
}

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

  const timed = !!ex.timed;
  const hasWeight = sessions.some((s) => s.maxW > 0);
  const keys = hasWeight ? (timed ? ['weight', 'reps'] : ['weight', 'e1rm', 'volume', 'reps']) : ['reps'];
  const metricKey = keys.includes(ui.progMetric) ? ui.progMetric : keys[0];
  const m = metricDef(metricKey, timed);
  const points = sessions.map((s) => ({ t: fromDateStr(s.date).getTime(), y: m.get(s), date: s.date, detail: fmtSets(s.sets, timed) })).filter((p) => p.y > 0);

  const out = [];
  out.push(h('div', { style: 'margin-bottom:12px' },
    h('select', {
      class: 'select', 'aria-label': 'Übung wählen',
      onchange: (e) => { ui.progEx = e.target.value; render({ keepScroll: false }); },
    }, data.map((d) => h('option', { value: d.ex.id, selected: d.ex.id === ui.progEx }, d.ex.name)))));

  if (keys.length > 1) {
    out.push(h('div', { style: 'margin-bottom:12px' },
      segmented(keys.map((k) => [k, metricDef(k, timed).short]), metricKey, (v) => { ui.progMetric = v; render(); }, 'Kennzahl')));
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
      h('div', { class: 'main' }, h('div', { class: 'title' }, dfShort.format(fromDateStr(s.date))), h('div', { class: 'sub' }, fmtSets(s.sets, timed))),
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
    const unit = hasWeight ? 'kg' : ex.timed ? 'Sek.' : 'Wdh.';
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
  const search = h('input', {
    class: 'input', type: 'search', value: ui.exQuery, autocomplete: 'off', autocorrect: 'off', 'aria-label': 'Übungen durchsuchen',
    placeholder: `${state.exercises.filter((e) => !e.archived).length} Übungen durchsuchen …`,
    oninput: (e) => { ui.exQuery = e.target.value; draw(); },
  });
  const listEl = h('div');

  const row = (e) => {
    const n = (map.get(e.id) || []).length;
    return h('button', { class: 'row', type: 'button', onclick: () => editExerciseSheet(e) },
      h('div', { class: 'main' }, h('div', { class: 'title' }, e.name),
        h('div', { class: 'sub' }, `Pause ${fmtTime(e.rest || state.settings.restDefault)}${e.rest ? '' : ' (Standard)'}${e.timed ? ' · zeitbasiert' : ''}`)),
      n ? h('small', { class: 'muted' }, `${n}×`) : null,
      h('span', { class: 'chev' }, icon('chevR', 18)));
  };

  function draw() {
    const q = ui.exQuery.trim().toLowerCase();
    listEl.replaceChildren();
    const active = state.exercises.filter((e) => !e.archived && (!q || e.name.toLowerCase().includes(q)));
    for (const g of GROUPS) {
      const gi = active.filter((e) => e.group === g);
      if (!gi.length) continue;
      listEl.append(h('details', {
        class: 'group', open: !!q || ui.exOpen.has(g),
        ontoggle: (ev) => { if (!q) { if (ev.target.open) ui.exOpen.add(g); else ui.exOpen.delete(g); } },
      }, h('summary', {}, h('span', {}, g), h('small', {}, String(gi.length))), h('div', { class: 'list' }, gi.map(row))));
    }
    const archived = state.exercises.filter((e) => e.archived && (!q || e.name.toLowerCase().includes(q)));
    if (archived.length) {
      listEl.append(h('details', { class: 'group', open: !!q }, h('summary', {}, h('span', {}, 'Ausgeblendet'), h('small', {}, String(archived.length))),
        h('div', { class: 'list' }, archived.map((e) => h('div', { class: 'row' },
          h('div', { class: 'main' }, h('div', { class: 'title muted' }, e.name)),
          h('button', { class: 'btn btn-small', type: 'button', onclick: () => { e.archived = false; save(true); render(); } }, 'Wiederherstellen'))))));
    }
    if (!listEl.children.length) listEl.append(h('p', { class: 'muted', style: 'text-align:center;margin-top:24px' }, 'Keine Übung gefunden.'));
  }
  draw();
  page.append(search, listEl);
  return page;
}

function addExerciseSheet() {
  const sheet = openSheet('Neue Übung', h('div'));
  sheet.setBody(exerciseForm({
    submitLabel: 'Anlegen',
    onSubmit: (n, g, o) => {
      state.exercises.push({ id: uid(), name: n, group: g, rest: o.rest, timed: o.timed, archived: false });
      save(true); sheet.close(); render(); toast('Übung angelegt');
    },
  }));
}

function editExerciseSheet(ex) {
  const used = state.workouts.some((w) => w.entries.some((e) => e.exerciseId === ex.id));
  const sheet = openSheet('Übung bearbeiten', h('div'));
  const form = exerciseForm({
    exercise: ex, submitLabel: 'Speichern',
    onSubmit: (n, g, o) => { ex.name = n; ex.group = g; ex.rest = o.rest; ex.timed = o.timed; save(true); sheet.close(); render(); },
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
    const msg = `Backup laden?\n\n${next.workouts.length} Trainings, ${next.exercises.filter((e) => !e.archived).length} Übungen, ${next.bodyweight.length} Gewichtseinträge.\n\nDeine aktuellen Daten werden dadurch ersetzt.`;
    if (!confirm(msg)) return;
    ensureCatalog(next);
    stopRest();
    state = next; save(true); applyTheme(); toast('Backup geladen'); go('training');
  };
  reader.readAsText(file);
}

function renderSettings() {
  const page = h('div', { class: 'page' }, pageHead('Einstellungen'));
  const set = state.settings;
  const last = set.lastExport;
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); } });

  page.append(h('div', { class: 'stack' },
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, 'Pausen'),
      h('div', { class: 'field' }, h('span', {}, 'Standard-Pause zwischen den Sätzen'), stepper(set.restDefault, (v) => { set.restDefault = v; save(); })),
      h('div', { class: 'toggles' },
        toggleRow('Pause automatisch starten', 'Sobald du einen Satz mit dem Haken abschließt.', set.restAuto, (v) => { set.restAuto = v; save(true); }),
        toggleRow('Ton am Ende der Pause', 'Bei stumm geschaltetem iPhone bleibt es still.', set.restSound, (v) => { set.restSound = v; save(true); if (v) { unlockAudio(); beep(true); } }),
        toggleRow('Display anlassen', 'Solange eine Pause läuft.', set.keepAwake, (v) => { set.keepAwake = v; save(true); })),
      h('p', { class: 'small muted', style: 'margin-top:12px' }, 'Für einzelne Übungen stellst du unter „Übungen“ eine eigene Pause ein.')),
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
      segmented([['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']], set.theme, (v) => { set.theme = v; save(true); applyTheme(); render(); }, 'Darstellung')),
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
          stopRest();
          state = freshState(); save(true); applyTheme(); toast('Alles zurückgesetzt'); go('training');
        },
      }, icon('trash', 20), 'Alle Daten löschen')),
    h('p', { class: 'small muted', style: 'text-align:center' }, `FitLog · ${state.workouts.length} Trainings · ${state.exercises.filter((e) => !e.archived).length} Übungen`)));
  return page;
}

/* =====================================================================
   Pausen-Timer
   ===================================================================== */

const REST_KEY = 'fitlog.rest';
const restEl = $('#rest');
const restState = { endAt: 0, total: 0, label: '', timer: null, doneTimer: null, wake: null };
let audioCtx = null;

function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* egal */ }
}

function beep(preview = false) {
  if (!audioCtx || (!state.settings.restSound && !preview)) return;
  try {
    const t0 = audioCtx.currentTime;
    [0, 0.26, 0.52].forEach((dt, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 1175 : 880;
      o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.45, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.2);
      o.start(t0 + dt); o.stop(t0 + dt + 0.22);
    });
  } catch { /* egal */ }
}

async function requestWake() {
  if (!state.settings.keepAwake || !('wakeLock' in navigator) || restState.wake) return;
  try {
    restState.wake = await navigator.wakeLock.request('screen');
    restState.wake.addEventListener('release', () => { restState.wake = null; });
  } catch { /* egal */ }
}
function releaseWake() {
  if (restState.wake) { restState.wake.release().catch(() => {}); restState.wake = null; }
}

const persistRest = () => lsSet(REST_KEY, JSON.stringify({ endAt: restState.endAt, total: restState.total, label: restState.label }));
const clearRestStore = () => { try { localStorage.removeItem(REST_KEY); } catch { /* egal */ } };

function startRest(seconds, label) {
  unlockAudio();
  clearTimeout(restState.doneTimer);
  restState.total = seconds;
  restState.endAt = Date.now() + seconds * 1000;
  restState.label = label || '';
  persistRest();
  requestWake();
  drawRest();
  clearInterval(restState.timer);
  restState.timer = setInterval(tickRest, 250);
}

function stopRest() {
  clearInterval(restState.timer);
  clearTimeout(restState.doneTimer);
  restState.timer = null;
  restState.endAt = 0;
  releaseWake();
  clearRestStore();
  restEl.hidden = true;
  restEl.classList.remove('done');
  restEl.replaceChildren();
}

function adjustRest(delta) {
  if (!restState.endAt) return;
  const left = restState.endAt - Date.now();
  if (left <= 0) return;
  const newLeft = Math.max(1000, left + delta * 1000);
  restState.endAt = Date.now() + newLeft;
  restState.total = Math.max(restState.total + delta, Math.ceil(newLeft / 1000));
  persistRest();
  tickRest();
}

function drawRest() {
  restEl.hidden = false;
  restEl.classList.remove('done');
  restEl.replaceChildren(
    h('div', { class: 'rest-fill' }),
    h('div', { class: 'rest-main' },
      h('div', { class: 'rest-time' }, fmtTime(restState.total)),
      h('div', { class: 'rest-label' }, restState.label ? `Pause · ${restState.label}` : 'Pause')),
    h('div', { class: 'rest-actions' },
      h('button', { class: 'btn btn-small', type: 'button', 'aria-label': '15 Sekunden weniger', onclick: () => adjustRest(-15) }, '−15'),
      h('button', { class: 'btn btn-small', type: 'button', 'aria-label': '15 Sekunden mehr', onclick: () => adjustRest(15) }, '+15'),
      iconBtn('x', 'Pause beenden', stopRest)));
  tickRest();
}

function tickRest() {
  if (!restState.endAt) return;
  const leftMs = restState.endAt - Date.now();
  if (leftMs <= 0) { finishRest(-leftMs); return; }
  const t = $('.rest-time', restEl);
  const f = $('.rest-fill', restEl);
  if (t) t.textContent = fmtTime(Math.ceil(leftMs / 1000));
  if (f) f.style.transform = `scaleX(${Math.min(1, Math.max(0, 1 - leftMs / (restState.total * 1000)))})`;
}

function finishRest(overdueMs) {
  clearInterval(restState.timer);
  restState.timer = null;
  releaseWake();
  clearRestStore();
  if (overdueMs > 20000) { stopRest(); return; } // lange vorbei (z. B. App war im Hintergrund)
  const label = restState.label;
  restState.endAt = 0;
  restEl.hidden = false;
  restEl.classList.add('done');
  restEl.replaceChildren(
    h('div', { class: 'rest-main' },
      h('div', { class: 'rest-time' }, 'Los geht’s!'),
      h('div', { class: 'rest-label' }, label ? `Pause vorbei · ${label}` : 'Pause vorbei')),
    h('div', { class: 'rest-actions' }, h('button', { class: 'btn btn-small', type: 'button', onclick: stopRest }, 'OK')));
  if (overdueMs < 3000) { beep(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
  restState.doneTimer = setTimeout(stopRest, 20000);
}

function restoreRest() {
  try {
    const r = JSON.parse(lsGet(REST_KEY) || 'null');
    if (!r || !(r.endAt > Date.now() - 20000) || !(r.total > 0)) return;
    restState.endAt = r.endAt; restState.total = r.total; restState.label = typeof r.label === 'string' ? r.label : '';
    restState.timer = setInterval(tickRest, 250);
    drawRest();
    requestWake();
  } catch { /* egal */ }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && restState.endAt) { tickRest(); requestWake(); }
});

/* =====================================================================
   Start
   ===================================================================== */

applyTheme();
render();
restoreRest();

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e)); });
}
