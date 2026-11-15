// node candidates.mjs <workdir> <label> <pageUrl|imageUrl> [...]
// For each URL: a product page -> its og:image / twitter:image / JSON-LD Product image; an image URL ->
// itself. Saves each candidate ALREADY STANDARDIZED (exactly what would be uploaded) to
// <workdir>/candidates/<label>-N.jpg, with <file>.src = {page, image}. Look at these before choosing.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { standardize } = require('./standardize.cjs');

const [work, label, ...urls] = process.argv.slice(2);
if (!work || !label || urls.length === 0) {
  console.error('usage: node candidates.mjs <workdir> <label> <url> [...]');
  process.exit(1);
}
const outDir = `${work}/candidates`;
fs.mkdirSync(outDir, { recursive: true });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const get = async (u, accept) => {
  const r = await fetch(u, { headers: { 'user-agent': UA, accept }, signal: AbortSignal.timeout(15000) });
  return r.ok ? r : null;
};

function extractImages(html, base) {
  const out = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const k = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const c = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (c && ['og:image', 'og:image:secure_url', 'twitter:image'].includes(k)) out.push(c.replace(/&amp;/g, '&'));
  }
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      (function walk(n) {
        if (Array.isArray(n)) return n.forEach(walk);
        if (!n || typeof n !== 'object') return;
        if (/Product/i.test(String(n['@type'] ?? '')) && n.image) for (const i of [].concat(n.image)) out.push(typeof i === 'string' ? i : i?.url);
        Object.values(n).forEach(walk);
      })(JSON.parse(m[1]));
    } catch {
      // malformed JSON-LD
    }
  }
  return [...new Set(out.filter(Boolean).map((u) => new URL(u, base).toString()))];
}

let n = fs.readdirSync(outDir).filter((f) => f.startsWith(`${label}-`) && f.endsWith('.jpg')).length;
for (const u of urls) {
  try {
    const r = await get(u, 'text/html,image/*');
    if (!r) {
      console.log('FAILED (blocked or not found):', u);
      continue;
    }
    const type = r.headers.get('content-type') ?? '';
    const images = [];
    if (type.startsWith('image/')) images.push({ page: null, image: u, buf: Buffer.from(await r.arrayBuffer()) });
    else {
      for (const iu of extractImages(await r.text(), u).slice(0, 3)) {
        const ir = await get(iu, 'image/*');
        if (ir && (ir.headers.get('content-type') ?? '').startsWith('image/')) images.push({ page: u, image: iu, buf: Buffer.from(await ir.arrayBuffer()) });
      }
    }
    if (!images.length) console.log('NO PRODUCT IMAGE on', u);
    for (const im of images) {
      const s = await standardize(im.buf);
      n++;
      const file = `${outDir}/${label}-${n}.jpg`;
      fs.writeFileSync(file, s.full);
      fs.writeFileSync(`${file}.src`, JSON.stringify({ page: im.page, image: im.image }));
      const lowRes = s.sourceBottle.height < 600 ? '  ⚠ low resolution source (bottle < 600 px tall): will look soft' : '';
      console.log(`${file}  source bottle ${s.sourceBottle.width}x${s.sourceBottle.height}  ${im.image}${lowRes}`);
    }
  } catch (e) {
    console.log('ERROR', u, e.message);
  }
}
console.log('\nIf a candidate came from an image URL, set its "page" in the .src file to the product page it belongs to (shown under the photo in the app).');
