// Finds a clean product photo of a wine online and makes it the bottle's first photo.
//
//   1. Claude + web search finds product pages for this exact wine (winery first, then shops).
//   2. This function fetches those pages and pulls their product image (og:image / JSON-LD).
//   3. Claude compares the candidates with the user's own label photo and picks one only if it
//      is the same wine and label, shown as a clean product shot.
//   4. The chosen image is stored in the user's Storage folder and put first in `photos`.
//
// Claude never returns image bytes; this code downloads them, so it controls size limits,
// timeouts and which hosts may be contacted. Cost guards: a server-side lock per wine, a check
// that the user has a photo to compare against before any paid call, and one overall deadline.

import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getFirestore, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

const FUNCTION_BUDGET_MS = 270_000; // the callable's timeoutSeconds is 300; leave room to write the result
const FETCH_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 4;
const MAX_PAGE_BYTES = 2_000_000;
const MAX_IMAGE_BYTES = 8_000_000;
const MAX_PIXELS = 40_000_000; // refuse decompression bombs before sharp allocates for them
const MAX_PAGES = 5;
const MAX_DOWNLOADS = 6;
const MAX_CANDIDATES = 5;
const PREVIEW_EDGE = 768; // what Claude compares: enough to read a label, ~600 image tokens each
const LOCK_MS = 5 * 60_000; // a "running" status older than this is treated as abandoned
const USER_AGENT = 'Mozilla/5.0 (compatible; CellarApp/1.0; personal wine catalogue)';

const img = (input: Buffer) => sharp(input, { limitInputPixels: MAX_PIXELS });

export interface WineInfo {
  producer: string;
  wineName: string;
  vintage: number | null;
  region: string;
  country: string;
  wineType: string;
}

interface StoredPhoto {
  path: string;
  url: string;
  thumbPath: string;
  thumbUrl: string;
  source?: string;
}

export type CleanPhotoResult =
  | { status: 'found'; pageUrl: string; sameVintage: 'yes' | 'no' | 'unknown' }
  | { status: 'none'; reason: string }
  | { status: 'skipped'; reason: string };

const describe = (w: WineInfo) =>
  [w.producer, w.wineName, w.vintage, w.wineType && `(${w.wineType})`, [w.region, w.country].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' ');

class Deadline {
  private readonly end = Date.now() + FUNCTION_BUDGET_MS;
  /** Timeout for the next model call, or null if there isn't enough time left for one. */
  callTimeout(min: number): number | null {
    const left = this.end - Date.now() - 5_000;
    return left >= min ? Math.min(left, 90_000) : null;
  }
}

// ---------- 1. Find product pages ----------

async function findProductPages(client: Anthropic, model: string, wine: WineInfo, deadline: Deadline): Promise<string[]> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: 'user',
      content: `Find web pages that show a product photo of this exact wine: ${describe(wine)}.
Prefer the winery's own product page, then wine shops. Same vintage if possible; the same label for another vintage is fine.
Only product pages for this wine: no search-result pages, articles, or pages about other wines from the producer.
Search with the producer and wine name; if that finds unrelated wines, search again adding "winery" and the region or country.
When done, reply with only this JSON: {"pages": ["https://...", ...]} listing up to ${MAX_PAGES} URLs, best first, or {"pages": []} if none.`,
    },
  ];
  let text = '';
  // Server tools can pause a long turn (stop_reason "pause_turn"); continue it at most once more.
  for (let turn = 0; turn < 2; turn++) {
    const timeout = deadline.callTimeout(30_000);
    if (timeout == null) break;
    const res = await client.beta.messages.create(
      {
        model,
        max_tokens: 8000,
        output_config: { effort: 'low' },
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
        messages,
      },
      { timeout, maxRetries: 0 },
    );
    logger.info('cleanPhoto.search', {
      turn,
      stop: res.stop_reason,
      inTok: res.usage.input_tokens,
      outTok: res.usage.output_tokens,
      searches: res.usage.server_tool_use?.web_search_requests ?? null,
    });
    for (const block of res.content) if (block.type === 'text') text += block.text;
    if (res.stop_reason !== 'pause_turn') break;
    // Continue the paused turn: its content goes into one assistant message for the turn.
    const blocks = res.content as unknown as Anthropic.Beta.BetaContentBlockParam[];
    const last = messages[messages.length - 1];
    if (last.role === 'assistant' && Array.isArray(last.content)) last.content.push(...blocks);
    else messages.push({ role: 'assistant', content: blocks });
  }
  // Only the model's own list counts: an explicit {"pages": []} means none, not "try the search hits".
  const json = text.match(/\{[\s\S]*"pages"[\s\S]*\}/);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json[0]) as { pages?: unknown };
    const pages = Array.isArray(parsed.pages) ? parsed.pages.filter((u): u is string => typeof u === 'string') : [];
    return [...new Set(pages.filter((u) => /^https:\/\//i.test(u)))].slice(0, MAX_PAGES);
  } catch {
    return [];
  }
}

// ---------- 2. Pull product images from the pages ----------

/** Only public https hosts on the default port: no IP literals, no private, loopback or link-local addresses. */
async function isSafePublicUrl(raw: string): Promise<boolean> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || (u.port && u.port !== '443') || u.username || u.password) return false;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) || /^(localhost|metadata(\.google\.internal)?)$/i.test(host) || host.endsWith('.internal') || host.endsWith('.local')) {
    return false;
  }
  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    return addrs.length > 0 && addrs.every((a) => isPublicAddress(a.address));
  } catch {
    return false;
  }
}

function isPublicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPublicAddress(v6.slice(7));
  return !(v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith('ff'));
}

async function fetchLimited(url: string, maxBytes: number, accept: string): Promise<{ body: Buffer; type: string } | null> {
  try {
    let current = url;
    let res: Response | null = null;
    // Follow redirects by hand so every hop passes the host check.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafePublicUrl(current))) return null;
      res = await fetch(current, {
        headers: { 'user-agent': USER_AGENT, accept },
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        current = new URL(location, current).toString();
        res = null;
        continue;
      }
      break;
    }
    if (!res || !res.ok || !res.body) return null;
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > maxBytes) return null;
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      size += chunk.byteLength;
      if (size > maxBytes) return null;
      chunks.push(Buffer.from(chunk));
    }
    return { body: Buffer.concat(chunks), type: res.headers.get('content-type') ?? '' };
  } catch {
    return null;
  }
}

const decodeEntities = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** og:image, twitter:image, and Product images in JSON-LD, in that order. Exported for tests. */
export function extractImageUrls(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (content && (key === 'og:image' || key === 'og:image:secure_url' || key === 'twitter:image')) found.push(decodeEntities(content));
  }
  const ldRe = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(ldRe)) {
    try {
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const o = node as Record<string, unknown>;
        if (/Product/i.test(String(o['@type'] ?? '')) && o.image) {
          for (const i of Array.isArray(o.image) ? o.image : [o.image]) {
            if (typeof i === 'string') found.push(i);
            else if (i && typeof i === 'object' && typeof (i as { url?: unknown }).url === 'string') found.push((i as { url: string }).url);
          }
        }
        Object.values(o).forEach(walk);
      };
      walk(JSON.parse(m[1]));
    } catch {
      // ignore malformed JSON-LD
    }
  }
  const out: string[] = [];
  for (const u of found) {
    try {
      const abs = new URL(u, pageUrl).toString();
      if (/^https:/i.test(abs) && !/\.svg(\?|$)/i.test(abs) && !/logo|favicon|placeholder/i.test(abs)) out.push(abs);
    } catch {
      // bad URL
    }
  }
  return [...new Set(out)];
}

interface Candidate {
  pageUrl: string;
  imageUrl: string;
  original: Buffer;
  preview: Buffer; // JPEG, PREVIEW_EDGE max
}

