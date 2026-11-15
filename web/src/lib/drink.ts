import type { WineFields } from '../data/wines.ts';

export type DrinkTone = 'hold' | 'ready' | 'soon' | 'past';
export interface DrinkStatus {
  tone: DrinkTone;
  label: string;
}

/** Where a bottle stands in its drinking window this year. Null when there's no window to judge by. */
export function drinkStatus(w: Pick<WineFields, 'drinkFrom' | 'drinkUntil' | 'expiresYear'>, year = new Date().getFullYear()): DrinkStatus | null {
  const { drinkFrom, drinkUntil, expiresYear } = w;
  if (expiresYear != null && year > expiresYear) return { tone: 'past', label: `Past its prime (${expiresYear})` };
  if (drinkUntil != null && year > drinkUntil) return { tone: 'past', label: `Past peak (${drinkUntil})` };
  if (drinkFrom != null && year < drinkFrom) return { tone: 'hold', label: `Hold until ${drinkFrom}` };
  const lastYear = Math.min(drinkUntil ?? Infinity, expiresYear ?? Infinity);
  if (lastYear !== Infinity && year >= lastYear) return { tone: 'soon', label: `Drink this year` };
  if (lastYear !== Infinity && year >= lastYear - 1) return { tone: 'soon', label: `Drink by ${lastYear}` };
  if (drinkFrom != null || drinkUntil != null) return { tone: 'ready', label: drinkUntil ? `Ready · until ${drinkUntil}` : 'Ready now' };
  return null;
}

export const toneClass: Record<DrinkTone, string> = {
  hold: 'bg-sky-100 text-sky-800',
  ready: 'bg-emerald-100 text-emerald-800',
  soon: 'bg-amber-100 text-amber-900',
  past: 'bg-rose-100 text-rose-800',
};
