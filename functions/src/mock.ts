import type { WineAnalysis } from './schema.js';

/** Canned answer for the local emulator (AI_MOCK=true), so the app runs without an API key. */
export function mockAnalysis(hasRatings: boolean): WineAnalysis {
  const year = new Date().getFullYear();
  return {
    is_wine_label: true,
    label: {
      producer: 'Demo Winery',
      wine_name: 'Mock Reserve',
      vintage: year - 4,
      country: 'Israel',
      country_code: 'IL',
      region: 'Judean Hills',
      appellation: '',
      classification: 'Reserve',
      wine_type: 'red',
      grape_varieties: [
        { grape: 'Cabernet Sauvignon', percent: 70 },
        { grape: 'Merlot', percent: 30 },
      ],
      alcohol_percent: 14,
      bottle_size_ml: 750,
    },
    profile: {
      body: 'full',
      sweetness: 'dry',
      acidity: 'medium',
      tannin: 'high',
      tasting_notes: ['blackcurrant', 'cedar', 'dark chocolate'],
      food_pairings: ['Lamb', 'Beef', 'Hard cheese'],
      serving_temperature_c: { min: 16, max: 18 },
      decant_minutes: 45,
      best_time_to_open: { from_year: year, to_year: year + 6, note: 'Drinking well now after an hour in a decanter.' },
      peak: { from_year: year + 1, to_year: year + 3 },
      expires_at: { year: year + 9, source: 'estimate' },
      typical_price_ils: 160,
    },
    taste_fit: hasRatings ? { score: 4, reason: 'Close to the full-bodied reds you rated highly.' } : null,
    label_reading_confidence: 'high',
    notes: 'MOCK RESPONSE: the emulator is running with AI_MOCK=true, so no photo was read.',
  };
}
