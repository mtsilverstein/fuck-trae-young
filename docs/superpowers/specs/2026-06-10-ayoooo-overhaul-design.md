# FUCK TRAE YOUNG — The AYOOOO Overhaul (Design Spec)

Date: 2026-06-10
Authority: Max, via explicitly-authorized proxy agents (decision memo, then design approval with redlines). One-shot build: all phases ship in this run.

## Goal

Take the existing single-file MSG chant machine to cinematic, NY-authentic quality. The user's brief: "less corny... this isn't social media. This is a comical gimmick. but NY centric... fuck trae young (always), NY or Nowhere, fuck wemby, fuck the spurs, bacon egg and cheese, timberlands... one shot gta VI vibes." Success bar: people say AYOOOOO; Spike Lee and John Starks proud; Kalshi's BingBot looks like a Nokia.

## Binding decisions (proxy rulings)

- Brand stays **FUCK TRAE YOUNG**, raw, no wrapper. Only mark: small **EST. 2021**. No "presents," no sponsors.
- Splash = **MetroCard turnstile gate**. "NY OR NOWHERE" is etched on the **turnstile housing**; the MetroCard itself plays it straight (gold/blue, GOOD THRU stays GOOD THRU).
- Approach: **ES modules, no build step.** No bundler, no framework. Still plain static files on Vercel.
- Redline: subway references use the **1·2·3 at 34 St–Penn Station** — never the 4·5·6 (Lexington/East Side).
- Insists: the swipe gesture IS the audio unlock (no separate sound prompt, ever); ticker includes "CRESCENT SERVICE TO ATLANTA — CANCELLED. NO REASON GIVEN."; receipt includes "1x SINGULARITY — $0.00" verbatim; Starks swipe threshold strict enough that a sloppy scroll never triggers it.
- Share cards: **dead**. No social features of any kind.
- Worldwide counter: **in**, experimental — one number, smallest possible backend, site shrugs if it dies.
- Animal budget: **two** (pigeon, rat). No mascots ever — the Knicks famously have none; that IS the bit.
- "Fugheddaboudit": **vetoed** (Times Square t-shirt language).

## Tone Law (applies to every string and pixel)

1. Deadpan beats hype. Copy that announces it's funny gets cut.
2. Not social media. No hashtags, no share buttons, no "tag us."
3. Specific beats general — real train lines, real dates, real prices (the fugheddaboudit test).
4. The profanity is the name, not the seasoning. Never censored, never multiplied.
5. Emoji are stage props on the jumbotron (rain, cameo), never punctuation in copy. Zero emoji in sentences.
6. No corporate framing: no "presents," "powered by," fake disclaimers, or euphemisms.
7. Banned words: fam, vibes, lit, no cap, era. Banned looks: AI-slop gradients, glassmorphism, lens flares. Palette: '90s MSG jumbotron + bodega signage (Knicks blue #006BB6, orange #F58426, white, amber LED, black).
8. Lore must be real (May 23 2021, May 25 1993, Penn under the Garden, the Crescent). Knicks fans fact-check.

## Architecture

```
index.html        DOM skeleton + module entry
css/arena.css     all styles
js/state.js       hype meter, milestones, persistence, mode configs (Trae/Wemby)
js/audio.js       engine: crowd bed, formant roars, stomps, organ, horn, chime, voice, turnstile, compressor
js/chant.js       beat scheduler (138 BPM, 3-beat bar), word/voice/haptic sync
js/fx.js          strobe, emoji rain, cameo, camera flashes, screen kick, grain, pigeon, rat, Penn rumble
js/nyc.js         MetroCard gate, MTA ticker, BEC power-up, Timbs mode, deli receipt, Starks Dunk
js/worldwide.js   global counter (fail-silent)
js/main.js        boot, rAF loop, wiring
```

Plain `<script type="module">`. Deploy pipeline unchanged (vercel deploy --prod). A `?test=1` query param raises rare-event probabilities and shortens cooldowns for verification only.

## Feature specs

