import { HttpsError } from 'firebase-functions/v2/https';
import type { RatedWine } from './prompt.js';
import type { WineAnalysis } from './schema.js';

export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
const MAX_IMAGES = 3;
const MAX_IMAGE_B64 = 6_000_000; // ~4.5 MB decoded per photo; the app sends ~300 KB JPEGs
const MAX_RATED = 40;

export interface AnalyzeRequest {
  list: 'cellar' | 'wishlist';
  images: { mediaType: MediaType; data: string }[];
  rated: RatedWine[];
}

/** What both readers return to the app. */
export interface AnalyzeResponse {
  analysis: WineAnalysis;
  model: string;
  ms: number;
}

export const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

export function parseRequest(data: unknown): AnalyzeRequest {
  const d = (data ?? {}) as Record<string, unknown>;
  const list = d.list === 'wishlist' ? 'wishlist' : 'cellar';
  const images = Array.isArray(d.images) ? d.images : [];
  if (images.length < 1 || images.length > MAX_IMAGES) {
    throw new HttpsError('invalid-argument', `Send between 1 and ${MAX_IMAGES} photos.`);
  }
  const parsedImages = images.map((img) => {
    const i = (img ?? {}) as Record<string, unknown>;
    if (!MEDIA_TYPES.includes(i.mediaType as MediaType) || typeof i.data !== 'string' || i.data.length > MAX_IMAGE_B64) {
      throw new HttpsError('invalid-argument', 'Each photo must be a JPEG, PNG or WebP under 4 MB.');
    }
    return { mediaType: i.mediaType as MediaType, data: i.data };
  });
  const rated = (Array.isArray(d.rated) ? d.rated : [])
    .slice(0, MAX_RATED)
    .filter((w): w is RatedWine => typeof w?.name === 'string' && typeof w?.rating === 'number')
    .map((w) => ({
      name: w.name.slice(0, 120),
      type: typeof w.type === 'string' ? w.type.slice(0, 20) : null,
      grapes: Array.isArray(w.grapes) ? w.grapes.filter((g) => typeof g === 'string').slice(0, 6).map((g) => g.slice(0, 40)) : [],
      region: typeof w.region === 'string' ? w.region.slice(0, 60) : null,
      rating: Math.min(5, Math.max(1, Math.round(w.rating))),
    }));
  return { list, images: parsedImages, rated };
}

export function checkCaller(
  auth: { token: { email?: string; email_verified?: boolean } } | undefined,
  allowedEmails: string,
) {
  if (!auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  if (isEmulator) return;
  const allowed = allowedEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) {
    throw new HttpsError('failed-precondition', 'ALLOWED_EMAILS is not set on the server.');
  }
  const email = auth.token.email?.toLowerCase();
  if (!email || !auth.token.email_verified || !allowed.includes(email)) {
    throw new HttpsError('permission-denied', 'This account is not allowed to scan labels.');
  }
}
