// node status.cjs <workdir>
// Lists every wine and whether its first photo is a clean photo in the standard format, and saves the
// owner's own label photo of each wine that needs work to <workdir>/own/<wineId>.jpg for comparison.
const fs = require('node:fs');
const { listWines, sharp } = require('./fb.cjs');
const { FORMAT } = require('./standardize.cjs');

(async () => {
  const work = process.argv[2];
  if (!work) throw new Error('usage: node status.cjs <workdir>');
  fs.mkdirSync(`${work}/own`, { recursive: true });
  const todo = [];
  for (const w of await listWines()) {
    const first = (w.photos ?? [])[0];
    const own = (w.photos ?? []).find((p) => !p.source);
    const state = !first ? 'no photos' : !first.source ? 'needs clean photo' : first.cleanFormat !== FORMAT ? 'clean photo in old format' : 'ok';
    const name = [w.producer, w.wineName, w.vintage].filter(Boolean).join(' ');
    console.log(`${state === 'ok' ? '  ok ' : 'TODO '} ${w.id}  ${name}  [${w.list}]  — ${state}${first?.source ? ` (from ${first.source})` : ''}`);
    if (state === 'ok') continue;
    todo.push({ id: w.id, name, region: [w.region, w.country].filter(Boolean).join(', '), type: w.wineType, list: w.list, currentSource: first?.source ?? null, hasOwnPhoto: Boolean(own) });
    if (own) {
      const res = await fetch(own.url);
      if (res.ok) {
        await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 900, height: 900, fit: 'inside' }).jpeg({ quality: 82 }).toFile(`${work}/own/${w.id}.jpg`);
      }
    }
  }
  fs.writeFileSync(`${work}/todo.json`, JSON.stringify(todo, null, 2));
  console.log(`\n${todo.length} wine(s) to do. Details: ${work}/todo.json; label photos: ${work}/own/`);
})().catch((e) => {
  console.error('ERR', e.status ?? '', e.message);
  process.exit(1);
});
