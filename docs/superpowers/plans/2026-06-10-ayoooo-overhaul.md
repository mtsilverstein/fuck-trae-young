# FUCK TRAE YOUNG — AYOOOO Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the chant machine as a cinematic, NY-authentic, module-based static site per `docs/superpowers/specs/2026-06-10-ayoooo-overhaul-design.md` — MetroCard turnstile entry, jumbotron/audio overhaul, MTA ticker, NYC gimmicks, fail-silent worldwide counter.

**Architecture:** Plain ES modules, no build step. `index.html` is a DOM skeleton loading `js/main.js` (type=module); subsystems live in `js/state|audio|chant|fx|nyc|worldwide.js`, all styles in `css/arena.css`. Each task ends with the site fully working; deploy happens once at the end.

**Tech Stack:** Vanilla JS (ES modules), Web Audio API, SpeechSynthesis, CSS animations (transform/opacity only), Vercel static hosting, chrome-devtools MCP for verification.

**Verification harness:** No unit-test framework — verification is scripted browser checks (chrome-devtools MCP: `new_page` → `evaluate_script` → assertions, screenshots, `list_console_messages`). `?test=1` raises rare-event odds and shortens cooldowns. Every task's verify step states exact expected output.

**Module contracts (pinned here; later tasks must match):**

```js
// js/state.js
export const TEST = new URLSearchParams(location.search).has('test');
export const bus = new EventTarget();              // events: 'mode','singularity','enter'
export const MODES = { trae: {...}, wemby: {...} };// words, beatMap, syllables, panelLbl,
                                                   // clock, chip, hint, m100, foot,
                                                   // cameoGlyph, cameoCap, rain, ticker[]
export const state = {
  hype: 0, soundOn: true, voiceOn: true, timbs: false,
  modeName: 'trae', lifetime: 0,
  session: { presses: 0, bars: 0, peakDb: 0, singularities: 0,
             becs: 0, dunks: 0, swipeFails: 0, entry: '' }
};
export function mode()                              // MODES[state.modeName]
export function setMode(name, announce)             // swaps DOM-facing config via bus 'mode'
export function addHype(n)                          // clamp 0..100
export function milestoneText(n)                    // incl. mode-aware 100
export function loadPersisted(), saveLifetime(), saveTimbs(), saveMode()

// js/audio.js
export function ensureAudio()      // idempotent: ctx, master, compressor, crowd bed,
                                   // arena slapback bus, silent keeper, speech warmup
export function audioOn()          // bool: ctx exists
export function tNow()             // ctx.currentTime
export function setCrowd(hype)     // gain+formant brightness targets
export function syllable(t, k)     // vowel-formant roar + stomp (+timbs sub) + claps
export function pressThump()
export function airhorn(), bingBong(), boo(), organCharge(), crinkle()
export function turnstileBeep(ok), clickClack(), pennRumbleAudio(seconds)
export function speak(text), speakSyl(k), cancelSpeech(), setMuted(m)

// js/chant.js
export function startChant(), stopChant(), chantOn()

// js/fx.js
export function wordsRebuild(words), lightWord(beat)
export function toast(msg), rain(n), cameo(), strobe(ms), kick()
export function grainTribute()                       // Starks 1.5s overlay + chyron
export function pigeon(), rat(), pennRumbleVisual()
export function bandFlash(txt, ms), updateBand(txt), updateMeter(hype, dbText)

// js/nyc.js
export function initGate(onEnter)   // onEnter(method: 'swiped'|'swiped twice'|'hopped')
export function initTicker(), refreshTicker()
export function becTick(dtMs)       // called from main loop; manages slide-in/cooldown
export function initTimbs(), initStarks(), openReceipt()

// js/worldwide.js
export function initWorldwide()     // odometer element #worldwide; hides itself on any failure
export function bumpWorldwide()     // +1 local bar; every 10th → fetch up (3s abort)
```

---

### Task 1: Module scaffold — port the current site 1:1

**Files:**
- Create: `css/arena.css`, `js/state.js`, `js/audio.js`, `js/chant.js`, `js/fx.js`, `js/nyc.js`, `js/worldwide.js`, `js/main.js`
- Rewrite: `index.html` (skeleton + `<script type="module" src="js/main.js">`)

