// The JSON shape Claude must return for a wine label. Sent as a structured-output schema, so the
// response is guaranteed to parse into WineAnalysis. The web app imports the constants and types
// from this file too (no Node imports here), so the two sides can't drift apart.

const nullable = (schema: object) => ({ anyOf: [schema, { type: 'null' }] });
const str = { type: 'string' };
const int = { type: 'integer' };
const num = { type: 'number' };
const strList = { type: 'array', items: str };
const LEVELS = ['low', 'medium', 'high'] as const;

function obj(properties: Record<string, object>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}

export const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange'] as const;

/** Food categories the reader picks from (2-4 per wine), so pairings stay comparable and filterable. */
export const FOOD_PAIRINGS = [
  'Beef',
  'Lamb',
  'Pork',
  'Poultry',
  'Game',
  'Cured meats',
  'Lean fish',
  'Rich fish',
  'Shellfish',
  'Hard cheese',
  'Soft cheese',
  'Pasta & pizza',
  'Mushrooms',
  'Vegetarian',
  'Spicy food',
  'Dessert',
  'Aperitif & snacks',
] as const;
export type FoodPairing = (typeof FOOD_PAIRINGS)[number];

// Structured outputs allow at most 16 union-typed (anyOf) fields per request, so text and enum
// fields use "" for "unknown" and only numbers/objects that can be absent are nullable (12 unions).
const enumOrEmpty = (values: readonly string[]) => ({ type: 'string', enum: [...values, ''] });

export const wineAnalysisSchema = obj({
  is_wine_label: { type: 'boolean', description: 'False if the photos do not show a wine bottle or label.' },
  label: obj({
    producer: str,
    wine_name: str,
    vintage: nullable(int),
    country: str,
    country_code: { ...str, description: 'ISO 3166-1 alpha-2 code of the country, e.g. "IL", "FR", "GE". Empty if unknown.' },
    region: str,
    appellation: str,
    classification: { ...str, description: 'E.g. Reserve, Grand Cru, DOCG, Gran Reserva. Empty if none.' },
    wine_type: enumOrEmpty(WINE_TYPES),
    grape_varieties: {
      type: 'array',
      items: obj({
        grape: str,
        percent: { ...nullable(num), description: 'Share of the blend in %, or null if not printed or reliably known.' },
      }),
    },
    alcohol_percent: nullable(num),
    bottle_size_ml: nullable(int),
  }),
  profile: obj({
    body: enumOrEmpty(['light', 'medium', 'full']),
    sweetness: enumOrEmpty(['dry', 'off-dry', 'medium-sweet', 'sweet']),
    acidity: enumOrEmpty(LEVELS),
    tannin: enumOrEmpty(LEVELS),
    tasting_notes: strList,
    food_pairings: { type: 'array', items: { type: 'string', enum: [...FOOD_PAIRINGS] } },
    serving_temperature_c: nullable(obj({ min: num, max: num })),
    decant_minutes: nullable(int),
    best_time_to_open: obj({
      from_year: nullable(int),
      to_year: nullable(int),
      note: { ...str, description: 'One short sentence, e.g. "Drinks well 2026-2032; best 2028-2030; decant now." Empty if unknown.' },
    }),
    peak: nullable({
      ...obj({ from_year: int, to_year: int }),
      description: 'The narrower stretch when the wine is at its very best, inside best_time_to_open. Null if unknown.',
    }),
    expires_at: nullable(
      obj({
        year: int,
        source: { type: 'string', enum: ['label', 'estimate'] },
      }),
    ),
    typical_price_ils: nullable(num),
  }),
  taste_fit: nullable(
    obj({
      score: { ...int, description: '1 (unlikely to suit) to 5 (very likely to suit).' },
      reason: str,
    }),
  ),
  label_reading_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  notes: { ...str, description: 'What was unreadable or uncertain. Empty string if nothing.' },
});

type Level = (typeof LEVELS)[number] | '';