### Entry — MetroCard turnstile (the cinematic open)
Black screen, faint Penn rumble loop (silent until first gesture — visual-only before unlock). Turnstile reader slot with amber LCD reading "INSERT CARD"; a MetroCard sits ready. User drags the card through the slot (pointer events; desktop = click-drag; double-click = instant valid swipe fallback). Swipe completing the slot distance in 150–900ms = valid; outside the window → amber LCD: "PLEASE SWIPE AGAIN AT THIS TURNSTILE." plus error beep. Valid → LCD "GO" in green, mechanical click-clack, the gesture resumes/creates AudioContext + speech warm-up + motion permission + wake lock. Then: arena light sweep (staged reveals, ~1.6s total), crowd murmur fades in, title slams: FUCK TRAE YOUNG (or FUCK WEMBY per mode), EST. 2021 beneath. After 2 failed swipes, a quiet underlined text link appears: "hop the turnstile" (instant entry; it still counts as the unlock gesture). Reduced-motion: sweep becomes a fade.

### Jumbotron overhaul
Layered arena depth: crowd-silhouette rows at the bottom of the viewport (dark, parallax-still), random camera flashes twinkling in the dark upper bowl (CSS keyframed dots, sparse). Board gets a bezel (steel chrome borders), LED pixel-grid texture overlay, and bloom on lit words (layered text-shadow only — no filter:blur on text for perf). Chant words slam: lit word scales in with a 90ms impact curve + 4px directional screen-kick matching the stomp. dB meter becomes a segmented LED VU strip (24 segments, green→amber→red, peak-hold tick). Scoreboard chrome styled like the '90s boards: beveled panels, condensed numerals.

### Audio overhaul
- Crowd bed: 3 looped noise layers through bandpass formants (~280 Hz, ~750 Hz, ~1.2 kHz) with independent slow LFO gain swells; reads as humans, not static. Gain/brightness track hype.
- Syllable roars: per-syllable vowel formant sweeps (UH/AY/UH shapes via two parallel bandpasses glided over the burst).
- Stomps: 50 Hz sine thump + 35 Hz resonant tail; Timbs mode adds a second sub layer and +30% kick.
- CHARGE! organ: square-wave organ stack playing the real six-note riff (G3 C4 E4 G4 C5 E5 → G5 hold), fires at milestone moments and before the horn at singularity.
- Dagger: robot voice yells "BANG!" twice (Breen cadence — second BANG ~450ms after the first), over the horn.
- Turnstile: 2.6 kHz reader beep (error = double low beep), mechanical click-clack on entry.
- Master DynamicsCompressor (threshold -24 dB, ratio 4:1) so phone speakers slap without clipping.

### MTA ticker
Restyled as an amber dot-matrix service-alert strip (subway countdown clock look). Rotating pool, deadpan institutional voice. Pool includes (all caps on the board):
- "ALL SPURS SERVICE SUSPENDED INDEFINITELY"
- "DELAYS ON 1·2·3 DUE TO CELEBRATION AT 34 ST–PENN STATION"
- "LIRR NOW DEPARTING TRACK 19" (also fires synced with each Penn rumble)
- "CRESCENT SERVICE TO ATLANTA — CANCELLED. NO REASON GIVEN."
- "PLANNED WORK: SECTION 209 STANDING THROUGH JULY"
- "DOLLAR SLICE STILL $1.50 AT 33RD AND 7TH. INFLATION FEARS OVERSTATED."
- "CHOPPED CHEESE IS NOT A CHEESESTEAK. AN MTA PSA."
- Clyde-isms interleaved: "STOMPING AND CHOMPING", "WISHING AND SWISHING", "DISHING AND SWISHING"
- Carried-over lore lines that pass the Tone Law (Rangers game eruption, Billy Joel, "IT IS NOT QUIET IN HERE", Westminster dogs, BING BONG). Mode-specific lines stay mode-specific.

