// js/chant.js — the beat scheduler. 138 BPM, three syllables, one rest. Forever.
'use strict';

import { state, BEAT, BAR, saveLifetime } from './state.js';
import { audioOn, tNow, syllable, speakPhrase } from './audio.js';
import { lightWord, setIdle, kick } from './fx.js';
import { bumpWorldwide } from './worldwide.js';

let active = false, schedTimer = null, nextBar = 0;

export function chantOn() { return active; }

export function startChant() {
  if (active || !audioOn()) return;
  active = true;
  setIdle(false);
  nextBar = tNow() + 0.06;
  schedTimer = setInterval(schedule, 25);
}

export function stopChant() {
  if (!active) return;
  active = false;
  clearInterval(schedTimer);
  setTimeout(() => {
    if (!active) { lightWord(-1); setIdle(true); }
  }, 700);
}

function schedule() {
  while (nextBar < tNow() + 0.18) {
    scheduleBar(nextBar);
    nextBar += BAR;
  }
}

let barIndex = 0;

function scheduleBar(t) {
  for (let k = 0; k < 3; k++) {
    const st = t + k * BEAT;
    syllable(st, k);
    visualAt(st, () => { lightWord(k); kick(); navigator.vibrate?.(35); });
  }
  visualAt(t + 3 * BEAT, () => { if (active) lightWord(-1); });
  if (barIndex % 2 === 0) visualAt(t, speakPhrase); // full phrase, every other bar
  barIndex++;
  state.session.bars++;
  state.lifetime++;
  saveLifetime();
  bumpWorldwide();
}

function visualAt(t, fn) {
  setTimeout(fn, Math.max(0, (t - tNow()) * 1000));
}
