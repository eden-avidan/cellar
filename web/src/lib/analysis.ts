import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase.ts';
import { averageRating, displayName, emptyWine, type Wine, type WineFields, type WineList } from '../data/wines.ts';

export type { WineAnalysis } from '../../../functions/src/schema.ts';
import type { WineAnalysis } from '../../../functions/src/schema.ts';

interface RatedWine {
  name: string;
  type: string | null;
  grapes: string[];
  region: string | null;
  rating: number;
}

/** The wines you've rated, best known first, so the reader can judge taste fit. */
export function ratedWines(wines: Wine[]): RatedWine[] {
  return wines
    .map((w) => ({ w, avg: averageRating(w) }))
    .filter((x): x is { w: Wine; avg: number } => x.avg != null)
    .sort((a, b) => b.w.tastings.length - a.w.tastings.length)
    .slice(0, 40)
    .map(({ w, avg }) => ({
      name: [displayName(w), w.vintage].filter(Boolean).join(' '),
      type: w.wineType || null,
      grapes: w.grapes.map((g) => g.grape),
      region: w.region || null,
      rating: Math.round(avg * 10) / 10,
    }));
}

type AnalyzeIn = { list: 'cellar' | 'wishlist'; images: { mediaType: 'image/jpeg'; data: string }[]; rated: RatedWine[] };
export interface AnalyzeResult {
  analysis: WineAnalysis;
  model: string;
  ms: number;
}

const analyzeCallable = httpsCallable<AnalyzeIn, AnalyzeResult>(functions, 'analyzeLabel', { timeout: 250_000 });

export async function analyzeLabel(list: 'cellar' | 'wishlist', base64Photos: string[], rated: RatedWine[]) {
  const res = await analyzeCallable({
    list,
    images: base64Photos.map((data) => ({ mediaType: 'image/jpeg', data })),
    rated,
  });
  return res.data;
}

export function analysisToFields(a: WineAnalysis, list: WineList, model = ''): WineFields {
  const l = a.label;
  const p = a.profile;
  return {
    ...emptyWine(list),
    producer: l.producer ?? '',
    wineName: l.wine_name ?? '',
    vintage: l.vintage,
    country: l.country ?? '',
    region: l.region ?? '',
    appellation: l.appellation ?? '',
    classification: l.classification ?? '',
    wineType: l.wine_type ?? '',
    grapes: l.grape_varieties,
    alcohol: l.alcohol_percent,
    bottleSizeMl: l.bottle_size_ml,
    body: p.body ?? '',
    sweetness: p.sweetness ?? '',
    acidity: p.acidity ?? '',
    tannin: p.tannin ?? '',
    tastingNotes: p.tasting_notes,
    foodPairings: p.food_pairings,
    servingTempMin: p.serving_temperature_c?.min ?? null,
    servingTempMax: p.serving_temperature_c?.max ?? null,
    decantMinutes: p.decant_minutes,
    drinkFrom: p.best_time_to_open?.from_year ?? null,
    drinkUntil: p.best_time_to_open?.to_year ?? null,
    drinkNote: p.best_time_to_open?.note ?? '',
    expiresYear: p.expires_at?.year ?? null,
    expiresSource: p.expires_at?.source ?? '',
    typicalPriceIls: p.typical_price_ils,
    tasteFitScore: a.taste_fit?.score ?? null,
    tasteFitReason: a.taste_fit?.reason ?? '',
    labelConfidence: a.label_reading_confidence,
    aiNotes: a.notes,
    aiModel: model,
  };
}

export function callableErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e.code === 'functions/deadline-exceeded') return 'The label reader took too long. Try again.';
  if (e.code === 'functions/unavailable' && !navigator.onLine) return 'You are offline.';
  if (e.code?.startsWith('functions/') && e.message && e.code !== 'functions/internal') return e.message;
  return 'Could not read the label. Try again, or fill the details in yourself.';
}