### NYC gimmicks
- **BEC power-up**: when hype has been under 20 for 10+ continuous seconds (90s cooldown), a foil-wrapped bacon-egg-and-cheese (CSS art: foil + wax paper peek) slides in from the right edge, no sparkle, no bounce. Tap to eat: +35 hype, paper-crinkle sound, toast: "SALT PEPPER KETCHUP". It leaves on its own after 12s, unbothered.
- **TIMBS mode**: pill toggle with a wheat-boot glyph (CSS/inline SVG). On: stomp sub-layer + heavier screen kick. Persisted.
- **Pigeon**: low probability per minute (~0.08; guaranteed reachable in ?test=1), struts left-to-right across the top of the board, does not acknowledge anything, leaves. No tooltip, no caption.
- **Pizza rat**: rarer (~0.03/min), bottom edge, drags a slice. Silent. No caption.
- **Starks Dunk**: hard upward swipe on the arena (≥35% of viewport height upward within 400ms, net upward velocity — tuned so scroll-ish gestures never fire; 60s cooldown). Triggers 1.5s tribute: grain + grayscale overlay (SVG feTurbulence, skipped under reduced-motion), chyron bottom-left "MAY 25, 1993", crowd eruption + horn. Abstract treatment only — no clip-art dunk.
- **Deli receipt**: RECEIPT pill prints a thermal slip (modal, monospace, paper texture, ragged bottom edge) itemizing the session: entry method ("1x ENTRY — SWIPED TWICE"), fucks chanted, peak dB, singularities ("1x SINGULARITY — $0.00" verbatim), BECs consumed, dunks witnessed — every line $0.00, then "TOTAL: $0.00", "CASH ONLY / ATM INSIDE", "CUSTOMER OF THE MONTH", footer: "NO SUBSTITUTIONS. FUCK TRAE YOUNG." Tap anywhere to dismiss. No share affordances.
- **Penn rumble**: every 3–5 min, 4s low rumble (sub oscillator swell) + slight screen shudder + the LIRR ticker line. The Garden sits on top of Penn. Real lore.

### Worldwide counter (experimental, fail-silent)
Scoreboard center gets a small odometer: "WORLDWIDE FUCKS CHANTED" (no "today" — the backend has no daily reset; don't fake one). Backend: zero-auth public counter API (counterapi.dev v1). One `up` call per 10 local chant bars; displayed value = API count × 10. Poll every 30s. 3s AbortController timeout. Any error, ever: hide the widget for the session and never block anything. No accounts, no leaderboard, no map.

### Modes and copy pass
Trae/Wemby system unchanged (incl. #wemby hash link and persisted preference). Every existing string re-audited against the Tone Law: emoji stripped from copy (toasts, hints, milestones — board props like the rain and cameo glyphs stay), corporate-ish phrasing removed, specificity raised. Milestones keep their numbers (10 Spike, 11 the Captain, 100 ear-cup, 200 Billy Joel, 365 Westminster, 500 banner).

### Guardrails
- `prefers-reduced-motion`: no strobe, no screen kick/shake, no grain; sweeps become fades.
- Animations are transform/opacity only; rAF loop untouched by feature additions.
- Total payload < 100 KB; zero external requests except the counter API; zero external fonts/images/audio.
- Console-clean on load and through a full session; identical behavior at 390px.

## Verification plan

Chrome DevTools MCP at 390×844 and desktop:
1. Fresh load: turnstile renders, slow swipe shows exact "PLEASE SWIPE AGAIN AT THIS TURNSTILE." copy, valid swipe enters with reveal; "hop the turnstile" appears after 2 failures.
2. Chant run: mash, words slam, VU meter moves, milestones fire.
3. Dagger: BANG! BANG! enqueued to speech, horn + strobe + cameo + rain.
4. Starks: synthetic hard up-swipe fires the tribute; a slow drag does not.
5. BEC: with ?test=1 shortened timer, appears, tap eats it, +35 hype.
6. Pigeon/rat: ?test=1 raised odds, both walk.
7. Receipt: opens, itemized lines correct, dismisses.
8. Counter: widget shows or hides cleanly (network may be blocked in test browser — hide path is also a pass).
9. Console: zero errors/warnings both viewports.
10. Deploy to prod, smoke prod URL, push to GitHub.

## Out of scope

Share buttons/cards, hashtags, accounts, leaderboards, maps, mascots, "fugheddaboudit," any backend beyond the counter API.
