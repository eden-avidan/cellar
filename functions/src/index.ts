import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';

import { analyzeWithClaude } from './claude.js';
import { checkCaller, isEmulator, parseRequest, type AnalyzeResponse } from './common.js';
import { mockAnalysis } from './mock.js';

setGlobalOptions({ region: 'europe-west1', maxInstances: 3 });

// Comma-separated Google accounts allowed to spend the API key. Required in production.
const ALLOWED_EMAILS = defineString('ALLOWED_EMAILS', { default: '' });
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
// Model and effort are params so they can be changed without a code edit (functions/.env.<project>).
const CLAUDE_MODEL = defineString('CLAUDE_MODEL', { default: 'claude-opus-5-5' });
const CLAUDE_EFFORT = defineString('CLAUDE_EFFORT', { default: 'low' });

export const analyzeLabel = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB' },
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
