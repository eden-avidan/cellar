// Adds a peak estimate to a wine that was saved before the scan answer included one.
// Text only (no photos): the stored label facts and drinking window are enough, so it costs
// a fraction of a scan. Only the peak is written; the user's other fields stay as they are.

import Anthropic from '@anthropic-ai/sdk';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { sanitizePeak } from './schema.js';

export const peakSchema = {
  type: 'object',
  properties: {
    peak: {
      anyOf: [
        {
          type: 'object',
          properties: { from_year: { type: 'integer' }, to_year: { type: 'integer' } },
          required: ['from_year', 'to_year'],
          additionalProperties: false,
        },
        { type: 'null' },
      ],
    },
  },
  required: ['peak'],
  additionalProperties: false,
};

export const PEAK_PROMPT = `You are a sommelier. For the wine below, estimate its peak: the stretch of years when it is at its very best (fruit, structure and development in balance). The peak lies inside the drinking window when one is given, and never before the vintage. For simple wines made to drink within a year or two of release, give a short peak of one to two years near the start of the window; for wines with ageing potential, wherever in the window it truly peaks. Use null only if you have no sensible estimate (for example, no vintage and a wine you don't know).`;

export interface PeakResult {
  peak: { from_year: number; to_year: number } | null;
}

/** Exported for local dry runs. */
export function describe(d: Record<string, unknown>): string {
  const grapes = Array.isArray(d.grapes)
    ? d.grapes.map((g) => (typeof g === 'string' ? g : `${(g as { grape: string }).grape}${(g as { percent: number | null }).percent ? ` ${(g as { percent: number }).percent}%` : ''}`)).join(', ')
    : '';
  const lines = [
    `Current year: ${new Date().getFullYear()}.`,
    `Wine: ${[d.producer, d.wineName].filter(Boolean).join(' ')}`,
    d.vintage ? `Vintage: ${d.vintage}` : 'Vintage: unknown',
    d.wineType && `Type: ${d.wineType}`,
    [d.region, d.country].some(Boolean) && `Region: ${[d.region, d.country].filter(Boolean).join(', ')}`,
    grapes && `Grapes: ${grapes}`,
    d.classification && `Classification: ${d.classification}`,
    d.body && `Body: ${d.body}`,
    d.drinkFrom || d.drinkUntil ? `Drinking window: ${d.drinkFrom ?? '?'}-${d.drinkUntil ?? '?'}` : null,
    d.expiresYear && `Past its prime after: ${d.expiresYear}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export async function estimatePeak(
  uid: string,
  wineId: string,
  opts: { apiKey: string; model: string; mock: boolean },
): Promise<PeakResult> {
  const ref = getFirestore().doc(`users/${uid}/wines/${wineId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'That wine was not found.');
  const d = snap.data() as Record<string, unknown>;
  if (!d.producer && !d.wineName) throw new HttpsError('failed-precondition', 'Add the producer or wine name first.');
  const num = (v: unknown) => (typeof v === 'number' ? v : null);

  let raw: PeakResult['peak'];
  if (opts.mock) {
    const y = new Date().getFullYear();
    raw = { from_year: y + 1, to_year: y + 3 };
  } else {
    const client = new Anthropic({ apiKey: opts.apiKey, timeout: 60_000, maxRetries: 1 });
    const res = await client.beta.messages.create({
      model: opts.model,
      max_tokens: 2000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: peakSchema } },
      system: PEAK_PROMPT,
      messages: [{ role: 'user', content: describe(d) }],
    });
    logger.info('peak', { stop: res.stop_reason, inTok: res.usage.input_tokens, outTok: res.usage.output_tokens });
    const text = res.content.find((b) => b.type === 'text');
    if (res.stop_reason !== 'end_turn' || !text || text.type !== 'text') {
      throw new HttpsError('internal', 'Could not estimate the peak.');
    }
    raw = (JSON.parse(text.text) as PeakResult).peak;
  }

  const peak = sanitizePeak(raw, num(d.drinkFrom), num(d.drinkUntil), num(d.vintage));
  const update: Record<string, unknown> = {
    peakFrom: peak?.from_year ?? null,
    peakTo: peak?.to_year ?? null,
    peakEstimatedAt: new Date().toISOString(),
  };
  // Keep the stored scan answer in step, so "Reset to scanned values" brings the peak back too.
  if (d.scan && typeof d.scan === 'object') update['scan.analysis.profile.peak'] = peak;
  await ref.update(update);
  return { peak };
}
