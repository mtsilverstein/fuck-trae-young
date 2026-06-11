// js/state.js — modes, milestones, persistence. The single source of truth.
'use strict';

export const TEST = new URLSearchParams(location.search).has('test');
export const bus = new EventTarget();

export const BPM = 138, BEAT = 60 / BPM, BAR = BEAT * 4;

// The board speaks in the agency's voice. Deadpan, institutional, real lore only.
export const SHARED_TICKER = [
  'ALL SPURS SERVICE SUSPENDED INDEFINITELY',
  'DELAYS ON 1·2·3 DUE TO CELEBRATION AT 34 ST–PENN STATION',
  'LIRR NOW DEPARTING TRACK 19',
  'CRESCENT SERVICE TO ATLANTA — CANCELLED. NO REASON GIVEN.',
  'PLANNED WORK: SECTION 209 STANDING THROUGH JULY',
  'DOLLAR SLICE HOLDING AT $1.50 NEAR PENN STATION. INFLATION FEARS OVERSTATED.',
  'CHOPPED CHEESE IS NOT A CHEESESTEAK.',
  'POSTING AND TOASTING',
  'DISHING AND SWISHING',
  'SHAKING AND BAKING',
  'BILLY JOEL PAUSES PIANO MAN, CONDUCTS THE CROWD INSTEAD',
  'WESTMINSTER DOG SHOW BREACHED — THE DOGS KNOW THE WORDS',
  'CHANT ERUPTS AT RANGERS GAME — NO BASKETBALL WAS SCHEDULED',
  'EVERY MSG EVENT NOW LEGALLY REQUIRED TO INCLUDE THE CHANT',
  'BING BONG'
];

// Same engine, different enemy. The chant is always three beats;
// beatMap says which word lights up on each beat (WEM-BY = two hits).
export const MODES = {
  trae: {
    words: ['FUCK', 'TRAE', 'YOUNG'],
    beatMap: [0, 1, 2],
    panelLbl: 'TRAE — FUCKS GIVEN',
    syllables: ['FUCK', 'TRAE', 'YOUNG'],
    cameoGlyph: '🤫',
    cameoCap: 'HE’S BOWING — BOO LOUDER',
    rain: ['🖕', '🖕', '🖕', '🖕', '🏀', '🧡', '💙'],
    clock: '00:00.9',
    chip: 'EST. MAY 23, 2021',
    hint: "MASH THE BUTTON · SHAKE THE PHONE · THE METER DECAYS LIKE TRAE'S DEFENSE",
    m100: 'Trae heard you. He is cupping his ear. DO NOT let him.',
    ticker: [
      'TRAE YOUNG REPORTS IT IS QUIET IN HERE — IT IS NOT QUIET IN HERE',
      'SECTION 209 HAS NOT SAT DOWN SINCE MAY 2021',
      'SERVICE ADVISORY: THE FLOATER WAS 0.9 SECONDS. THE GRUDGE IS PERMANENT.'
    ],
    foot: 'A Garden tradition since May 23, 2021 — he hit the floater with 0.9 on the clock, said it was quiet, and took a bow.<br>The Garden has not been quiet since. BING BONG.'
  },
  wemby: {
    words: ['FUCK', 'WEMBY'],
    beatMap: [0, 1, 1],
    panelLbl: 'WEMBY — FUCKS GIVEN',
    syllables: ['FUCK', 'WEM', 'BEE'],
    cameoGlyph: '👽',
    cameoCap: 'THE ALIEN IS SIGNALING THE MOTHERSHIP — BOO LOUDER',
    rain: ['🖕', '🖕', '🖕', '🖕', '🏀', '🛸', '🧡', '💙'],
    clock: '7:04',
    chip: 'FINALS · JUNE 2026',
    hint: 'MASH THE BUTTON · SHAKE THE PHONE · 7’4” AND HE STILL CAN’T BLOCK A CHANT',
    m100: 'Wemby heard you. He is signaling the mothership. DO NOT let him.',
    ticker: [
      'UFO OVER 33RD & 7TH DENIED LANDING BY SECTION 209',
      'SCOUTING REPORT: BLOCKS EVERYTHING EXCEPT OUT THE NOISE',
      'HE HAS NEVER HEARD 20,000 PEOPLE CONJUGATE FUCK IN UNISON',
      'TONY PARKER DID NOT WARN HIM ABOUT THIS',
      'THE GARDEN HAS NO CEILING — STILL NOT ENOUGH ROOM FOR HIM',
      'FRENCH FOR BING BONG: BING BONG'
    ],
    foot: 'Finals edition — new enemy, same energy. The chant adapts. The Garden does not.<br>BING BONG.'
  }
};

export const MILESTONES = {
  10:  'Spike Lee is on his feet.',
  11:  'Number 11 sees you. The Captain nods.',
  25:  'A Rangers crowd just joined in. There is no basketball today.',
  50:  'Penn Station: every platform, same three words.',
  200: "Billy Joel just modulated 'Piano Man' into the chant's key.",
  365: 'The Westminster Dog Show has been breached. The dogs know the words.',
  500: 'Your banner is going up in the rafters. It just says the chant.'
};

export const state = {
  hype: 0,
  soundOn: true,
  voiceOn: true,
  timbs: false,
  modeName: 'trae',
  lifetime: 0,
  session: {
    presses: 0, bars: 0, peakDb: 0, singularities: 0,
    becs: 0, dunks: 0, swipeFails: 0, entry: ''
  }
};

export function mode() { return MODES[state.modeName]; }

export function addHype(n) {
  state.hype = Math.max(0, Math.min(100, state.hype + n));
  return state.hype;
}

export function milestoneText(n) {
  return n === 100 ? mode().m100 : MILESTONES[n];
}

export function setMode(name, announce) {
  if (!MODES[name]) return;
  state.modeName = name;
  try { localStorage.setItem('fty_mode', name); } catch (e) {}
  bus.dispatchEvent(new CustomEvent('mode', { detail: { name, announce } }));
}

export function loadPersisted() {
  try {
    state.lifetime = parseInt(localStorage.getItem('fty_chants') || '0', 10) || 0;
    const m = localStorage.getItem('fty_mode');
    if (m && MODES[m]) state.modeName = m;
    state.timbs = localStorage.getItem('fty_timbs') === '1';
  } catch (e) {}
  const h = location.hash.replace('#', '');
  if (MODES[h]) state.modeName = h;
}

export function saveLifetime() {
  try { localStorage.setItem('fty_chants', String(state.lifetime)); } catch (e) {}
}

export function saveTimbs() {
  try { localStorage.setItem('fty_timbs', state.timbs ? '1' : '0'); } catch (e) {}
}