- [ ] **Step 1: Port styles.** Move the entire `<style>` block from `index.html` into `css/arena.css` unchanged. `index.html` keeps only `<link rel="stylesheet" href="css/arena.css">`.

- [ ] **Step 2: Port JS into modules per the contract above.** Source functions move verbatim from the current `index.html` script: `MODES/applyMode/milestone logic → state.js` (applyMode becomes setMode + a DOM-apply listener in main.js); `ensureAudio/burst/thump/syllable/boo/airhorn/ding/bingBong/silentWavURI/unlockMobileAudio/speakSyl/speakShout → audio.js`; `startChant/stopChant/schedule/scheduleBar/visualAt → chant.js`; `lightWord/toast/rain/cameo/strobe/bandFlash + emoji-rain CSS hooks → fx.js`; gate/shake/wakeLock/keyboard/buttons/rAF loop → `main.js`. `nyc.js` and `worldwide.js` start as empty modules exporting stubs that no-op. Keep the existing tap-to-enter gate for now (replaced in Task 4). All cross-module access goes through the exported functions only.

- [ ] **Step 3: Verify parity in browser.** chrome-devtools: `new_page file:///C:/Users/reisu/projects/fuck-trae-young/index.html#wemby`, evaluate: gate click → 14 pointerdown mashes → 1100ms wait. Expected: identical to pre-refactor behavior — words FUCK/WEMBY, singularity toast, cameo on screen, `list_console_messages` returns zero messages (module 404s/import errors would appear here).

- [ ] **Step 4: Commit.** `git add -A && git commit -m "refactor: split single file into ES modules, behavior identical"`

### Task 2: Audio overhaul

**Files:**
- Modify: `js/audio.js`, `js/chant.js`

- [ ] **Step 1: Master chain + compressor.** In `ensureAudio()`: `master → compressor(threshold -24, knee 30, ratio 4, attack .003, release .25) → ctx.destination`. All sends keep targeting `master`.

- [ ] **Step 2: Crowd bed rebuild.** Replace single lowpass noise with 3 looped noise sources → bandpasses at 280/750/1200 Hz (Q 1.2) → per-layer gains modulated by independent LFOs (sine OscillatorNodes at 0.07/0.11/0.05 Hz through gain-scalers into the layer gains via `.connect(layerGain.gain)`), summed into `crowdGain`. `setCrowd(hype)` sets `crowdGain` target `0.012 + hype/100*0.26` and shifts each bandpass `frequency` up to +35%.

- [ ] **Step 3: Vowel-formant syllables.** `syllable(t,k)`: noise burst through TWO parallel bandpasses whose center frequencies glide over the burst per syllable vowel — shapes `[[700,1100],[600,1700],[650,1080]]` (UH/AY/UH), glide ±12% via `linearRampToValueAtTime` across the burst; keep existing stomp + claps. Timbs: if `state.timbs`, add 38 Hz sine layer (gain 0.5, 0.22s decay) per stomp.

- [ ] **Step 4: Organ + turnstile + BANG.**

```js
export function organCharge() {           // the real six-note CHARGE! riff
  ensureAudio();
  const NOTES = [196.0, 261.63, 329.63, 392.0, 523.25, 659.26]; // G3 C4 E4 G4 C5 E5
  const t0 = tNow();
  NOTES.forEach((f, i) => organNote(t0 + i * 0.14, f, 0.13));
  organNote(t0 + 6 * 0.14, 783.99, 0.5);  // G5 hold
}
// organNote: square + square*2 (gain .35/.12) → lowpass 2200 → env attack .01 decay to .0001 at +dur
export function turnstileBeep(ok) { /* ok: 2637 Hz 90ms sine; !ok: two 392 Hz 120ms beeps 150ms apart */ }
export function clickClack() { /* two filtered noise ticks (highpass 1800) 70ms apart + 90 Hz thunk */ }
```

Dagger speech becomes: `speak('BANG!')` then `setTimeout(() => speak('BANG!'), 450)`.

