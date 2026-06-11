// js/main.js — boot, the rAF loop, and all the wiring. The building superintendent.
'use strict';

import { state, mode, MODES, setMode, addHype, milestoneText, loadPersisted, bus } from './state.js';
import * as audio from './audio.js';
import { startChant, stopChant, chantOn } from './chant.js';
import * as fx from './fx.js';
import * as nyc from './nyc.js';
import { initWorldwide } from './worldwide.js';

const el = id => document.getElementById(id);

let maxArmed = true, lastCrowdSet = 0, wakeLock = null;
let shakeReady = false, lastShake = 0;

// ---------- mode application (DOM side) ----------
function renderFoot(foot) {
  const host = el('foot');
  host.replaceChildren(...foot.split('<br>').flatMap((line, i) =>
    i ? [document.createElement('br'), document.createTextNode(line)]
      : [document.createTextNode(line)]));
}

function applyModeDOM(announce) {
  const m = mode();
  fx.wordsRebuild(m.words);
  el('enemyLbl').textContent = m.panelLbl;
  el('clockChip').textContent = m.clock;
  el('eraChip').textContent = m.chip;
  el('hint').textContent = m.hint;
  renderFoot(m.foot);
  el('modeBtn').textContent = 'VS: ' + (state.modeName === 'trae' ? 'TRAE' : 'WEMBY');
  el('modeBtn').classList.toggle('on', state.modeName === 'wemby');
  const gh = el('gateTitle');
  if (gh) gh.replaceChildren(...m.words.flatMap((w, i) =>
    i ? [document.createElement('br'), document.createTextNode(w)]
      : [document.createTextNode(w)]));
  if (announce) fx.toast(state.modeName === 'wemby'
    ? 'WEMBY MODE — FINALS EDITION. SAME ENERGY.'
    : 'CLASSIC MODE — EST. 2021.');
}

bus.addEventListener('mode', e => applyModeDOM(e.detail.announce));

// ---------- the payoff ----------
function maxEvent() {
  if (!maxArmed || state.hype < 99.5) return;
  maxArmed = false;
  state.session.singularities++;
  fx.toast('🚨 121 dB — BING BONG SINGULARITY ACHIEVED');
  audio.organCharge();
  setTimeout(audio.airhorn, 850);
  setTimeout(audio.bingBong, 1600);
  fx.cameo();
  fx.rain(44);
  fx.strobe(1600);
  navigator.vibrate?.([120, 60, 120, 60, 240]);
}

// ---------- crowd input ----------
function press() {
  audio.ensureAudio();
  addHype(7);
  maxEvent();
  state.session.presses++;
  const m = milestoneText(state.session.presses);
  if (m) { fx.toast(m); audio.organCharge(); }
  navigator.vibrate?.(20);
  audio.pressThump();
  fx.pumpButton();
}

// pointerdown for instant response when mashing on touch; the click handler
// is the fallback for keyboards and programmatic clicks, deduped by timestamp
let lastPointerPress = 0;
el('chantBtn').addEventListener('pointerdown', ev => {
  lastPointerPress = performance.now();
  press();
  ev.preventDefault();
});
el('chantBtn').addEventListener('click', ev => {
  if (performance.now() - lastPointerPress > 400) press();
  ev.currentTarget.blur();
});
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); press(); }
});

// ---------- toggles + buttons ----------
el('sndBtn').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  audio.ensureAudio();
  audio.setMuted(!state.soundOn);
  el('sndBtn').textContent = 'SOUND: ' + (state.soundOn ? 'ON' : 'OFF');
  el('sndBtn').classList.toggle('on', state.soundOn);
});

el('paBtn').addEventListener('click', () => {
  state.voiceOn = !state.voiceOn;
  el('paBtn').textContent = 'VOICE CHANT: ' + (state.voiceOn ? 'ON' : 'OFF');
  el('paBtn').classList.toggle('on', state.voiceOn);
  if (!state.voiceOn) audio.cancelSpeech();
});

el('modeBtn').addEventListener('click', () => {
  setMode(state.modeName === 'trae' ? 'wemby' : 'trae', true);
});