/** Exported for local dry runs. */
export async function gatherCandidates(pages: string[]): Promise<Candidate[]> {
  const perPage = await Promise.all(
    pages.map(async (pageUrl) => {
      const page = await fetchLimited(pageUrl, MAX_PAGE_BYTES, 'text/html,application/xhtml+xml');
      if (!page || !/html/i.test(page.type)) return [];
      return extractImageUrls(page.body.toString('utf8'), pageUrl)
        .slice(0, 2)
        .map((imageUrl) => ({ pageUrl, imageUrl }));
    }),
  );
  const seen = new Set<string>();
  const wanted = perPage
    .flat()
    .filter((c) => !seen.has(c.imageUrl) && seen.add(c.imageUrl))
    .slice(0, MAX_DOWNLOADS);
  const downloads = await Promise.all(wanted.map(async (w) => ({ ...w, file: await fetchLimited(w.imageUrl, MAX_IMAGE_BYTES, 'image/*') })));
  // Decode one at a time to keep memory flat.
  const out: Candidate[] = [];
  for (const d of downloads) {
    if (out.length >= MAX_CANDIDATES) break;
    if (!d.file || !/^image\/(jpeg|png|webp|gif|avif)/i.test(d.file.type)) continue;
    try {
      const meta = await img(d.file.body).metadata();
      if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 250 || meta.width * meta.height > MAX_PIXELS) continue;
      const preview = await img(d.file.body)
        .rotate()
        .flatten({ background: '#ffffff' })
        .resize({ width: PREVIEW_EDGE, height: PREVIEW_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      out.push({ pageUrl: d.pageUrl, imageUrl: d.imageUrl, original: d.file.body, preview });
    } catch {
      // not an image sharp can (or should) read
    }
  }
  return out;
}

// ---------- 3. Compare candidates with the user's own photo ----------

const verifySchema = {
  type: 'object',
  properties: {
    match_index: {
      anyOf: [{ type: 'integer' }, { type: 'null' }],
      description: 'Number of the candidate photo to use (1-based), or null if none qualifies.',
    },
    same_vintage: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    reason: { type: 'string', description: 'One short sentence.' },
  },
  required: ['match_index', 'same_vintage', 'reason'],
  additionalProperties: false,
};

async function pickCandidate(
  client: Anthropic,
  model: string,
  wine: WineInfo,
  userPhoto: Buffer,
  candidates: Candidate[],
  timeout: number,
): Promise<{ index: number | null; sameVintage: 'yes' | 'no' | 'unknown'; reason: string }> {
  const image = (data: Buffer) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: data.toString('base64') },
  });
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: 'text', text: `Photo 0 is the owner's own photo of their bottle: ${describe(wine)}.` },
    image(userPhoto),
  ];
  candidates.forEach((c, i) => content.push({ type: 'text', text: `Candidate ${i + 1}:` }, image(c.preview)));
  content.push({
    type: 'text',
    text: `Pick the candidate to use as this bottle's catalogue photo. It must show the same wine as photo 0: same producer, same cuvée, same label design (a different vintage year on an otherwise identical label is acceptable; say so in same_vintage). It must also be a clean product shot: one bottle, label facing the camera, plain or studio background (a soft shadow, reflection or tight crop is fine), no people or hands. If several qualify, prefer the same vintage, then the clearest image. If none qualifies, use null. same_vintage refers to the chosen candidate: "unknown" if its year is not clearly legible or if none is chosen.`,
  });
  const res = await client.beta.messages.create(
    {
      model,
      max_tokens: 8000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: verifySchema } },
      messages: [{ role: 'user', content }],
    },
    { timeout, maxRetries: 0 },
  );
  logger.info('cleanPhoto.verify', { stop: res.stop_reason, inTok: res.usage.input_tokens, outTok: res.usage.output_tokens, candidates: candidates.length });
  const text = res.content.find((b) => b.type === 'text');
  if (res.stop_reason !== 'end_turn' || !text || text.type !== 'text') {
    return { index: null, sameVintage: 'unknown', reason: 'The photo check did not complete.' };
  }
  const out = JSON.parse(text.text) as { match_index: number | null; same_vintage: 'yes' | 'no' | 'unknown'; reason: string };
  const index = out.match_index != null && out.match_index >= 1 && out.match_index <= candidates.length ? out.match_index - 1 : null;
  return { index, sameVintage: out.same_vintage, reason: out.reason };
}

// ---------- 4. Store and update the wine ----------

