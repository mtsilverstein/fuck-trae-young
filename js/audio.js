// js/audio.js — the building's sound system. Everything synthesized, nothing sampled.
'use strict';

import { state, mode } from './state.js';

let ctx = null, master = null, crowdGain = null, noiseBuf = null;
let crowdLayers = [];
let arenaBus = null, keeper = null, speechWarmed = false;

export function audioOn() { return !!ctx; }
export function tNow() { return ctx ? ctx.currentTime : 0; }

function silentWavURI() {
  const n = 2000, sr = 8000;
  const bytes = new Uint8Array(44 + n);
  const dv = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  w(36, 'data'); dv.setUint32(40, n, true);
  bytes.fill(128, 44);
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
  return 'data:audio/wav;base64,' + btoa(bin);
}

// iOS mutes the Web Audio API when the ringer switch is on silent, but a
// playing HTMLMediaElement promotes the audio session to "playback", which
// un-mutes it. So we loop an inaudible <audio> element as a session keeper.
function unlockMobileAudio() {
  if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (e) {} }
  if (!keeper) {
    keeper = document.createElement('audio');
    keeper.setAttribute('playsinline', '');
    keeper.loop = true;
    keeper.src = silentWavURI();
    keeper.play().catch(() => { keeper = null; });
  }
}

export function ensureAudio() {
  unlockMobileAudio();
  // iOS only allows speechSynthesis after a speak() from a user gesture —
  // warm it up with a silent utterance so the scheduled chant can talk
  if (!speechWarmed && 'speechSynthesis' in window) {
    speechWarmed = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = state.soundOn ? 1 : 0;
    // master compressor so phone speakers slap without clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24; comp.knee.value = 30; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);

    noiseBuf = (() => {
      const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    })();

    // crowd bed: three formant layers with slow independent swells —
    // reads as a building full of humans, not a noise generator
    crowdGain = ctx.createGain(); crowdGain.gain.value = 0;
    crowdGain.connect(master);
    crowdLayers = [
      { f: 280,  lfoHz: 0.07, depth: 0.50 },
      { f: 750,  lfoHz: 0.11, depth: 0.60 },
      { f: 1200, lfoHz: 0.05, depth: 0.45 }
    ].map(cfg => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      src.playbackRate.value = 0.92 + Math.random() * 0.16; // decorrelate layers
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = cfg.f; bp.Q.value = 1.2;
      const g = ctx.createGain(); g.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.frequency.value = cfg.lfoHz;
      const lfoAmp = ctx.createGain(); lfoAmp.gain.value = cfg.depth * 0.4;
      lfo.connect(lfoAmp); lfoAmp.connect(g.gain);
      src.connect(bp); bp.connect(g); g.connect(crowdGain);
      src.start(); lfo.start();
      return { bp, base: cfg.f };
    });

    // arena slapback so the chant sounds like a building, not a phone speaker
    const dly = ctx.createDelay(0.5); dly.delayTime.value = 0.13;
    const fb = ctx.createGain(); fb.gain.value = 0.22;
    const wet = ctx.createGain(); wet.gain.value = 0.18;
    dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
    arenaBus = dly;
  }
  if (ctx.state !== 'running') ctx.resume();
}

export function resumeIfNeeded() {
  if (ctx && ctx.state !== 'running') ctx.resume();
}

export function setMuted(muted) {
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
  if (muted) cancelSpeech();
}

export function setCrowd(hype) {
  if (!ctx) return;
  crowdGain.gain.setTargetAtTime(0.012 + (hype / 100) * 0.26, ctx.currentTime, 0.25);
  crowdLayers.forEach(l =>
    l.bp.frequency.setTargetAtTime(l.base * (1 + 0.35 * hype / 100), ctx.currentTime, 0.3));
}

function burst(t, { type = 'bandpass', freq = 500, q = 0.8, peak = 0.3, a = 0.03, d = 0.3 } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  s.connect(f); f.connect(g); g.connect(master);
  if (arenaBus) g.connect(arenaBus);
  s.start(t); s.stop(t + a + d + 0.05);
}

function thump(t, peak = 0.6) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.13);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(master);
  if (arenaBus) g.connect(arenaBus);
  o.start(t); o.stop(t + 0.2);
  // floor resonance tail — the building answers
  const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 35;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, t + 0.02);
  g2.gain.linearRampToValueAtTime(peak * 0.35, t + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o2.connect(g2); g2.connect(master);
  o2.start(t); o2.stop(t + 0.32);
}

function timbsStomp(t) {
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 38;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.25);
}

// vowel formant pairs per beat: UH / AY / UH
const VOWELS = [[700, 1100], [600, 1700], [650, 1080]];

function roar(t, f, qScale, peak, d) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 2.2 * qScale;
  bp.frequency.setValueAtTime(f * 0.88, t);
  bp.frequency.linearRampToValueAtTime(f * 1.12, t + d * 0.7);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.035);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035 + d);
  s.connect(bp); bp.connect(g); g.connect(master);
  if (arenaBus) g.connect(arenaBus);
  s.start(t); s.stop(t + d + 0.1);
}

