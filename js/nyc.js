// js/nyc.js — the borough layer: turnstile, ticker, BEC, Timbs, receipt, The Dunk.
'use strict';

import { state } from './state.js';
import { ensureAudio, turnstileBeep, clickClack } from './audio.js';

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
export function initTicker() {}
export function refreshTicker() {}
export function becTick(dtMs) {}
export function initTimbs() {}
export function initStarks() {}
export function openReceipt() {}
