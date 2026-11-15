import type { WineFields } from '../data/wines.ts';

export type DrinkTone = 'hold' | 'ready' | 'peak' | 'soon' | 'past';
export interface DrinkStatus {
  tone: DrinkTone;
  label: string;
}

type Window = Pick<WineFields, 'drinkFrom' | 'drinkUntil' | 'expiresYear'> & Partial<Pick<WineFields, 'peakFrom' | 'peakTo'>>;

/**
 * Where a bottle stands this year. The drinking window (drinkFrom–drinkUntil) is when it drinks
 * well; the peak (peakFrom–peakTo) is the stretch inside it when it's at its very best; expiresYear
 * is when it's past drinking. Null when there's nothing to judge by.
 */
export function drinkStatus(w: Window, year = new Date().getFullYear()): DrinkStatus | null {
  const { drinkFrom, drinkUntil, expiresYear, peakFrom = null, peakTo = null } = w;
  if (expiresYear != null && year > expiresYear) return { tone: 'past', label: `Past its prime (${expiresYear})` };
  if (drinkUntil != null && year > drinkUntil) return { tone: 'past', label: `Past its best (${drinkUntil})` };
  if (drinkFrom != null && year < drinkFrom) {
    return { tone: 'hold', label: peakFrom != null ? `Hold · peak ${range(peakFrom, peakTo)}` : `Hold until ${drinkFrom}` };
  }
  if (peakFrom != null && peakTo != null && year >= peakFrom && year <= peakTo) {
    return { tone: 'peak', label: `At its peak · through ${peakTo}` };
  }
  const lastYear = Math.min(drinkUntil ?? Infinity, expiresYear ?? Infinity);
  if (lastYear !== Infinity && year >= lastYear) return { tone: 'soon', label: 'Drink this year' };
  if (lastYear !== Infinity && year >= lastYear - 1) return { tone: 'soon', label: `Drink by ${lastYear}` };
  if (peakFrom != null && year < peakFrom) return { tone: 'ready', label: `Ready · peak ${range(peakFrom, peakTo)}` };
  if (drinkFrom != null || drinkUntil != null) return { tone: 'ready', label: drinkUntil ? `Ready · until ${drinkUntil}` : 'Ready now' };
  return null;
}

const range = (from: number, to: number | null) => (to != null && to !== from ? `${from}–${to}` : `${from}`);

export const toneClass: Record<DrinkTone, string> = {
  hold: 'bg-sky-100 text-sky-800',
  ready: 'bg-emerald-100 text-emerald-800',
  peak: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 font-semibold shadow-sm shadow-amber-500/30',
  soon: 'bg-amber-100 text-amber-900',
  past: 'bg-rose-100 text-rose-800',
};
