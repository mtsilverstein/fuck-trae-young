# FUCK TRAE YOUNG

The Garden's three favorite words. Est. May 23, 2021 — 0.9 on the clock,
he said it was quiet, he took a bow. It has not been quiet since.

**Live: https://fuck-trae-young.vercel.app**
**Finals edition: https://fuck-trae-young.vercel.app/#wemby**

No build step. No dependencies. No respect.

## Entry

Swipe the MetroCard. Too slow and you get the message every New Yorker
has eaten: PLEASE SWIPE AGAIN AT THIS TURNSTILE. Fail twice and you may
hop the turnstile. The swipe is also the audio unlock — the Garden is
loud from the first step inside.

NY OR NOWHERE is etched on the housing. The card plays it straight.

## Inside

- Mash CHANT (spacebar works) or shake the phone like you're in Section 209
- The chant is synthesized: formant crowd, vowel roars, floor-resonance
  stomps, arena slapback — one voice per beat, locked to 138 BPM
- BING BONG button: the two sacred notes
- DAGGER button: the singularity, every time. The robot yells BANG! twice.
- TIMBS mode: sub-bass stomps, heavier kick. Persisted, obviously.
- The ticker runs MTA service alerts. All lore is real: the 1·2·3 at
  34 St–Penn, the Crescent to Atlanta, POSTING AND TOASTING.
- Penn Station rumbles underneath every few minutes. LIRR departing Track 19.
- Let the meter sit cold for ten seconds and the deli guy sends over a
  bacon egg and cheese. SALT PEPPER KETCHUP.
- Swipe up, hard, like you mean it: MAY 25, 1993.
- A pigeon may cross the board. It will not acknowledge you. Rarer
  still, a rat with a slice. The animal budget is two. There is no mascot.
  That IS the bit.
- RECEIPT prints your session on thermal paper. Everything costs $0.00.
  CASH ONLY / ATM INSIDE. NO SUBSTITUTIONS.
- WORLDWIDE FUCKS CHANTED counts everyone, everywhere, today and forever.
  If the counter dies, the site shrugs and keeps chanting.

## Modes

VS: TRAE / VS: WEMBY swaps the enemy across the whole building — words,
cadence (FUCK / WEM / BEE), ticker, scoreboard, cameo. Hash links
`#trae` and `#wemby` boot straight into it. Your pick is remembered.

## Architecture

Plain ES modules on static hosting. `js/state.js` owns the config and
the meter, `js/audio.js` synthesizes the building, `js/chant.js` keeps
the beat, `js/fx.js` runs the lights and the wildlife, `js/nyc.js` is
the borough layer, `js/worldwide.js` is one number behind one Vercel
function (`api/chants.js`). Zero external assets. Under 100 KB.

Docs: `docs/superpowers/specs/` and `docs/superpowers/plans/`.
