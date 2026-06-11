// js/fx.js — everything the eye sees that isn't layout: lights, rain, cameos, chaos.
'use strict';

import { state, mode } from './state.js';

const el = id => document.getElementById(id);

let WORDS = [];
let bandOverride = null, bandOverrideUntil = 0;

export function wordsRebuild(words) {
  const host = el('words');
  host.replaceChildren(...words.map(w => {
    const s = document.createElement('span');
    s.className = 'word';
    s.textContent = w;
    return s;
  }));
  WORDS = [...host.querySelectorAll('.word')];
}

export function lightWord(beat) {
  if (takeoverActive) return; // the board is saying something else right now
  WORDS.forEach(w => w.classList.remove('lit'));
  if (beat < 0) return;
  const w = WORDS[mode().beatMap[beat]];
  if (!w) return;
  void w.offsetWidth; // restart the pop animation when the same word hits twice (WEM-BY)
  w.classList.add('lit');
  el('jumbo').classList.add('flash');
  setTimeout(() => el('jumbo').classList.remove('flash'), 90);
}

export function setIdle(idle) {
  el('jumbo').classList.toggle('idle', idle);
}

// the title hits the board like it owns the building
export function titleSlam() {
  WORDS.forEach((w, i) => setTimeout(() => {
    w.classList.add('slam');
    setTimeout(() => w.classList.remove('slam'), 600);
  }, i * 90));
}

// announcements belong on the board, not in floating web-app toasts
export function toast(msg) {
  bandFlash(msg.toUpperCase(), 3200);
}

// championship confetti: paper, not stickers
const CONFETTI = ['#006BB6', '#F58426', '#ffffff', '#BEC0C2'];
export function rain(n) {
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'cfetti';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.width = (6 + Math.random() * 5) + 'px';
    d.style.height = (10 + Math.random() * 7) + 'px';
    d.style.background = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
    d.style.setProperty('--dx', (Math.random() * 24 - 12).toFixed(1) + 'vw');
    d.style.setProperty('--rot', Math.round(540 + Math.random() * 540) + 'deg');
    d.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
    d.style.animationDelay = (Math.random() * 1) + 's';
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
}

// the board takes over. no mascots, no stickers — just the message.
let takeoverActive = false;
export function takeover() {
  if (takeoverActive) return;
  takeoverActive = true;
  const tk = mode().takeover;
  wordsRebuild(tk.words);
  WORDS.forEach(w => w.classList.add('lit'));
  bandFlash(tk.cap, 2600);
  setTimeout(() => {
    takeoverActive = false;
    wordsRebuild(mode().words);
  }, 2600);
}

export function strobe(ms) {
  const s = el('strobe');
  s.classList.add('go');
  setTimeout(() => s.classList.remove('go'), ms);
}

export function bandFlash(txt, ms) {
  bandOverride = txt;
  bandOverrideUntil = performance.now() + ms;
}

export function updateBand(label) {
  const announcing = performance.now() < bandOverrideUntil && bandOverride;
  const band = el('band');
  band.textContent = announcing ? bandOverride : label;
  band.classList.toggle('announce', !!announcing);
}

let vuSegs = null, peakLit = 0, peakUntil = 0;
function ensureVu() {
  if (vuSegs) return;
  const vu = el('vu');
  vuSegs = Array.from({ length: 24 }, (_, i) => {
    const s = document.createElement('span');
    s.className = 'seg ' + (i < 14 ? 'g' : i < 19 ? 'a' : 'r');
    vu.appendChild(s);
    return s;
  });
}

export function updateMeter(hype, dbText) {
  ensureVu();
  const lit = Math.round(hype / 100 * 24);
  const now = performance.now();
  if (lit >= peakLit || now > peakUntil) { peakLit = lit; peakUntil = now + 900; }
  vuSegs.forEach((s, i) => {
    s.classList.toggle('on', i < lit);
    s.classList.toggle('peak', i === peakLit - 1 && peakLit > lit);
  });
  el('db').textContent = dbText;
}

export function setShaking(on) {
  el('arena').classList.toggle('shaking', on);
}

export function pumpButton() {
  const b = el('chantBtn');
  b.classList.remove('pump'); void b.offsetWidth; b.classList.add('pump');
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// a 4px shove in a random direction, synced to the stomp
export function kick() {
  if (reducedMotion.matches) return;
  const a = el('arena');
  const ang = Math.random() * Math.PI * 2;
  a.style.setProperty('--kx', (Math.cos(ang) * 4).toFixed(1) + 'px');
  a.style.setProperty('--ky', (Math.sin(ang) * 4).toFixed(1) + 'px');
  a.classList.remove('kick'); void a.offsetWidth; a.classList.add('kick');
}

// camera flashes in the dark upper bowl. somebody's always filming.
export function flashesStart() {
  const host = el('flashes');
  for (let i = 0; i < 14; i++) {
    const d = document.createElement('span');
    d.className = 'cflash';
    d.style.left = (Math.random() * 100).toFixed(1) + 'vw';
    d.style.top = (3 + Math.random() * 52).toFixed(1) + 'vh';
    d.style.setProperty('--d', (7 + Math.random() * 8).toFixed(1) + 's');
    d.style.setProperty('--dl', (Math.random() * 12).toFixed(1) + 's');
    host.appendChild(d);
  }
}

// ---------- the animals (budget: two) ----------
let animalActive = false;
export function animalBusy() { return animalActive; }

function spawnWalker(className, parts, host) {
  if (animalActive) return null;
  animalActive = true;
  const w = document.createElement('div');
  w.className = className;
  parts.forEach(c => {
    const s = document.createElement('span');
    s.className = c;
    w.appendChild(s);
  });
  host.appendChild(w);
  w.addEventListener('animationend', e => {
    if (e.target !== w) return; // ignore child animations (head bob, etc.)
    w.remove();
    animalActive = false;
  });
  return w;
}

// struts across the board, does not acknowledge you, leaves
export function pigeon() {
  spawnWalker('pigeon', ['pg-body', 'pg-wing', 'pg-neck', 'pg-head', 'pg-eye', 'pg-beak', 'pg-leg pg-l1', 'pg-leg pg-l2'], el('jumbo'));
}

// rarer. silent. the slice is heavier than he is.
export function rat() {
  spawnWalker('rat', ['rt-slice', 'rt-crust', 'rt-tail', 'rt-body', 'rt-ear', 'rt-eye'], document.body);
}

// the LIRR is leaving and the whole building knows
export function pennRumbleVisual() {
  if (reducedMotion.matches) return;
  const a = el('arena');
  a.classList.add('rumble');
  setTimeout(() => a.classList.remove('rumble'), 4000);
}

// MAY 25, 1993 — grain, letterbox, and the building losing its mind
export function grainTribute() {
  const t = el('tribute');
  t.classList.add('go');
  if (reducedMotion.matches) t.classList.add('rm');
  setTimeout(() => t.classList.remove('go', 'rm'), 1600);
}
