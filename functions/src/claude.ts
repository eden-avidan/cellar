import Anthropic from '@anthropic-ai/sdk';
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { AnalyzeRequest, AnalyzeResponse } from './common.js';
import { SYSTEM_PROMPT, userText } from './prompt.js';
import { sanitize, wineAnalysisSchema, type WineAnalysis } from './schema.js';

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export async function analyzeWithClaude(req: AnalyzeRequest, apiKey: string, model: string, effort: string): Promise<AnalyzeResponse> {
  const client = new Anthropic({ apiKey, timeout: 100_000, maxRetries: 1 });
  const started = Date.now();
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      // If a safety classifier declines (rare false positive), the API retries on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: effort as Effort,
        format: { type: 'json_schema', schema: wineAnalysisSchema },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...req.images.map((img) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
            })),
            { type: 'text' as const, text: userText(req) },
          ],
        },
      ],
    });
    const ms = Date.now() - started;
    logger.info('claude', { model: response.model, ms, stop: response.stop_reason, inTok: response.usage.input_tokens, outTok: response.usage.output_tokens });

    if (response.stop_reason === 'refusal') {
      throw new HttpsError('aborted', 'The model declined to read this photo. Try another photo.');
    }
    if (response.stop_reason === 'max_tokens') {
      throw new HttpsError('internal', 'The answer was cut off. Try again.');
    }
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new HttpsError('internal', 'No answer from the model.');
    return { analysis: sanitize(JSON.parse(text.text) as WineAnalysis), model: response.model, ms };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      logger.error('Anthropic key rejected');
      throw new HttpsError('failed-precondition', 'The server Claude API key is invalid.');
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new HttpsError('resource-exhausted', 'Too many scans right now. Wait a minute and retry.');
    }
    if (err instanceof Anthropic.APIError) {
      logger.error('Anthropic API error', { status: err.status, message: err.message });
      throw new HttpsError('unavailable', 'Claude is unavailable right now. Try again shortly.');
    }
    logger.error('claude failed', err);
    throw new HttpsError('internal', 'Could not read the label.');
  }
}
