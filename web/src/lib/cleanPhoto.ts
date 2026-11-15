import { useSyncExternalStore } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase.ts';
import type { Wine } from '../data/wines.ts';

export type CleanPhotoResult =
  | { status: 'found'; pageUrl: string; sameVintage: 'yes' | 'no' | 'unknown' }
  | { status: 'none'; reason: string }
  | { status: 'skipped'; reason: string };

/** Shown next to the buttons. From the review: one web search + reading results + the photo check. */
export const CLEAN_PHOTO_COST = 'about 10–25¢';

const callable = httpsCallable<{ wineId: string; onlyIfMissing?: boolean }, CleanPhotoResult>(functions, 'findCleanPhoto', {
  timeout: 310_000, // the function itself stops by 300 s
});

/** The search compares against the owner's own label photo, so it needs one. */
export const canFindCleanPhoto = (w: Wine) => Boolean((w.producer || w.wineName) && w.photos.some((p) => !p.source));

/** A search another device (or an earlier page load) started and is presumably still running. */
export const searchRunningElsewhere = (w: Wine) =>
  w.cleanPhotoSearch?.status === 'running' && Date.now() - Date.parse(w.cleanPhotoSearch.at) < 5 * 60_000;

// ---- shared state: which wines are in flight here, and the backfill queue ----

interface QueueState {
  total: number;
  done: number;
  found: number;
  failed: number;
  active: boolean;
  cancelled: boolean;
}
const running = new Set<string>();
let queue: QueueState | null = null;
const listeners = new Set<() => void>();
let version = 0;
const notify = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Wines already searched automatically in this session, so a failure doesn't retry in a loop. */
const autoTried = new Set<string>();

export async function findCleanPhoto(wineId: string, onlyIfMissing = false): Promise<CleanPhotoResult> {
  running.add(wineId);
  notify();
  try {
    return (await callable({ wineId, onlyIfMissing })).data;
  } finally {
    running.delete(wineId);
    notify();
  }
}

/** Runs once per wine per session, for the automatic search after a scan. */
export function autoFindCleanPhoto(wineId: string) {
  if (autoTried.has(wineId) || running.has(wineId)) return;
  autoTried.add(wineId);
  findCleanPhoto(wineId, true).catch((err) => console.error('clean photo search failed', err));
}

/**
 * Searches the given wines one at a time. Lives outside any component, so leaving the page doesn't
 * stop it and coming back can't start a second run. The server skips wines already searched.
 */
export async function runCleanPhotoQueue(wineIds: string[]) {
  if (queue?.active) return;
  queue = { total: wineIds.length, done: 0, found: 0, failed: 0, active: true, cancelled: false };
  notify();
  let failedInARow = 0;
  for (const id of wineIds) {
    if (queue.cancelled || failedInARow >= 2) break;
    if (!running.has(id)) {
      try {
        const r = await findCleanPhoto(id, true);
        if (r.status === 'found') queue.found++;
        failedInARow = 0;
      } catch (err) {
        console.error('clean photo search failed', id, err);
        queue.failed++;
        failedInARow++;
      }
    }
    queue.done++;
    notify();
  }
  queue.active = false;
  notify();
}

export function cancelCleanPhotoQueue() {
  if (queue?.active) {
    queue.cancelled = true;
    notify();
  }
}

export function dismissCleanPhotoQueue() {
  if (queue && !queue.active) {
    queue = null;
    notify();
  }
}

export function useCleanPhotoState(): { running: ReadonlySet<string>; queue: Readonly<QueueState> | null } {
  useSyncExternalStore(subscribe, () => version);
  return { running, queue };
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function cleanPhotoErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e.code === 'functions/deadline-exceeded') return 'The search took too long. Try again.';
  if (e.code?.startsWith('functions/') && e.message && e.code !== 'functions/internal') return e.message;
  return "Couldn't search for a photo right now.";
}
