import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase.ts';

const callable = httpsCallable<{ wineId: string }, { peak: { from_year: number; to_year: number } | null }>(functions, 'estimatePeak', {
  timeout: 100_000,
});

export async function estimatePeak(wineId: string) {
  return (await callable({ wineId })).data;
}
