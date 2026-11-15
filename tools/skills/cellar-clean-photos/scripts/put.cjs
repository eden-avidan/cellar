// node put.cjs <wineId> <candidateFile>
// Uploads the standardized photo and makes it the wine's FIRST photo, replacing any earlier clean
// (web) photo and deleting that one's files. The owner's own photos are kept, in order.
// Writes only if the wine hasn't changed since it was read (the app's edits are never overwritten).
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { listWines, patchWine, uploadJpeg, deleteObject, UID } = require('./fb.cjs');
const { standardize, FORMAT } = require('./standardize.cjs');

(async () => {
  const [wineId, candFile] = process.argv.slice(2);
  if (!wineId || !candFile) throw new Error('usage: node put.cjs <wineId> <candidateFile>');
  const src = JSON.parse(fs.readFileSync(`${candFile}.src`, 'utf8'));
  if (!src.page) throw new Error(`${candFile}.src has no "page": set it to the product page URL first`);
  const wine = (await listWines()).find((w) => w.id === wineId);
  if (!wine) throw new Error('wine not found');

  // Standardize again from the original image (not the preview), so quality is the best available.
  const res = await fetch(src.image, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`image download ${res.status}`);
  const { full, thumb } = await standardize(Buffer.from(await res.arrayBuffer()));

  const base = `users/${UID}/wines/${wineId}/clean-${Date.now()}`;
  const url = await uploadJpeg(`${base}.jpg`, full, randomUUID());
  const thumbUrl = await uploadJpeg(`${base}-thumb.jpg`, thumb, randomUUID());
  const photo = { path: `${base}.jpg`, url, thumbPath: `${base}-thumb.jpg`, thumbUrl, source: src.page, cleanFormat: FORMAT };

  const old = (wine.photos ?? []).filter((p) => p.source);
  try {
    await patchWine(wineId, { photos: [photo, ...(wine.photos ?? []).filter((p) => !p.source)] }, wine.updateTime);
  } catch (e) {
    await Promise.allSettled([deleteObject(photo.path), deleteObject(photo.thumbPath)]); // don't leave orphans
    throw new Error(`wine changed meanwhile or write refused (${e.message}); run status.cjs again and retry`);
  }
  await Promise.allSettled(old.flatMap((p) => [deleteObject(p.path), deleteObject(p.thumbPath)]));
  console.log(`OK  ${[wine.producer, wine.wineName, wine.vintage].filter(Boolean).join(' ')}  <-  ${src.page}  (${full.length} bytes${old.length ? `, replaced ${old.length} older clean photo` : ''})`);
})().catch((e) => {
  console.error('ERR', e.status ?? '', e.message);
  process.exit(1);
});
