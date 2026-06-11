// js/nyc.js — the borough layer: turnstile, ticker, BEC, Timbs, receipt, The Dunk.
'use strict';

import { state, mode, bus, SHARED_TICKER, TEST, addHype, saveTimbs } from './state.js';
import { ensureAudio, turnstileBeep, clickClack, crinkle } from './audio.js';
import { toast } from './fx.js';

const el = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- the turnstile ----------
// A swipe that completes most of the slot in 150-900ms reads as valid.
// Anything else gets the message every New Yorker has eaten.
export function initGate(onEnter) {
  const gate = el('gate'), card = el('metrocard'), slot = el('slot'), lcd = el('lcd');
  let startX = null, startT = 0, fails = 0, entered = false;
  const W = () => slot.getBoundingClientRect().width;

  card.addEventListener('pointerdown', e => {
    if (entered) return;
    startX = e.clientX; startT = performance.now();
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
    card.classList.add('grab');
  });

  card.addEventListener('pointermove', e => {
    if (startX === null || entered) return;
    const dx = Math.max(0, Math.min(e.clientX - startX, W()));
    card.style.transform = `translateX(${dx}px)`;
  });

  const release = e => {
    if (startX === null || entered) return;
    const dx = e.clientX - startX, ms = performance.now() - startT;
    startX = null;
    card.classList.remove('grab');
    const ok = dx >= W() * 0.6 && ms >= 150 && ms <= 900;
    if (ok) pass('swiped'); else fail();
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);
  card.addEventListener('dblclick', () => { if (!entered) pass('swiped'); });
  el('hop').addEventListener('click', () => { if (!entered) pass('hopped'); });

  function fail() {
    fails++;
    state.session.swipeFails = fails;
    card.classList.add('ret');
    card.style.transform = '';
    setTimeout(() => card.classList.remove('ret'), 350);
    ensureAudio(); // the failed drag is still a gesture; the error beep is earned
    turnstileBeep(false);
    lcd.textContent = 'PLEASE SWIPE AGAIN AT THIS TURNSTILE';
    lcd.classList.remove('err'); void lcd.offsetWidth;
    lcd.classList.add('err');
    if (fails >= 2) el('hop').hidden = false;
  }

  function pass(method) {
    entered = true;
    ensureAudio(); // THE unlock — inside the gesture, no second prompt ever
    turnstileBeep(true);
    clickClack();
    lcd.textContent = 'GO';
    lcd.classList.remove('err');
    lcd.classList.add('go');
    card.style.transform = `translateX(${W() + 40}px)`;
    card.classList.add('through');
    if (method === 'swiped' && fails > 0) method = 'swiped twice';
    state.session.entry = method;
    gate.classList.add('open');
    if (!reducedMotion.matches) el('sweep').classList.add('go');
    setTimeout(() => gate.remove(), reducedMotion.matches ? 500 : 1700);
    setTimeout(() => onEnter(method), 350);
  }
}
// ---------- the service-alert ticker ----------
let tickerPool = [], injectQueue = [];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderTicker() {
  const s = [...injectQueue, ...tickerPool].join('  •••  ');
  el('tick').textContent = s + '  •••  ' + s + '  •••  ';
  injectQueue = [];
}

function buildTicker() {
  tickerPool = shuffle([...SHARED_TICKER, ...mode().ticker]);
  renderTicker();
}

export function initTicker() {
  buildTicker();
  bus.addEventListener('mode', buildTicker);
}

export function refreshTicker() { buildTicker(); }

// the rumble announces its train
export function tickerInject(line) {
  injectQueue.push(line);
  renderTicker();
}
// ---------- bacon egg and cheese ----------
// The deli guy saw you struggling. No sparkle, no bounce. It leaves
// on its own if you don't want it. More for us.
const BEC_THRESHOLD = TEST ? 1500 : 10000;
const BEC_COOLDOWN = TEST ? 5000 : 90000;
let becLowSince = null, becCooldownUntil = 0, becVisible = false, becTimeout = null;

