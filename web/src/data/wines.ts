import { useEffect, useState } from 'react';
import {
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

export const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange'] as const;
export type WineType = (typeof WINE_TYPES)[number];
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
}

/** Everything the user can edit. Optional values are null or '' rather than missing. */
export interface WineFields {
  list: WineList;
  // From the label
  producer: string;
  wineName: string;
  vintage: number | null;
  country: string;
  region: string;
  appellation: string;
  classification: string;
  wineType: WineType | '';
  grapes: string[];
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

export interface Wine extends WineFields {
  id: string;
  tastings: Tasting[];
  photos: Photo[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export const emptyWine = (list: WineList): WineFields => ({
  list,
  producer: '',
  wineName: '',
  vintage: null,
  country: '',
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
  return {
    ...emptyWine((data.list as WineList) ?? 'cellar'),
    tastings: [],
    photos: [],
    createdAt: null,
    updatedAt: null,
    ...(data as Partial<Wine>),
    id,
  };
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

export async function createWine(uid: string, fields: WineFields, photos: PreparedPhoto[]): Promise<string> {
  const ref_ = doc(winesCol(uid));
  const uploaded = await uploadPhotos(uid, ref_.id, photos, 0);
  await setDoc(ref_, {
    ...fields,
    tastings: [],
    photos: uploaded,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref_.id;
}

export function updateWine(uid: string, id: string, patch: Partial<Wine>) {
  const { id: _ignored, createdAt: _c, ...rest } = patch;
  return updateDoc(wineDoc(uid, id), { ...rest, updatedAt: serverTimestamp() });
}

export async function addPhotos(uid: string, wine: Wine, photos: PreparedPhoto[]) {
  const uploaded = await uploadPhotos(uid, wine.id, photos, wine.photos.length);
  await updateWine(uid, wine.id, { photos: [...wine.photos, ...uploaded] });
}

export async function removePhoto(uid: string, wine: Wine, photo: Photo) {
  await updateWine(uid, wine.id, { photos: wine.photos.filter((p) => p.path !== photo.path) });
  await Promise.allSettled([deleteObject(ref(storage, photo.path)), deleteObject(ref(storage, photo.thumbPath))]);
}

export async function deleteWine(uid: string, wine: Wine) {
  await deleteDoc(wineDoc(uid, wine.id));
  await Promise.allSettled(
    wine.photos.flatMap((p) => [deleteObject(ref(storage, p.path)), deleteObject(ref(storage, p.thumbPath))]),
  );
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