export interface WineAnalysis {
  is_wine_label: boolean;
  label: {
    producer: string;
    wine_name: string;
    vintage: number | null;
    country: string;
    country_code: string;
    region: string;
    appellation: string;
    classification: string;
    wine_type: (typeof WINE_TYPES)[number] | '';
    grape_varieties: { grape: string; percent: number | null }[];
    alcohol_percent: number | null;
    bottle_size_ml: number | null;
  };
  profile: {
    body: 'light' | 'medium' | 'full' | '';
    sweetness: 'dry' | 'off-dry' | 'medium-sweet' | 'sweet' | '';
    acidity: Level;
    tannin: Level;
    tasting_notes: string[];
    food_pairings: FoodPairing[];
    serving_temperature_c: { min: number; max: number } | null;
    decant_minutes: number | null;
    best_time_to_open: { from_year: number | null; to_year: number | null; note: string };
    peak: { from_year: number; to_year: number } | null;
    expires_at: { year: number; source: 'label' | 'estimate' } | null;
    typical_price_ils: number | null;
  };
  taste_fit: { score: number; reason: string } | null;
  label_reading_confidence: 'high' | 'medium' | 'low';
  notes: string;
}

/** Structured outputs can't express numeric ranges, so clamp the few that matter here. */
export function sanitize(a: WineAnalysis): WineAnalysis {
  const year = new Date().getFullYear();
  const okYear = (y: number | null) => (y != null && y >= 1800 && y <= year + 80 ? y : null);
  const l = a.label;
  l.vintage = l.vintage != null && l.vintage >= 1800 && l.vintage <= year + 1 ? l.vintage : null;
  if (l.alcohol_percent != null && (l.alcohol_percent < 3 || l.alcohol_percent > 25)) l.alcohol_percent = null;
  l.country_code = /^[A-Za-z]{2}$/.test(l.country_code.trim()) ? l.country_code.trim().toUpperCase() : '';
  l.grape_varieties = l.grape_varieties
    .map((g) => ({ grape: g.grape.trim(), percent: g.percent != null && g.percent > 0 && g.percent <= 100 ? g.percent : null }))
    .filter((g) => g.grape);
  // Percentages that add up to more than 100 are unreliable: keep the grapes, drop the numbers.
  if (l.grape_varieties.reduce((sum, g) => sum + (g.percent ?? 0), 0) > 101) l.grape_varieties.forEach((g) => (g.percent = null));
  const p = a.profile;
  const w = p.best_time_to_open;
  w.from_year = okYear(w.from_year);
  w.to_year = okYear(w.to_year);
  if (w.from_year != null && w.to_year != null && w.from_year > w.to_year) [w.from_year, w.to_year] = [w.to_year, w.from_year];
  if (w.from_year != null && l.vintage != null && w.from_year < l.vintage) w.from_year = l.vintage;
  if (p.expires_at && okYear(p.expires_at.year) == null) p.expires_at = null;
  // expires_at is the end of drinkability, so never before the end of the drinking window.
  if (p.expires_at && w.to_year != null && p.expires_at.year < w.to_year) p.expires_at.year = w.to_year;
  p.peak = sanitizePeak(p.peak, w.from_year, w.to_year, l.vintage);
  const t = p.serving_temperature_c;
  if (t && t.min > t.max) [t.min, t.max] = [t.max, t.min];
  if (p.decant_minutes != null && (p.decant_minutes < 0 || p.decant_minutes > 600)) p.decant_minutes = null;
  if (p.typical_price_ils != null && p.typical_price_ils <= 0) p.typical_price_ils = null;
  p.food_pairings = [...new Set(p.food_pairings)];
  if (a.taste_fit) a.taste_fit.score = Math.min(5, Math.max(1, Math.round(a.taste_fit.score)));
  return a;
}

/** Keeps the peak a valid range inside the drinking window (and never before the vintage). */
export function sanitizePeak(
  peak: { from_year: number; to_year: number } | null,
  windowFrom: number | null,
  windowTo: number | null,
  vintage: number | null,
): { from_year: number; to_year: number } | null {
  if (!peak) return null;
  const year = new Date().getFullYear();
  let { from_year: from, to_year: to } = peak;
  if (![from, to].every((y) => Number.isInteger(y) && y >= 1800 && y <= year + 80)) return null;
  if (from > to) [from, to] = [to, from];
  if (vintage != null) from = Math.max(from, vintage);
  if (windowFrom != null) from = Math.max(from, windowFrom);
  if (windowTo != null) to = Math.min(to, windowTo);
  return from <= to ? { from_year: from, to_year: to } : null;
}
