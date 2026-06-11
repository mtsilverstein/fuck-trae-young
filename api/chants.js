// Same-origin proxy for the worldwide chant counter. The browser never
// talks to the counter service directly (no CORS headers upstream), and
// if anything here fails the widget on the page just removes itself.
const UPSTREAM = 'https://api.counterapi.dev/v1/fuck-trae-young/chants';

export default async function handler(req, res) {
  try {
    const up = req.query && req.query.up === '1';
    const r = await fetch(UPSTREAM + (up ? '/up' : ''));
    if (!r.ok) throw new Error('upstream ' + r.status);
    const j = await r.json();
    if (typeof j.count !== 'number') throw new Error('upstream shape');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ count: j.count });
  } catch (e) {
    res.status(502).json({ error: 'counter unavailable' });
  }
}