Wiring (in main.js / state milestone path): every milestone toast also fires `organCharge()`; the singularity sequence becomes `organCharge()` → 850ms → `airhorn()` → chime, per spec ("fires at milestone moments and before the horn at singularity").

Convention: every module may define a local `const el = id => document.getElementById(id)` helper; it is not a cross-module export.

- [ ] **Step 5: Verify.** Browser: enter, mash to chant, trigger dagger. Expected: zero console messages; evaluate `speechSynthesis`-spy captures two 'BANG!' entries 450ms apart; audible differences not assertable headless — assert node graph built by checking no exceptions during 3 bars.

- [ ] **Step 6: Commit.** `git commit -am "feat(audio): formant crowd, vowel roars, compressor, organ, turnstile kit, double BANG"`

### Task 3: Jumbotron visual overhaul

**Files:**
- Modify: `css/arena.css`, `index.html`, `js/fx.js`, `js/main.js`

- [ ] **Step 1: Arena depth.** Add fixed layers (all `pointer-events:none`): `#bowl` crowd-silhouette rows along the bottom (3 stacked repeating-radial-gradient "head rows", dark navy on black); `#flashes` — 14 absolutely-positioned 3px dots, each on its own `flashTwinkle` keyframe (opacity 0→.9→0, randomized delays/positions via inline style from `fx.flashesStart()`), sparse: each dot fires every 7–15s.

- [ ] **Step 2: Board realism.** `.marquee` → steel bezel: layered borders + inset shadows (chrome look, no gradients beyond 2-stop steel); `#jumbo` gains LED texture overlay `::after` (repeating-linear-gradient 0/90deg, 3px cell, 12% black) and bloom on `.word.lit` via stacked text-shadows (4 layers, no blur filters).

- [ ] **Step 3: Word slam + kick.** `.word.lit` animation becomes 90ms impact: `from{transform:scale(1.18);filter:brightness(1.6)} to{transform:scale(1.07)}`. `fx.kick()` adds class `kick` to `#arena` (keyframe: translate 4px in a random direction via CSS var `--kx/--ky` set inline, 110ms), called per syllable; suppressed under reduced-motion.

- [ ] **Step 4: LED VU meter.** Replace `#fill` bar with `#vu` — 24 `span.seg` segments; `fx.updateMeter(hype, dbText)`: lit count = `round(hype/100*24)`; segments 1-14 green, 15-19 amber, 20-24 red; peak-hold: remember max lit for 900ms, render as single bright tick. Scoreboard panels get beveled '90s chrome (border-style ridge + 2-stop steel).

- [ ] **Step 5: Verify.** Screenshots at 390×844 and 1200×800 mid-chant: bezel, VU segments lit, silhouettes visible, no horizontal overflow (`scrollWidth - clientWidth === 0`), zero console messages.

- [ ] **Step 6: Commit.** `git commit -am "feat(board): arena depth, bezel + LED texture, word slam, segmented VU"`

### Task 4: MetroCard turnstile gate

**Files:**
- Modify: `js/nyc.js` (initGate), `js/main.js` (boot wiring), `css/arena.css`, `index.html`

