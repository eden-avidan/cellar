// node verify.cjs
// Checks every wine's first photo: loads, 1080x1080, thumbnail 480x480, standard format tag.
// Also deletes clean-* files in Storage that no wine references (left over from failed attempts).
const { listWines, listObjects, deleteObject, sharp, UID } = require('./fb.cjs');
const { SIZE, THUMB, FORMAT } = require('./standardize.cjs');

const dims = async (url) => {
  const r = await fetch(url);
  if (!r.ok) return `HTTP ${r.status}`;
  const m = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
  return `${m.width}x${m.height}`;
};

(async () => {
  const wines = await listWines();
  let bad = 0;
  for (const w of wines) {
    const name = [w.producer, w.wineName, w.vintage].filter(Boolean).join(' ');
    const first = (w.photos ?? [])[0];
    if (!first?.source) {
      bad++;
      console.log(`TODO  ${name}: no clean first photo`);
      continue;
    }
    const [full, thumb] = await Promise.all([dims(first.url), dims(first.thumbUrl)]);
    const ok = full === `${SIZE}x${SIZE}` && thumb === `${THUMB}x${THUMB}` && first.cleanFormat === FORMAT;
    if (!ok) bad++;
    console.log(`${ok ? '  ok' : 'FAIL'}  ${name}: photo ${full}, thumb ${thumb}, format ${first.cleanFormat ?? '-'}, ${(w.photos ?? []).length} photo(s)`);
  }
  const used = new Set(wines.flatMap((w) => (w.photos ?? []).flatMap((p) => [p.path, p.thumbPath])));
  const orphans = (await listObjects(`users/${UID}/wines/`)).filter((n) => /\/clean-[^/]+\.jpg$/.test(n) && !used.has(n));
  for (const n of orphans) await deleteObject(n);
  console.log(`\n${wines.length - bad}/${wines.length} wines ok; ${orphans.length} orphaned clean file(s) deleted`);
  process.exit(bad ? 2 : 0);
})().catch((e) => {
  console.error('ERR', e.status ?? '', e.message);
  process.exit(1);
});
