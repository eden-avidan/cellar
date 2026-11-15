import { useState } from 'react';
import type { Wine } from '../data/wines.ts';
import { estimatePeak } from '../lib/peak.ts';

/** Adds peak estimates to wines saved before scans included one (text only, about 0.5¢ each). */
export function PeakBanner({ wines }: { wines: Wine[] }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const todo = wines.filter((w) => w.list !== 'finished' && w.peakFrom == null && !w.peakEstimatedAt && (w.producer || w.wineName));

  const runAll = async () => {
    const batch = [...todo];
    setProgress({ done: 0, total: batch.length });
    for (const [i, w] of batch.entries()) {
      try {
        await estimatePeak(w.id);
      } catch (err) {
        console.error('peak estimate failed', w.id, err);
      }
      setProgress({ done: i + 1, total: batch.length });
    }
  };

  if (progress && progress.done < progress.total) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-cream-200 px-4 py-3 text-sm">
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-wine-100 border-t-wine-800" />
        Estimating peaks… {progress.done + 1} of {progress.total}
      </div>
    );
  }
  if (progress || todo.length === 0 || !navigator.onLine) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream-200 px-4 py-3 text-sm">
      <span className="flex-1">
        {todo.length} bottle{todo.length === 1 ? '' : 's'} without a peak estimate.
        <span className="block text-xs text-ink-500">Uses the saved details, no photo. About 0.5¢ each.</span>
      </span>
      <button type="button" onClick={runAll} className="shrink-0 rounded-full bg-wine-800 px-3 py-1.5 font-semibold text-white">
        Add peaks
      </button>
    </div>
  );
}