async function storeImage(uid: string, wineId: string, original: Buffer, source: string): Promise<StoredPhoto> {
  const bucket = getStorage().bucket();
  const base = `users/${uid}/wines/${wineId}/clean-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const toJpeg = (edge: number, quality: number) =>
    img(original)
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  const full = await toJpeg(1400, 88);
  const thumb = await toJpeg(480, 82);
  // Each file gets its own download token, the same kind the web SDK's getDownloadURL() returns.
  // (Building the URL ourselves also works on the Storage emulator, where the Admin SDK's
  // getDownloadURL() is refused.)
  const save = async (path: string, data: Buffer) => {
    const token = randomUUID();
    await bucket.file(path).save(data, {
      resumable: false,
      metadata: { contentType: 'image/jpeg', metadata: { firebaseStorageDownloadTokens: token } },
    });
    return downloadUrl(bucket.name, path, token);
  };
  const [url, thumbUrl] = await Promise.all([save(`${base}.jpg`, full), save(`${base}-thumb.jpg`, thumb)]);
  return { path: `${base}.jpg`, url, thumbPath: `${base}-thumb.jpg`, thumbUrl, source };
}

function downloadUrl(bucket: string, path: string, token: string): string {
  const emulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  const origin = emulator ? `http://${emulator.replace(/^https?:\/\//, '')}` : 'https://firebasestorage.googleapis.com';
  return `${origin}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/** The user's own label photo (first photo that didn't come from the web), shrunk for comparison. */
async function loadUserPhoto(photos: StoredPhoto[]): Promise<Buffer | null> {
  const own = photos.find((p) => !p.source);
  if (!own) return null;
  try {
    const [buf] = await getStorage().bucket().file(own.path).download();
    return await img(buf).rotate().resize({ width: PREVIEW_EDGE, height: PREVIEW_EDGE, fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
  } catch (err) {
    logger.warn('cleanPhoto: could not read the user photo', { path: own.path, err: String(err) });
    return null;
  }
}

/**
 * Takes the per-wine lock in a transaction, so two devices, a reload, or the banner plus the bottle
 * page can't pay for the same search twice. Returns the wine data, or a reason to skip.
 */
async function lockWine(ref: DocumentReference, onlyIfMissing: boolean): Promise<{ data: Record<string, unknown> } | { skip: string }> {
  // Right after a save the phone may still be sending the document; give it a few seconds.
  for (let i = 0; i < 4; i++) {
    const result = await getFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const data = snap.data() as Record<string, unknown>;
      const prev = data.cleanPhotoSearch as { status?: string; at?: string } | undefined;
      if (prev?.status === 'running' && Date.now() - Date.parse(prev.at ?? '') < LOCK_MS) return { skip: 'A search for this wine is already running.' };
      if (onlyIfMissing && prev && prev.status !== 'running') return { skip: 'This wine was already searched.' };
      if (!data.producer && !data.wineName) return { skip: 'Add the producer or wine name first.' };
      const photos = (Array.isArray(data.photos) ? data.photos : []) as StoredPhoto[];
      if (!photos.some((p) => !p.source)) return { skip: 'Add a photo of your bottle first, so the search has a label to compare against.' };
      tx.update(ref, { cleanPhotoSearch: { ...(prev ?? {}), status: 'running', at: new Date().toISOString() } });
      return { data };
    });
    if (result) return result;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new HttpsError('not-found', 'That wine was not found.');
}

export async function findCleanPhoto(
  uid: string,
  wineId: string,
  opts: { apiKey: string; model: string; mock: boolean; onlyIfMissing: boolean },
): Promise<CleanPhotoResult> {
  const ref = getFirestore().doc(`users/${uid}/wines/${wineId}`);
  const locked = await lockWine(ref, opts.onlyIfMissing);
  if ('skip' in locked) return { status: 'skipped', reason: locked.skip };
  const data = locked.data;
  const previous = data.cleanPhotoSearch as Record<string, unknown> | undefined;
  const wine: WineInfo = {
    producer: String(data.producer ?? ''),
    wineName: String(data.wineName ?? ''),
    vintage: typeof data.vintage === 'number' ? data.vintage : null,
    region: String(data.region ?? ''),
    country: String(data.country ?? ''),
    wineType: String(data.wineType ?? ''),
  };
  const photos = (Array.isArray(data.photos) ? data.photos : []) as StoredPhoto[];
  const deadline = new Deadline();
  const started = Date.now();

  /** Ends the run without a new photo. Keeps an earlier found photo and its status if there is one. */
  const finishNone = async (reason: string): Promise<CleanPhotoResult> => {
    const keepEarlier = previous?.status === 'found' && photos.some((p) => p.source);
    await ref
      .update({ cleanPhotoSearch: keepEarlier ? previous : { status: 'none', at: new Date().toISOString(), reason } })
      .catch(() => undefined); // wine deleted meanwhile
    logger.info('cleanPhoto.none', { ms: Date.now() - started, reason });
    return { status: 'none', reason };
  };

  try {
    let chosen: { candidate: Candidate; sameVintage: 'yes' | 'no' | 'unknown' } | null = null;
    if (opts.mock) {
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#fff"/><path d="M270 80h60v200c0 30 60 70 60 140v380a30 30 0 0 1-30 30H180a30 30 0 0 1-30-30V420c0-70 60-110 60-140z" transform="translate(30 0)" fill="#5B1A2B"/><rect x="200" y="520" width="200" height="220" rx="8" fill="#FBF7F2"/></svg>`,
      );
      const png = await sharp(svg).png().toBuffer();
      chosen = { candidate: { pageUrl: 'https://example.com/mock-wine', imageUrl: 'mock', original: png, preview: png }, sameVintage: 'yes' };
    } else {
      const userPhoto = await loadUserPhoto(photos);
      if (!userPhoto) return await finishNone("Couldn't read your photo of the bottle.");
      const client = new Anthropic({ apiKey: opts.apiKey });
      const pages = await findProductPages(client, opts.model, wine, deadline);
      const candidates = pages.length ? await gatherCandidates(pages) : [];
      logger.info('cleanPhoto.candidates', { pages: pages.length, candidates: candidates.length });
      if (candidates.length === 0) {
        return await finishNone(pages.length ? 'Found pages for this wine, but none had a usable product photo.' : 'No product pages found for this wine.');
      }
      const timeout = deadline.callTimeout(20_000);
      if (timeout == null) return await finishNone('Ran out of time before comparing photos.');
      const pick = await pickCandidate(client, opts.model, wine, userPhoto, candidates, timeout);
      if (pick.index == null) return await finishNone(pick.reason);
      chosen = { candidate: candidates[pick.index], sameVintage: pick.sameVintage };
    }

    const stored = await storeImage(uid, wineId, chosen.candidate.original, chosen.candidate.pageUrl);
    const bucket = getStorage().bucket();
    // Put it first atomically, so a photo the app adds meanwhile isn't lost; replace any earlier web photo.
    const oldWeb = await getFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const latest = (snap.data()?.photos ?? []) as StoredPhoto[];
      tx.update(ref, {
        photos: [stored, ...latest.filter((p) => !p.source)],
        cleanPhotoSearch: {
          status: 'found',
          at: new Date().toISOString(),
          pageUrl: chosen.candidate.pageUrl,
          imageUrl: chosen.candidate.imageUrl,
          sameVintage: chosen.sameVintage,
        },
      });
      return latest.filter((p) => p.source);
    });
    const toDelete = oldWeb ?? [stored]; // wine deleted meanwhile: don't leave the new files behind
    await Promise.allSettled(toDelete.flatMap((p) => [bucket.file(p.path).delete(), bucket.file(p.thumbPath).delete()]));
    if (!oldWeb) throw new HttpsError('not-found', 'That wine was deleted.');
    logger.info('cleanPhoto.found', { ms: Date.now() - started, page: chosen.candidate.pageUrl, sameVintage: chosen.sameVintage });
    return { status: 'found', pageUrl: chosen.candidate.pageUrl, sameVintage: chosen.sameVintage };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('cleanPhoto failed', err);
    await finishNone('The search failed. Try again later.');
    if (err instanceof Anthropic.APIError) throw new HttpsError('unavailable', 'Claude is unavailable right now. Try again later.');
    throw new HttpsError('internal', 'The photo search failed.');
  }
}
