import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';

import { initializeApp } from 'firebase-admin/app';

import { analyzeWithClaude } from './claude.js';
import { findCleanPhoto as runFindCleanPhoto } from './cleanPhoto.js';
import { checkCaller, isEmulator, parseRequest, type AnalyzeResponse } from './common.js';
import { mockAnalysis } from './mock.js';
import { estimatePeak as runEstimatePeak } from './peak.js';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 3 });

// Comma-separated Google accounts allowed to spend the API key. Required in production.
const ALLOWED_EMAILS = defineString('ALLOWED_EMAILS', { default: '' });
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
// Model and effort are params so they can be changed without a code edit (functions/.env.<project>).
const CLAUDE_MODEL = defineString('CLAUDE_MODEL', { default: 'claude-opus-5-5' });
const CLAUDE_EFFORT = defineString('CLAUDE_EFFORT', { default: 'low' });

export const analyzeLabel = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 240, memory: '512MiB' },
  async (request): Promise<AnalyzeResponse> => {
    checkCaller(request.auth, ALLOWED_EMAILS.value());
    const req = parseRequest(request.data);
    if (isEmulator && process.env.AI_MOCK === 'true') {
      await new Promise((r) => setTimeout(r, 800));
      return { analysis: mockAnalysis(req.rated.length > 0), model: 'mock-claude', ms: 800 };
    }
    return analyzeWithClaude(req, ANTHROPIC_API_KEY.value(), CLAUDE_MODEL.value(), CLAUDE_EFFORT.value());
  },
);

/** Finds a clean product photo of the wine online and puts it first. See cleanPhoto.ts. */
export const findCleanPhoto = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 300, memory: '1GiB' },
  async (request) => {
    checkCaller(request.auth, ALLOWED_EMAILS.value());
    const { wineId, onlyIfMissing } = (request.data ?? {}) as { wineId?: unknown; onlyIfMissing?: unknown };
    if (typeof wineId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(wineId)) {
      throw new HttpsError('invalid-argument', 'Missing wine id.');
    }
    return runFindCleanPhoto(request.auth!.uid, wineId, {
      apiKey: isEmulator && process.env.AI_MOCK === 'true' ? '' : ANTHROPIC_API_KEY.value(),
      model: CLAUDE_MODEL.value(),
      mock: isEmulator && process.env.AI_MOCK === 'true',
      onlyIfMissing: onlyIfMissing === true,
    });
  },
);

/** Adds a peak estimate to a wine saved before scans included one (text only, no photos). */
export const estimatePeak = onCall({ secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 90 }, async (request) => {
  checkCaller(request.auth, ALLOWED_EMAILS.value());
  const wineId = (request.data as { wineId?: unknown })?.wineId;
  if (typeof wineId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(wineId)) {
    throw new HttpsError('invalid-argument', 'Missing wine id.');
  }
  const mock = isEmulator && process.env.AI_MOCK === 'true';
  return runEstimatePeak(request.auth!.uid, wineId, {
    apiKey: mock ? '' : ANTHROPIC_API_KEY.value(),
    model: CLAUDE_MODEL.value(),
    mock,
  });
});
