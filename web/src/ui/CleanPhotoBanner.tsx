import type { Wine } from '../data/wines.ts';
import {
  CLEAN_PHOTO_COST,
  canFindCleanPhoto,
  cancelCleanPhotoQueue,
  dismissCleanPhotoQueue,
  runCleanPhotoQueue,
  searchRunningElsewhere,
  useCleanPhotoState,
} from '../lib/cleanPhoto.ts';

/** Offers to find clean online photos for bottles that were never searched. */
export function CleanPhotoBanner({ wines }: { wines: Wine[] }) {
  const { running, queue } = useCleanPhotoState();
  const todo = wines.filter((w) => !w.cleanPhotoSearch && canFindCleanPhoto(w) && !running.has(w.id) && !searchRunningElsewhere(w));

  if (queue?.active) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-cream-200 px-4 py-3 text-sm">
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-wine-100 border-t-wine-800" />
        <span className="flex-1">
          {queue.cancelled ? 'Stopping after this one…' : `Finding clean photos… ${Math.min(queue.done + 1, queue.total)} of ${queue.total}`}
        </span>
        {!queue.cancelled && (
          <button type="button" onClick={cancelCleanPhotoQueue} className="shrink-0 font-medium text-wine-800 underline">
            Stop
          </button>
        )}
      </div>
    );
  }
  if (queue) {
    return (
      <button type="button" onClick={dismissCleanPhotoQueue} className="rounded-2xl bg-cream-200 px-4 py-3 text-left text-sm">
        Found clean photos for {queue.found} of {queue.done} bottle{queue.done === 1 ? '' : 's'}
        {queue.failed ? ` (${queue.failed} failed)` : ''}. <span className="text-ink-500">Tap to dismiss.</span>
      </button>
    );
  }
  if (todo.length === 0 || !navigator.onLine) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream-200 px-4 py-3 text-sm">
      <span className="flex-1">
        {todo.length} bottle{todo.length === 1 ? '' : 's'} without a clean photo.
        <span className="block text-xs text-ink-500">Searches online, {CLEAN_PHOTO_COST} each.</span>
      </span>
      <button
        type="button"
        onClick={() => void runCleanPhotoQueue(todo.map((w) => w.id))}
        className="shrink-0 rounded-full bg-wine-800 px-3 py-1.5 font-semibold text-white"
      >
        Find them
      </button>
    </div>
  );
}
