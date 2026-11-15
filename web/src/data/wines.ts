import { useEffect, useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase.ts';
import type { PreparedPhoto } from '../lib/images.ts';
import type { WineAnalysis } from '../../../functions/src/schema.ts';

import { WINE_TYPES } from '../../../functions/src/schema.ts';

export { FOOD_PAIRINGS, WINE_TYPES } from '../../../functions/src/schema.ts';
export type WineType = (typeof WINE_TYPES)[number];

/** One grape of the blend; percent is null when unknown. */
export interface Grape {
  grape: string;
  percent: number | null;
}
export type WineList = 'cellar' | 'wishlist' | 'finished';

export interface Tasting {
  id: string;
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
  notes: string;
}

export interface Photo {
  path: string;
  url: string;
  thumbPath: string;
  thumbUrl: string;
  /** Set on a photo taken from the web (e.g. a clean product shot): the page it came from. */
  source?: string;
}

/** Everything the user can edit. Optional values are null or '' rather than missing. */
export interface WineFields {
  list: WineList;
  // From the label
  producer: string;
  wineName: string;
  vintage: number | null;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2, '' if unknown
  region: string;
  appellation: string;
  classification: string;
  wineType: WineType | '';
  grapes: Grape[];
  alcohol: number | null;
  bottleSizeMl: number | null;
  // AI estimates
  body: string;
  sweetness: string;
  acidity: string;
  tannin: string;
  tastingNotes: string[];
  foodPairings: string[];
  servingTempMin: number | null;
  servingTempMax: number | null;
  decantMinutes: number | null;
  drinkFrom: number | null;
  drinkUntil: number | null;
  drinkNote: string;
  peakFrom: number | null;
  peakTo: number | null;
  expiresYear: number | null;
  expiresSource: 'label' | 'estimate' | '';
  typicalPriceIls: number | null;
  tasteFitScore: number | null;
  tasteFitReason: string;
  labelConfidence: 'high' | 'medium' | 'low' | '';
  aiNotes: string;
  aiModel: string; // which model read the label, e.g. claude-opus-5-5
  // Yours (all optional)
  quantity: number | null;
  location: string;
  pricePaid: number | null;
  boughtAt: string;
  purchaseDate: string;
  notes: string;
}

/** Claude's original answer for this bottle, kept so it can be reloaded instead of scanned again. */
export interface StoredScan {
  analysis: WineAnalysis;
  model: string;
  ms: number;
  scannedAt: string; // ISO time
}

export interface Wine extends WineFields {
  id: string;
  tastings: Tasting[];
  photos: Photo[];
  scan: StoredScan | null;
  /** Set when a peak was estimated for a wine saved before scans included one. */
  peakEstimatedAt: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export const emptyWine = (list: WineList): WineFields => ({
  list,
  producer: '',
  wineName: '',
  vintage: null,
  country: '',
  countryCode: '',
  region: '',
  appellation: '',
  classification: '',
  wineType: '',
  grapes: [],
  alcohol: null,
  bottleSizeMl: null,
  body: '',
  sweetness: '',
  acidity: '',
  tannin: '',
  tastingNotes: [],
  foodPairings: [],
  servingTempMin: null,
  servingTempMax: null,
  decantMinutes: null,
  drinkFrom: null,
  drinkUntil: null,
  drinkNote: '',
  peakFrom: null,
  peakTo: null,
  expiresYear: null,
  expiresSource: '',
  typicalPriceIls: null,
  tasteFitScore: null,
  tasteFitReason: '',
  labelConfidence: '',
  aiNotes: '',
  aiModel: '',
  quantity: list === 'cellar' ? 1 : null,
  location: '',
  pricePaid: null,
  boughtAt: '',
  purchaseDate: '',
  notes: '',
});

const winesCol = (uid: string) => collection(db, 'users', uid, 'wines');
const wineDoc = (uid: string, id: string) => doc(db, 'users', uid, 'wines', id);

function fromDoc(id: string, data: Record<string, unknown>): Wine {
  // Spread over the defaults so older documents missing a newer field still render.
  const wine: Wine = {
    ...emptyWine((data.list as WineList) ?? 'cellar'),
    tastings: [],
    photos: [],
    scan: null,
    peakEstimatedAt: null,
    createdAt: null,
    updatedAt: null,
    ...(data as Partial<Wine>),
    id,
  };
  // Early records stored grapes as plain names.
  wine.grapes = (wine.grapes as unknown[]).map((g) => (typeof g === 'string' ? { grape: g, percent: null } : (g as Grape)));
  return wine;
}

/** "Grenache 60% · Syrah 30% · Mourvèdre" */
export function grapesText(grapes: Grape[]): string {
  return grapes.map((g) => (g.percent != null ? `${g.grape} ${g.percent}%` : g.grape)).join(' · ');
}

export function useWines(uid: string) {
  const [wines, setWines] = useState<Wine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(
    () =>
      onSnapshot(
        query(winesCol(uid), orderBy('createdAt', 'desc')),
        (snap) => setWines(snap.docs.map((d) => fromDoc(d.id, d.data()))),
        (err) => setError(err.message),
      ),
    [uid],
  );
  return { wines, error };
}

export function useWine(uid: string, id: string) {
  const [wine, setWine] = useState<Wine | null | undefined>(undefined);
  useEffect(
    () => onSnapshot(wineDoc(uid, id), (snap) => setWine(snap.exists() ? fromDoc(snap.id, snap.data()) : null)),
    [uid, id],
  );
  return wine;
}

async function uploadPhotos(uid: string, wineId: string, photos: PreparedPhoto[], startIndex: number): Promise<Photo[]> {
  const stamp = Date.now();
  return Promise.all(
    photos.map(async (p, i) => {
      const base = `users/${uid}/wines/${wineId}/${stamp}-${startIndex + i}`;
      const full = ref(storage, `${base}.jpg`);
      const thumb = ref(storage, `${base}-thumb.jpg`);
      await Promise.all([
        uploadBytes(full, p.full, { contentType: 'image/jpeg' }),
        uploadBytes(thumb, p.thumb, { contentType: 'image/jpeg' }),
      ]);
      const [url, thumbUrl] = await Promise.all([getDownloadURL(full), getDownloadURL(thumb)]);
      return { path: full.fullPath, url, thumbPath: thumb.fullPath, thumbUrl };
    }),
  );
}

/**
 * Firestore writes go to the offline cache at once but their promises only settle when the server
 * confirms. Screens must not wait on them, or "Saving…" spins forever in a cellar without signal.
 * So writes are fired here and failures are only logged; the snapshot listeners update the UI.
 */
function fire(write: Promise<unknown>, what: string) {
  write.catch((err) => console.error(`Firestore ${what} failed`, err));
}

/** Photo uploads need a connection (Storage doesn't queue offline); the document write doesn't wait. */
export async function createWine(
  uid: string,
  fields: WineFields,
  photos: PreparedPhoto[],
  scan: Omit<StoredScan, 'scannedAt'> | null = null,
): Promise<string> {
  const ref_ = doc(winesCol(uid));
  const uploaded = await uploadPhotos(uid, ref_.id, photos, 0);
  fire(
    setDoc(ref_, {
      ...fields,
      tastings: [],
      photos: uploaded,
      scan: scan ? { ...scan, scannedAt: new Date().toISOString() } : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    'create',
  );
  return ref_.id;
}

export function updateWine(uid: string, id: string, patch: Partial<Wine>) {
  const { id: _ignored, createdAt: _c, ...rest } = patch;
  fire(updateDoc(wineDoc(uid, id), { ...rest, updatedAt: serverTimestamp() }), 'update');
}

export async function addPhotos(uid: string, wine: Wine, photos: PreparedPhoto[]) {
  const uploaded = await uploadPhotos(uid, wine.id, photos, wine.photos.length);
  // arrayUnion edits the stored list in place, so a photo the server adds meanwhile isn't lost.
  fire(updateDoc(wineDoc(uid, wine.id), { photos: arrayUnion(...uploaded), updatedAt: serverTimestamp() }), 'add photos');
}

function deleteFiles(paths: string[]) {
  // Best effort: offline, these fail and leave orphaned files, which cost next to nothing.
  void Promise.allSettled(paths.map((p) => deleteObject(ref(storage, p))));
}

export function removePhoto(uid: string, wine: Wine, photo: Photo) {
  const patch: Record<string, unknown> = { photos: arrayRemove(photo), updatedAt: serverTimestamp() };
  fire(updateDoc(wineDoc(uid, wine.id), patch), 'remove photo');
  deleteFiles([photo.path, photo.thumbPath]);
}

export function deleteWine(uid: string, wine: Wine) {
  fire(deleteDoc(wineDoc(uid, wine.id)), 'delete');
  deleteFiles(wine.photos.flatMap((p) => [p.path, p.thumbPath]));
}

/** Log a tasting. When `openedBottle` is set, one bottle leaves the cellar; the last one moves the wine to Finished. */
export function addTasting(uid: string, wine: Wine, tasting: Omit<Tasting, 'id'>, openedBottle: boolean) {
  const patch: Partial<Wine> = {
    tastings: [...wine.tastings, { ...tasting, id: crypto.randomUUID() }].sort((a, b) => a.date.localeCompare(b.date)),
  };
  if (openedBottle && wine.list === 'cellar') {
    const left = wine.quantity == null ? 0 : Math.max(0, wine.quantity - 1);
    patch.quantity = left;
    if (left === 0) patch.list = 'finished';
  }
  return updateWine(uid, wine.id, patch);
}

export function removeTasting(uid: string, wine: Wine, tastingId: string) {
  return updateWine(uid, wine.id, { tastings: wine.tastings.filter((t) => t.id !== tastingId) });
}

export function averageRating(wine: Pick<Wine, 'tastings'>): number | null {
  if (wine.tastings.length === 0) return null;
  return wine.tastings.reduce((s, t) => s + t.rating, 0) / wine.tastings.length;
}

export function displayName(w: Pick<WineFields, 'producer' | 'wineName'>): string {
  return [w.producer, w.wineName].filter(Boolean).join(' ') || 'Unnamed wine';
}
