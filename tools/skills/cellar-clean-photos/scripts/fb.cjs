// Firestore + Storage access for the Cellar app (project my-cellar-732a4), authenticated exactly the
// way the Firebase CLI authenticates its own commands: the signed-in `firebase login` account.
// No Anthropic key, no Cloud Functions, no service account.
const FT = (() => {
  const { execSync } = require('node:child_process');
  return `${execSync('npm root -g').toString().trim()}/firebase-tools/lib`;
})();
const { requireAuth } = require(`${FT}/requireAuth.js`);
const { Client } = require(`${FT}/apiv2.js`);
const authMod = require(`${FT}/auth.js`);
const { Readable } = require('node:stream');

const PROJECT = 'my-cellar-732a4';
const PROJECT_DIR = `${require('node:os').homedir()}/Documents/wine-cellar`;
const UID = 'ifSTXdSuAEhT1cQ0PBYldXAtgpK2'; // the owner (see firestore.rules)
const BUCKET = 'my-cellar-732a4.firebasestorage.app';
const DOCS = `projects/${PROJECT}/databases/(default)/documents`;

let ready;
const auth = () =>
  (ready ??= (async () => {
    const options = { project: PROJECT, cwd: PROJECT_DIR };
    const account = authMod.getProjectDefaultAccount(PROJECT_DIR) ?? authMod.getGlobalDefaultAccount();
    if (!account) throw new Error('Not signed in: run `firebase login` with the account that owns my-cellar-732a4.');
    authMod.setActiveAccount(options, account);
    await requireAuth(options);
  })());

const firestore = new Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1', auth: true });
const storage = new Client({ urlPrefix: 'https://storage.googleapis.com', auth: true });

function fromValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields ?? {});
  return undefined;
}
const fromFields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromValue(v)]));
function toValue(x) {
  if (x === null || x === undefined) return { nullValue: null };
  if (typeof x === 'string') return { stringValue: x };
  if (typeof x === 'boolean') return { booleanValue: x };
  if (typeof x === 'number') return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (Array.isArray(x)) return { arrayValue: { values: x.map(toValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, v]) => [k, toValue(v)])) } };
}

async function listWines() {
  await auth();
  const res = await firestore.get(`/${DOCS}/users/${UID}/wines`, { queryParams: { pageSize: 300 } });
  return (res.body.documents ?? []).map((d) => ({ id: d.name.split('/').pop(), updateTime: d.updateTime, ...fromFields(d.fields ?? {}) }));
}

/** Sets top-level fields; refuses (HTTP 400/409) if the wine changed since `updateTime`, so app edits are never lost. */
async function patchWine(id, fields, updateTime) {
  await auth();
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await firestore.request({
    method: 'PATCH',
    path: `/${DOCS}/users/${UID}/wines/${id}?${mask}&currentDocument.updateTime=${encodeURIComponent(updateTime)}`,
    body: { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toValue(v)])) },
  });
  return res.body;
}

/** Uploads a JPEG with a Firebase download token; returns the URL the app uses to show it. */
async function uploadJpeg(path, data, token) {
  await auth();
  const boundary = `cellar${Date.now()}`;
  const meta = JSON.stringify({ name: path, contentType: 'image/jpeg', metadata: { firebaseStorageDownloadTokens: token } });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`),
    data,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  await storage.request({
    method: 'POST',
    path: `/upload/storage/v1/b/${BUCKET}/o`,
    queryParams: { uploadType: 'multipart' },
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: Readable.from([body]), // apiv2 JSON-encodes Buffers; a stream is sent as-is
    skipLog: { body: true },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

async function deleteObject(path) {
  await auth();
  await storage.request({ method: 'DELETE', path: `/storage/v1/b/${BUCKET}/o/${encodeURIComponent(path)}`, responseType: 'stream', resolveOnHTTPError: true });
}

async function listObjects(prefix) {
  await auth();
  const res = await storage.get(`/storage/v1/b/${BUCKET}/o`, { queryParams: { prefix, maxResults: 1000 } });
  return (res.body.items ?? []).map((o) => o.name);
}

/** sharp, borrowed from the app's own node_modules (no separate install). */
const sharp = require(require.resolve('sharp', { paths: [PROJECT_DIR] }));

module.exports = { listWines, patchWine, uploadJpeg, deleteObject, listObjects, sharp, UID };
