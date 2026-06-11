// js/worldwide.js — one number: the world's fucks, chanted. If the counter
// service dies, the widget disappears and the building keeps chanting.
'use strict';

const API = '/api/chants'; // same-origin Vercel function proxying the counter
const el = id => document.getElementById(id);

let dead = false, localBars = 0, started = false;

export function initWorldwide() {
  if (started) return;
  started = true;
  // the function only exists on the deployment; local http sessions
  // skip the widget entirely and keep their consoles spotless
  if (location.protocol !== 'https:') { kill(); return; }
  poll();
  setInterval(poll, 30000);
}

export function bumpWorldwide() {
  if (dead) return;
  if (++localBars % 10) return;
  hit(API + '?up=1'); // one unit per ten bars; render() multiplies back
}

function poll() { if (!dead) hit(API); }

async function hit(url) {
  try {
    const c = new AbortController();
    setTimeout(() => c.abort(), 3000);
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('counter http ' + r.status);
    const j = await r.json();
    const count = j && (j.count ?? j.value);
    if (typeof count !== 'number') throw new Error('counter shape');
    render(count * 10);
  } catch (e) {
    kill();
  }
}

function render(n) {
  const host = el('worldwide');
  if (!host) return;
  host.hidden = false;
  host.querySelector('.ww-n').textContent = n.toLocaleString();
}

function kill() {
  dead = true;
  const host = el('worldwide');
  if (host) host.remove();
}
