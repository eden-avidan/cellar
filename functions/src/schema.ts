// The JSON shape Claude must return for a wine label. Sent as a structured-output schema, so the
// response is guaranteed to parse into WineAnalysis. Keep in sync with web/src/lib/analysis.ts.

const nullable = (schema: object) => ({ anyOf: [schema, { type: 'null' }] });
const str = { type: 'string' };
const int = { type: 'integer' };
const num = { type: 'number' };
const strList = { type: 'array', items: str };
const level = { type: 'string', enum: ['low', 'medium', 'high'] };

function obj(properties: Record<string, object>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}

export const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange'] as const;

export const wineAnalysisSchema = obj({
  is_wine_label: { type: 'boolean', description: 'False if the photos do not show a wine bottle or label.' },
  label: obj({
    producer: nullable(str),
    wine_name: nullable(str),
    vintage: nullable(int),
    country: nullable(str),
    region: nullable(str),
    appellation: nullable(str),
    classification: nullable({ ...str, description: 'E.g. Reserve, Grand Cru, DOCG, Gran Reserva.' }),
    wine_type: nullable({ type: 'string', enum: [...WINE_TYPES] }),
    grape_varieties: strList,
    alcohol_percent: nullable(num),
    bottle_size_ml: nullable(int),
  }),
  profile: obj({
    body: nullable({ type: 'string', enum: ['light', 'medium', 'full'] }),
    sweetness: nullable({ type: 'string', enum: ['dry', 'off-dry', 'medium-sweet', 'sweet'] }),
    acidity: nullable(level),
    tannin: nullable(level),
    tasting_notes: strList,
    food_pairings: strList,
    serving_temperature_c: nullable(obj({ min: num, max: num })),
    decant_minutes: nullable(int),
    best_time_to_open: nullable(
      obj({
        from_year: nullable(int),
        to_year: nullable(int),
        note: { ...str, description: 'One short sentence, e.g. "Peak drinking 2027-2031; fine now after decanting."' },
      }),
    ),
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

type Level = 'low' | 'medium' | 'high';

export interface WineAnalysis {
  is_wine_label: boolean;
  label: {
    producer: string | null;
    wine_name: string | null;
    vintage: number | null;
    country: string | null;
    region: string | null;
    appellation: string | null;
    classification: string | null;
    wine_type: (typeof WINE_TYPES)[number] | null;
    grape_varieties: string[];
    alcohol_percent: number | null;
    bottle_size_ml: number | null;
  };
  profile: {
    body: 'light' | 'medium' | 'full' | null;
    sweetness: 'dry' | 'off-dry' | 'medium-sweet' | 'sweet' | null;
    acidity: Level | null;
    tannin: Level | null;
    tasting_notes: string[];
    food_pairings: string[];
    serving_temperature_c: { min: number; max: number } | null;
    decant_minutes: number | null;
    best_time_to_open: { from_year: number | null; to_year: number | null; note: string } | null;
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
  if (p.best_time_to_open) {
    p.best_time_to_open.from_year = okYear(p.best_time_to_open.from_year);
    p.best_time_to_open.to_year = okYear(p.best_time_to_open.to_year);
  }
  if (p.expires_at && okYear(p.expires_at.year) == null) p.expires_at = null;
  if (p.decant_minutes != null && (p.decant_minutes < 0 || p.decant_minutes > 600)) p.decant_minutes = null;
  if (a.taste_fit) a.taste_fit.score = Math.min(5, Math.max(1, Math.round(a.taste_fit.score)));
  return a;
}
