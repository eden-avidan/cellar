// The JSON shape Claude must return for a wine label. Sent as a structured-output schema, so the
// response is guaranteed to parse into WineAnalysis. Keep in sync with web/src/lib/analysis.ts.

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

// Structured outputs allow at most 16 union-typed (anyOf) fields per request, so text and enum
// fields use "" for "unknown" and only numbers/objects that can be absent are nullable (10 unions).
const enumOrEmpty = (values: readonly string[]) => ({ type: 'string', enum: [...values, ''] });

export const wineAnalysisSchema = obj({
  is_wine_label: { type: 'boolean', description: 'False if the photos do not show a wine bottle or label.' },
  label: obj({
    producer: str,
    wine_name: str,
    vintage: nullable(int),
    country: str,
    region: str,
    appellation: str,
    classification: { ...str, description: 'E.g. Reserve, Grand Cru, DOCG, Gran Reserva. Empty if none.' },
    wine_type: enumOrEmpty(WINE_TYPES),
    grape_varieties: strList,
    alcohol_percent: nullable(num),
    bottle_size_ml: nullable(int),
  }),
  profile: obj({
    body: enumOrEmpty(['light', 'medium', 'full']),
    sweetness: enumOrEmpty(['dry', 'off-dry', 'medium-sweet', 'sweet']),
    acidity: enumOrEmpty(LEVELS),
    tannin: enumOrEmpty(LEVELS),
    tasting_notes: strList,
    food_pairings: strList,
    serving_temperature_c: nullable(obj({ min: num, max: num })),
    decant_minutes: nullable(int),
    best_time_to_open: obj({
      from_year: nullable(int),
      to_year: nullable(int),
      note: { ...str, description: 'One short sentence, e.g. "Peak drinking 2027-2031; fine now after decanting." Empty if unknown.' },
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
    region: string;
    appellation: string;
    classification: string;
    wine_type: (typeof WINE_TYPES)[number] | '';
    grape_varieties: string[];
    alcohol_percent: number | null;
    bottle_size_ml: number | null;
  };
  profile: {
    body: 'light' | 'medium' | 'full' | '';
    sweetness: 'dry' | 'off-dry' | 'medium-sweet' | 'sweet' | '';
    acidity: Level;
    tannin: Level;
    tasting_notes: string[];
    food_pairings: string[];
    serving_temperature_c: { min: number; max: number } | null;
    decant_minutes: number | null;
    best_time_to_open: { from_year: number | null; to_year: number | null; note: string };
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
  const p = a.profile;
  const w = p.best_time_to_open;
  w.from_year = okYear(w.from_year);
  w.to_year = okYear(w.to_year);
  if (w.from_year != null && w.to_year != null && w.from_year > w.to_year) [w.from_year, w.to_year] = [w.to_year, w.from_year];
  if (w.from_year != null && l.vintage != null && w.from_year < l.vintage) w.from_year = l.vintage;
  if (p.expires_at && okYear(p.expires_at.year) == null) p.expires_at = null;
  // expires_at is the end of drinkability, so never before the end of the peak window.
  if (p.expires_at && w.to_year != null && p.expires_at.year < w.to_year) p.expires_at.year = w.to_year;
  const t = p.serving_temperature_c;
  if (t && t.min > t.max) [t.min, t.max] = [t.max, t.min];
  if (p.decant_minutes != null && (p.decant_minutes < 0 || p.decant_minutes > 600)) p.decant_minutes = null;
  if (p.typical_price_ils != null && p.typical_price_ils <= 0) p.typical_price_ils = null;
  if (a.taste_fit) a.taste_fit.score = Math.min(5, Math.max(1, Math.round(a.taste_fit.score)));
  return a;
}