// one syllable of 20,000 people yelling in unison
export function syllable(t, k) {
  const power = 0.34 + (state.hype / 100) * 0.45;
  const dur = k === 2 ? 0.42 : 0.26;
  const [f1, f2] = VOWELS[k];
  roar(t, f1, 1.0, power, dur);
  roar(t, f2, 0.55, power * 0.7, dur);
  thump(t, 0.45 + (state.hype / 100) * 0.25);
  if (state.timbs) timbsStomp(t);
  for (let i = 0; i < 3; i++) {
    burst(t + Math.random() * 0.045, { type: 'highpass', freq: 2400, q: 0.7, peak: 0.09, a: 0.005, d: 0.06 });
  }
}

export function pressThump() {
  if (!ctx) return;
  const t = ctx.currentTime;
  thump(t, 0.32);
  burst(t, { type: 'highpass', freq: 2600, q: 0.7, peak: 0.08, a: 0.004, d: 0.05 });
}

export function boo() {
  ensureAudio();
  const t = ctx.currentTime;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.1;
  f.frequency.setValueAtTime(300, t);
  f.frequency.linearRampToValueAtTime(150, t + 1.8);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.35);
  g.gain.setValueAtTime(0.5, t + 1.2);
  g.gain.linearRampToValueAtTime(0.0001, t + 2);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + 2.1);
}

export function airhorn() {
  ensureAudio();
  const t0 = ctx.currentTime;
  [[0, 0.22], [0.32, 0.22], [0.64, 0.9]].forEach(([off, dur]) => {
    const t = t0 + off;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.02);
    g.gain.setValueAtTime(0.4, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(master);
    if (arenaBus) g.connect(arenaBus);
    [466, 469, 233].forEach((fr, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'square' : 'sawtooth';
      o.frequency.setValueAtTime(fr, t);
      o.frequency.linearRampToValueAtTime(fr * 0.96, t + dur);
      const og = ctx.createGain(); og.gain.value = i === 2 ? 0.16 : 0.28;
      o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + dur + 0.02);
    });
  });
}

// the sacred two notes
function ding(t, f) {
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  const g2 = ctx.createGain(); g2.gain.value = 0.12;
  o2.connect(g2); g2.connect(g);
  o.connect(g); g.connect(master);
  if (arenaBus) g.connect(arenaBus);
  o.start(t); o.stop(t + 1.15); o2.start(t); o2.stop(t + 1.15);
}

export function bingBong() {
  ensureAudio();
  const t = ctx.currentTime;
  ding(t, 988);        // BING
  ding(t + 0.30, 784); // BONG
}

function organNote(t, f, dur) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.012);
  g.gain.setValueAtTime(0.3, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g); g.connect(master);
  if (arenaBus) g.connect(arenaBus);
  [[1, 0.35], [2, 0.12]].forEach(([mult, amp]) => {
    const o = ctx.createOscillator();
    o.type = 'square'; o.frequency.value = f * mult;
    const og = ctx.createGain(); og.gain.value = amp;
    o.connect(og); og.connect(lp);
    o.start(t); o.stop(t + dur + 0.02);
  });
}

// the real six-note CHARGE! riff — the sound of the building
export function organCharge() {
  ensureAudio();
  const NOTES = [196.0, 261.63, 329.63, 392.0, 523.25, 659.26]; // G3 C4 E4 G4 C5 E5
  const t0 = ctx.currentTime;
  NOTES.forEach((f, i) => organNote(t0 + i * 0.14, f, 0.13));
  organNote(t0 + 6 * 0.14, 783.99, 0.5); // G5, held
}

function beepTone(t, f, dur, amp) {
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(amp, t + 0.008);
  g.gain.setValueAtTime(amp, t + dur * 0.8);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

export function turnstileBeep(ok) {
  ensureAudio();
  const t = ctx.currentTime;
  if (ok) beepTone(t, 2637, 0.09, 0.25);
  else { beepTone(t, 392, 0.12, 0.3); beepTone(t + 0.15, 392, 0.12, 0.3); }
}

export function clickClack() {
  ensureAudio();
  const t = ctx.currentTime;
  [0, 0.07].forEach(off =>
    burst(t + off, { type: 'highpass', freq: 1800, q: 1, peak: 0.22, a: 0.002, d: 0.05 }));
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 90;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.1);
}

// deli paper. you know the sound.
export function crinkle() {
  ensureAudio();
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    burst(t + i * 0.07 + Math.random() * 0.02,
      { type: 'highpass', freq: 3200, q: 0.7, peak: 0.14, a: 0.004, d: 0.07 });
  }
}

// the LIRR, somewhere under your feet
export function pennRumbleAudio(seconds) {
  ensureAudio();
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 28;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.18, t + seconds * 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + seconds);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + seconds + 0.05);
}

// one spoken syllable per beat, riding the same scheduler as the lights.
// if the engine falls behind, drop the backlog at the top of the bar so
// the voice snaps back onto the beat instead of drifting.
export function speakSyl(k) {
  if (!state.voiceOn || !state.soundOn || !('speechSynthesis' in window)) return;
  if (k === 0 && speechSynthesis.pending) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(mode().syllables[k]);
  u.rate = 1.4; u.pitch = 0.7; u.volume = 1;
  speechSynthesis.speak(u);
}

export function speak(text) {
  if (!state.voiceOn || !state.soundOn || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.15; u.pitch = 0.65; u.volume = 1;
  speechSynthesis.speak(u);
}

export function cancelSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