- [ ] **Step 1: DOM + styles.** `#gate` becomes: black scene; centered turnstile reader (steel housing, embossed "NY OR NOWHERE" via `text-shadow:0 1px 0 #000, 0 -1px 0 #222` same-tone steel text; amber LCD `#lcd` reading `INSERT CARD`); `#metrocard` (gold #F5B700 card, blue MetroCard wordmark, GOOD THRU text) resting below a horizontal swipe track `#slot`. Small print bottom: `EST. 2021`.

- [ ] **Step 2: Swipe physics.**

```js
export function initGate(onEnter) {
  const card = el('metrocard'), slot = el('slot'), lcd = el('lcd');
  let startX = null, startT = 0, fails = 0;
  const W = () => slot.getBoundingClientRect().width;
  card.addEventListener('pointerdown', e => { startX = e.clientX; startT = performance.now(); card.setPointerCapture(e.pointerId); });
  card.addEventListener('pointermove', e => {
    if (startX === null) return;
    const dx = Math.max(0, Math.min(e.clientX - startX, W()));
    card.style.transform = `translateX(${dx}px)`;          // card rides the slot
  });
  card.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX, ms = performance.now() - startT;
    startX = null; card.style.transform = '';
    const ok = dx >= W() * 0.6 && ms >= 150 && ms <= 900;
    ok ? pass(onEnter, 'swiped') : fail();
  });
  card.addEventListener('dblclick', () => pass(onEnter, 'swiped'));  // desktop fallback
  function fail() {
    fails++; state.session.swipeFails = fails;
    lcd.textContent = 'PLEASE SWIPE AGAIN AT THIS TURNSTILE';        // exact copy, no period
    lcd.classList.add('err'); turnstileBeep(false);                  // audio only if ctx exists (it won't pre-unlock: beep no-ops) — see note
    if (fails >= 2) el('hop').hidden = false;                        // "hop the turnstile"
  }
}
```

Note: the failed swipe IS still a gesture — `fail()` calls `ensureAudio()` first so the error beep is audible from the second attempt onward. `pass()` calls `ensureAudio()` synchronously in the gesture (THE unlock — spec insist #1), then `clickClack()`, LCD `GO` (green class), motion permission + wake lock requests, then `enterArena(method)`: 1.6s staged reveal (gate fades, light-sweep div passes, title slams via `.slam` keyframe), `state.session.entry = method === 'swiped' && fails ? 'swiped twice' : method`. `#hop` link click → `pass(onEnter,'hopped')`. Reduced-motion: reveal is a 400ms fade.

- [ ] **Step 3: Verify.** Browser synthetic pointers: (a) slow drag (1200ms) → LCD text exactly `PLEASE SWIPE AGAIN AT THIS TURNSTILE`; (b) second slow drag → `#hop` visible; (c) valid drag (dispatch pointerdown/move/up over 400ms across slot width) → gate gone, arena revealed, chant idle screen present; console clean. Also `dblclick` path enters.

- [ ] **Step 4: Commit.** `git commit -am "feat(nyc): MetroCard turnstile gate — the swipe is the unlock"`

### Task 5: MTA ticker

**Files:**
- Modify: `js/nyc.js`, `js/state.js` (ticker pools per spec §MTA ticker), `css/arena.css`

- [ ] **Step 1: Pools.** Shared pool (exact strings from spec: Spurs service suspended; 1·2·3 delays at 34 St–Penn; LIRR track 19; Crescent cancelled; Section 209 planned work; dollar slice near Penn; chopped cheese; POSTING AND TOASTING / DISHING AND SWISHING / SHAKING AND BAKING) + per-mode carryovers passing Tone Law (no emoji, deadpan). Mode pools live in `MODES[x].ticker`.

- [ ] **Step 2: Render.** Amber dot-matrix look: `#tick` color #FCA311, `text-shadow 0 0 6px rgba(252,163,17,.55)`, dotted background grid, `font-family:Consolas`. `initTicker()` builds doubled-content marquee from shuffled pool; `refreshTicker()` re-shuffles on mode change (bus 'mode'). `pennRumbleVisual()` injects `LIRR NOW DEPARTING TRACK 19` as the next item when the rumble fires.

- [ ] **Step 3: Verify.** Evaluate ticker textContent contains `CRESCENT SERVICE TO ATLANTA — CANCELLED. NO REASON GIVEN.` and `34 ST–PENN STATION`; contains zero `4·5·6`; mode switch swaps mode lines. Console clean.

- [ ] **Step 4: Commit.** `git commit -am "feat(nyc): MTA service-alert ticker, canon Clyde, the Crescent line"`

### Task 6: BEC power-up, Timbs mode, deli receipt

**Files:**
- Modify: `js/nyc.js`, `js/state.js`, `js/audio.js` (crinkle), `css/arena.css`, `index.html` (TIMBS + RECEIPT pills, `#bec`, `#receipt` modal)

- [ ] **Step 1: BEC.** `becTick(dt)` (called each rAF from main): track continuous ms with `state.hype < 20`; threshold 10s (TEST: 1.5s), cooldown 90s (TEST: 5s). Trigger: `#bec` (CSS art: foil rectangle + wax-paper stripe, no sparkle) slides in from right via transform transition; click → `addHype(35)`, `crinkle()` (0.18s highpass-noise crumple ×3 staggered), `toast('SALT PEPPER KETCHUP')`, `state.session.becs++`, slide out; auto-leave after 12s.

- [ ] **Step 2: Timbs.** `#timbsBtn` pill with inline-SVG wheat boot (8-point path, #D2A659 fill). Toggle → `state.timbs`, persist `fty_timbs`, `kick()` amplitude ×1.3 while on (CSS var `--kickmag`).

- [ ] **Step 3: Receipt.** `openReceipt()` renders `#receipt` modal: 280px thermal slip (bg #FAF7F0, monospace 12px, `clip-path` zigzag bottom), lines:

```
FUCK TRAE YOUNG          EST. 2021
MADISON SQVARE GARDEN
--------------------------------
1x ENTRY — {entry, upper}   $0.00
{bars}x FUCKS CHANTED       $0.00
PEAK NOISE {peakDb} DB      $0.00
{n}x SINGULARITY            $0.00
{n}x BACON EGG AND CHEESE   $0.00
{n}x THE DUNK, WITNESSED    $0.00
--------------------------------
TOTAL                       $0.00
CASH ONLY / ATM INSIDE
CUSTOMER OF THE MONTH
NO SUBSTITUTIONS. FUCK TRAE YOUNG.
```

Zero-count lines are omitted except FUCKS CHANTED; `1x SINGULARITY — $0.00` format kept verbatim when count is 1. Tap anywhere dismisses.

- [ ] **Step 4: Verify (?test=1).** Force low hype wait 2s → BEC appears; click → hype +35, toast text `SALT PEPPER KETCHUP`; TIMBS toggles and persists across reload; receipt shows correct session lines and dismisses. Console clean.

- [ ] **Step 5: Commit.** `git commit -am "feat(nyc): BEC power-up, Timbs mode, deli receipt"`

### Task 7: Pigeon, rat, Penn rumble, Starks Dunk

**Files:**
- Modify: `js/fx.js`, `js/nyc.js` (initStarks), `js/main.js` (lotteries + rumble scheduler), `css/arena.css`

- [ ] **Step 1: Animals.** `pigeon()`: span walker (CSS pigeon: layered radial-gradient body + head-bob keyframe) crossing `#jumbo` top edge L→R over 9s, transform-only. `rat()`: bottom viewport edge, drags 🍕-shaped CSS wedge, 7s. Lottery in main loop: per-minute roll p=0.08/0.03 (TEST: 0.9/0.9). Animal budget enforced: never both at once.

- [ ] **Step 2: Penn rumble.** Scheduler: next rumble = now + 180–300s (TEST: 15s). Fire: `pennRumbleAudio(4)` (28 Hz sine swell, gain 0→.18→0) + `#arena` 4s `rumble` keyframe (translateY ±1px; skipped reduced-motion) + ticker injection.

- [ ] **Step 3: Starks detector.**

```js
export function initStarks() {
  let y0 = null, t0 = 0, cooldownUntil = 0;
  const COOLDOWN = TEST ? 3000 : 60000;
  addEventListener('pointerdown', e => { y0 = e.clientY; t0 = performance.now(); }, true);
  addEventListener('pointerup', e => {
    if (y0 === null) return;
    const dy = y0 - e.clientY, ms = performance.now() - t0; y0 = null;
    const tall = dy >= innerHeight * 0.35, fast = ms <= 400, due = performance.now() >= cooldownUntil;
    if (tall && fast && due) { cooldownUntil = performance.now() + COOLDOWN; dunk(); }
  }, true);
}
// dunk(): state.session.dunks++; fx.grainTribute() — fullscreen overlay: grayscale+contrast
// via SVG feTurbulence grain (prebuilt <filter id="grain">), chyron bottom-left
// "MAY 25, 1993" (Impact, white, letterboxed bars top+bottom), 1.5s; audio: organCharge()
// then airhorn(); crowd surge via setCrowd(100) momentary. Reduced-motion: chyron +
// sound only, no grain overlay.
```

- [ ] **Step 4: Verify (?test=1).** Synthetic fast up-swipe (dy 60% viewport, 250ms) → chyron `MAY 25, 1993` appears, `session.dunks` incremented (assert via receipt open). Slow drag (1200ms) and short flick (10% height) → nothing. Pigeon and rat each appear within 90s at test odds — screenshot each. Rumble fires at 15s — ticker shows TRACK 19. Console clean.

- [ ] **Step 5: Commit.** `git commit -am "feat(nyc): pigeon, pizza rat, Penn rumble, The Dunk — May 25 1993"`

### Task 8: Worldwide counter

**Files:**
- Modify: `js/worldwide.js`, `js/chant.js` (bump per bar), `index.html` (#worldwide odometer in scoreboard mid), `css/arena.css`

- [ ] **Step 1: Implement fail-silent client.**

```js
const API = 'https://api.counterapi.dev/v1/fuck-trae-young/chants';
let dead = false, shown = 0, localBars = 0;
export function initWorldwide() { poll(); setInterval(poll, 30000); }
export function bumpWorldwide() {
  if (dead || ++localBars % 10) return;
  hit(API + '/up');
}
async function hit(url) {
  try {
    const c = new AbortController(); setTimeout(() => c.abort(), 3000);
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw 0;
    const j = await r.json();
    render(j.count * 10);                       // each unit = 10 chants
  } catch { kill(); }
}
function poll() { if (!dead) hit(API); }
function kill() { dead = true; el('worldwide').closest('.panel-ww')?.remove(); }
// render(): odometer digits, label "WORLDWIDE FUCKS CHANTED"
```

- [ ] **Step 2: Verify.** Local file:// — fetch may fail: widget must remove itself with zero console errors (wrap everything; no unhandled rejections). If network allowed and API live: count renders and increments after 10 bars. BOTH outcomes are a pass; what fails the task is any thrown error or layout shift.

- [ ] **Step 3: Commit.** `git commit -am "feat: worldwide fucks chanted odometer, fail-silent"`

### Task 9: Tone-law copy pass, reduced-motion, perf audit

**Files:**
- Modify: `js/state.js` (all copy), `js/fx.js`, `css/arena.css`, `README.md`

- [ ] **Step 1: Copy audit.** Strip every emoji from toast/milestone/hint/button strings (board props exempt: rain glyphs, cameo glyph, BEC art). Buttons become text: `BING BONG`, `DAGGER`, `CHANT`, `RECEIPT`, `TIMBS`. Milestone/toast text per Tone Law (deadpan, specific). Singularity toast: `121 DB — BING BONG SINGULARITY`. Welcome toast: `you know the words.` → keep but lowercase-deadpan check. README rewritten to match reality (modules, turnstile, no "zero files" claim — becomes "no build step, no dependencies, no respect").

- [ ] **Step 2: Reduced-motion.** `@media (prefers-reduced-motion: reduce)`: disable `.kick/.shaking/#strobe.go/grain/rumble/slam` (CSS) + JS guards in `kick()/strobe()/grainTribute()` via `matchMedia`.

- [ ] **Step 3: Perf audit.** Sum payload (`Get-ChildItem -Recurse | Measure-Object Length -Sum` on html/css/js) — expected < 100 KB; confirm animations are transform/opacity only (grep for `left:`/`top:` in keyframes — allowed only on static positioning); rAF loop unchanged single instance.

- [ ] **Step 4: Verify + commit.** Full-session browser run, console clean. `git commit -am "chore: tone-law copy pass, reduced-motion, perf audit"`

### Task 10: Full verification, deploy, push

- [ ] **Step 1: Run the spec's 10-point verification** (spec §Verification) at 390×844 and 1200×800, `?test=1` for rare events, plus a no-test-param sanity load. Screenshots: turnstile, error LCD, arena mid-chant, singularity, receipt, dunk chyron, pigeon.
- [ ] **Step 2: Deploy.** `vercel --cwd C:\Users\reisu\projects\fuck-trae-young deploy --prod --yes` → expect `Aliased: https://fuck-trae-young.vercel.app`, READY.
- [ ] **Step 3: Prod smoke.** Load prod URL in browser, swipe in, one chant bar, console clean, screenshot.
- [ ] **Step 4: Push.** `git push` → main up to date on GitHub.