export function becTick() {
  if (becVisible || performance.now() < becCooldownUntil) return;
  if (!state.session.entry) return; // nobody eats before the turnstile
  if (state.hype < 20) {
    if (becLowSince === null) becLowSince = performance.now();
    if (performance.now() - becLowSince >= BEC_THRESHOLD) showBec();
  } else {
    becLowSince = null;
  }
}

function showBec() {
  becVisible = true; becLowSince = null;
  const b = el('bec');
  b.hidden = false;
  void b.offsetWidth; // commit display before the transition starts
  b.classList.add('in');
  becTimeout = setTimeout(hideBec, 12000);
}

function hideBec() {
  clearTimeout(becTimeout);
  const b = el('bec');
  b.classList.remove('in');
  setTimeout(() => { b.hidden = true; becVisible = false; }, 600);
  becCooldownUntil = performance.now() + BEC_COOLDOWN;
}

export function initBec() {
  el('bec').addEventListener('click', () => {
    if (!becVisible) return;
    addHype(35);
    state.session.becs++;
    crinkle();
    toast('SALT PEPPER KETCHUP');
    hideBec();
  });
}

// ---------- timbs ----------
export function initTimbs() {
  const btn = el('timbsBtn'), lbl = el('timbsLbl');
  const render = () => {
    lbl.textContent = 'TIMBS: ' + (state.timbs ? 'ON' : 'OFF');
    btn.classList.toggle('on', state.timbs);
    document.documentElement.style.setProperty('--kickmag', state.timbs ? '1.3' : '1');
  };
  render();
  btn.addEventListener('click', () => {
    state.timbs = !state.timbs;
    saveTimbs();
    render();
  });
}

// ---------- the receipt ----------
export function openReceipt() {
  const s = state.session;
  const slip = el('slip');
  slip.replaceChildren();
  const line = (txt, cls) => {
    const d = document.createElement('div');
    d.textContent = txt;
    if (cls) d.className = cls;
    slip.appendChild(d);
    return d;
  };
  const row = (left, right) => {
    const d = document.createElement('div');
    d.className = 'row';
    const a = document.createElement('span'); a.textContent = left;
    const z = document.createElement('span'); z.textContent = right;
    d.append(a, z);
    slip.appendChild(d);
  };
  const hr = () => slip.appendChild(document.createElement('hr'));
  const now = new Date();
  const stamp = (now.getMonth() + 1).toString().padStart(2, '0') + '/' +
    now.getDate().toString().padStart(2, '0') + '/' + now.getFullYear() + ' ' +
    ((now.getHours() % 12) || 12) + ':' + now.getMinutes().toString().padStart(2, '0') +
    (now.getHours() < 12 ? ' AM' : ' PM');

  line('FUCK TRAE YOUNG', 'c b');
  line('MADISON SQVARE GARDEN', 'c');
  line('EST. 2021 · ' + stamp, 'c');
  hr();
  row('1x ENTRY — ' + (s.entry || 'STILL OUTSIDE').toUpperCase(), '$0.00');
  row(s.bars + 'x FUCKS CHANTED', '$0.00');
  if (s.peakDb) row('PEAK NOISE ' + s.peakDb + ' DB', '$0.00');
  if (s.singularities) row(s.singularities + 'x SINGULARITY', '$0.00');
  if (s.becs) row(s.becs + 'x BACON EGG AND CHEESE', '$0.00');
  if (s.dunks) row(s.dunks + 'x THE DUNK, WITNESSED', '$0.00');
  hr();
  row('TOTAL', '$0.00');
  hr();
  line('CASH ONLY / ATM INSIDE', 'c');
  line('CUSTOMER OF THE MONTH', 'c');
  hr();
  line('NO SUBSTITUTIONS. FUCK TRAE YOUNG.', 'c b');

  const wrap = el('receipt');
  wrap.hidden = false;
  wrap.onclick = () => { wrap.hidden = true; };
}

// ---------- the dunk (built in Task 7) ----------
export function initStarks() {}