window.addEventListener('hashchange', () => {
  const h = location.hash.replace('#', '');
  if (MODES[h] && h !== state.modeName) setMode(h, true);
});

el('bingBtn').addEventListener('click', () => {
  audio.ensureAudio();
  audio.bingBong();
  addHype(10);
  maxEvent();
  fx.bandFlash('🔔 BING BONG 🔔', 1200);
  audio.speak('BING BONG!');
  navigator.vibrate?.([60, 40, 60]);
});

el('daggerBtn').addEventListener('click', () => {
  audio.ensureAudio();
  fx.toast('🗡 DAGGER. GAME. BING BONG.');
  state.hype = 100;
  maxArmed = true; // the dagger button always goes nuclear
  maxEvent();
  fx.bandFlash('🗡 DAGGER 🗡', 1800);
  audio.speak('BANG!');
  setTimeout(() => audio.speak('BANG!'), 450);
});

// ---------- shake the phone like you're in section 209 ----------
function enableShake() {
  const DM = window.DeviceMotionEvent;
  if (!DM) return;
  const attach = () => {
    if (!shakeReady) { shakeReady = true; window.addEventListener('devicemotion', onShake); }
  };
  if (typeof DM.requestPermission === 'function') {
    DM.requestPermission().then(s => { if (s === 'granted') attach(); }).catch(() => {});
  } else attach();
}

function onShake(e) {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
  const now = performance.now();
  if (mag > 30 && now - lastShake > 180) {
    lastShake = now;
    addHype(5);
    maxEvent();
  }
}

// the screen does not sleep during the Finals
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) {}
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    keepAwake();
    audio.resumeIfNeeded();
  }
});
window.addEventListener('pointerdown', () => audio.resumeIfNeeded(), true);

// ---------- the turnstile (audio unlock happens inside the swipe) ----------
nyc.initGate(() => {
  enableShake();
  keepAwake();
  addHype(16);
  fx.titleSlam();
  fx.toast('Welcome to the Garden. You know the words.');
});

// ---------- main loop ----------
function bandLabel() {
  const h = state.hype;
  if (h < 1)    return 'THE GARDEN IS WAITING';
  if (h < 25)   return 'LIBRARY MODE (CELTICS HOME GAME)';
  if (h < 50)   return 'REGULAR SEASON RUMBLE';
  if (h < 75)   return 'PLAYOFF GARDEN';
  if (h < 99.5) return 'GAME 7 DELIRIUM';
  return 'BING BONG SINGULARITY';
}

let lastT = performance.now(), lastLifetime = -1;
function loop(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;

  if (state.hype > 0) state.hype = Math.max(0, state.hype - dt * (2.2 + state.hype * 0.030));

  const db = state.hype > 0.5 ? Math.round(58 + state.hype * 0.63) : 0;
  if (db > state.session.peakDb) state.session.peakDb = db;
  fx.updateMeter(state.hype, (db || '—') + ' dB');
  fx.updateBand(bandLabel());
  fx.setShaking(state.hype > 72);

  if (audio.audioOn()) {
    if (now - lastCrowdSet > 120) { lastCrowdSet = now; audio.setCrowd(state.hype); }
    if (state.hype > 5 && !chantOn()) startChant();
    if (state.hype < 3 && chantOn()) stopChant();
  }

  maxEvent();
  if (state.hype < 40) maxArmed = true;

  if (state.lifetime !== lastLifetime) {
    lastLifetime = state.lifetime;
    el('chantCount').textContent = state.lifetime.toLocaleString();
  }

  nyc.becTick();

  requestAnimationFrame(loop);
}

// ---------- boot ----------
loadPersisted();
applyModeDOM(false);
fx.flashesStart();
nyc.initTicker();
nyc.initTimbs();
nyc.initBec();
nyc.initStarks();
el('receiptBtn').addEventListener('click', nyc.openReceipt);
initWorldwide();
el('chantCount').textContent = state.lifetime.toLocaleString();
requestAnimationFrame(loop);
