// js/fx.js — everything the eye sees that isn't layout: lights, rain, cameos, chaos.
'use strict';

import { state, mode } from './state.js';

const el = id => document.getElementById(id);

let WORDS = [];
let bandOverride = null, bandOverrideUntil = 0;
let cameoBusy = false;

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

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  el('toasts').appendChild(t);
  setTimeout(() => t.classList.add('bye'), 3400);
  setTimeout(() => t.remove(), 4000);
}

export function rain(n) {
  const EMO = mode().rain;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'drop';
    d.textContent = EMO[Math.floor(Math.random() * EMO.length)];
    d.style.left = Math.random() * 100 + 'vw';
    d.style.fontSize = (22 + Math.random() * 34) + 'px';
    d.style.animationDuration = (1.4 + Math.random() * 1.6) + 's';
    d.style.animationDelay = (Math.random() * 0.9) + 's';
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
}

export function cameo() {
  if (cameoBusy) return;
  cameoBusy = true;
  const w = document.createElement('div');
  w.className = 'trae';
  const glyph = document.createElement('span');
  glyph.className = 'emoji'; glyph.textContent = mode().cameoGlyph;
  const cap = document.createElement('div');
  cap.className = 'cap'; cap.textContent = mode().cameoCap;
  w.append(glyph, cap);
  document.body.appendChild(w);
  requestAnimationFrame(() => { w.style.bottom = '6vh'; });
  setTimeout(() => { w.classList.add('bow'); }, 900);
  setTimeout(() => { w.style.bottom = '-45vh'; }, 2900);
  setTimeout(() => { w.remove(); cameoBusy = false; }, 3900);
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
  el('band').textContent =
    (performance.now() < bandOverrideUntil && bandOverride) ? bandOverride : label;
}

export function updateMeter(hype, dbText) {
  el('fill').style.width = hype + '%';
  el('db').textContent = dbText;
}

export function setShaking(on) {
  el('arena').classList.toggle('shaking', on);
}

export function pumpButton() {
  const b = el('chantBtn');
  b.classList.remove('pump'); void b.offsetWidth; b.classList.add('pump');
}

// ---- placeholders that grow real in later tasks ----
export function kick() {}
export function flashesStart() {}
export function grainTribute() {}
export function pigeon() {}
export function rat() {}
export function pennRumbleVisual() {}
