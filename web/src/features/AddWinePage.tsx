import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useUser } from '../auth/AuthProvider.tsx';
import { createWine, displayName, emptyWine, updateWine, useWines, type Wine, type WineFields } from '../data/wines.ts';
import { analysisToFields, analyzeLabel, callableErrorMessage, ratedWines, type AnalyzeResult } from '../lib/analysis.ts';
import { preparePhotos, type PreparedPhoto } from '../lib/images.ts';
import { takePendingPhotos } from '../lib/pendingPhotos.ts';
import { PageHeader } from '../ui/PageHeader.tsx';
import { WineForm } from './WineForm.tsx';

const MAX_PHOTOS = 3;
type Step = 'capture' | 'reading' | 'review';

const norm = (s: string) => s.trim().toLowerCase();

function findSameWine(wines: Wine[], f: WineFields): Wine | undefined {
  if (!f.producer && !f.wineName) return undefined;
  return wines.find(
    (w) => w.list !== 'wishlist' && norm(w.producer) === norm(f.producer) && norm(w.wineName) === norm(f.wineName) && w.vintage === f.vintage,
  );
}

export function AddWinePage() {
  const user = useUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [list, setList] = useState<'cellar' | 'wishlist'>(params.get('list') === 'wishlist' ? 'wishlist' : 'cellar');
  const { wines } = useWines(user.uid);

  const manual = params.get('manual') === '1';
  const [step, setStep] = useState<Step>(manual ? 'review' : 'capture');
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const analysis = result?.analysis ?? null;
  const [fields, setFields] = useState<WineFields>(() => emptyWine(list));
  const [saving, setSaving] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  // Free the preview images when leaving the page (not on every change: those previews are still on screen).
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    setPreparing(true);
    setError(null);
    try {
      const room = MAX_PHOTOS - photosRef.current.length;
      const prepared = await preparePhotos([...files].slice(0, room));
      setPhotos((p) => [...p, ...prepared].slice(0, MAX_PHOTOS));
    } catch {
      setError("Couldn't open that photo. Try another one.");
    } finally {
      setPreparing(false);
    }
  };

  // Photos chosen in the add menu (camera or library) arrive here.
  useEffect(() => {
    const files = takePendingPhotos();
    if (files.length) void addFiles(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const read = async () => {
    setStep('reading');
    setError(null);
    try {
      const r = await analyzeLabel(list, photos.map((p) => p.base64), ratedWines(wines ?? []));
      setResult(r);
      setFields(analysisToFields(r.analysis, list, r.model));
      setStep('review');
    } catch (err) {
      setError(callableErrorMessage(err));
      setStep('capture');
    }
  };

  const changeList = (l: 'cellar' | 'wishlist') => {
    setList(l);
    setFields((f) => ({ ...f, list: l, quantity: l === 'cellar' ? (f.quantity ?? 1) : null }));
  };

  const save = async () => {
    if (photos.length > 0 && !navigator.onLine) {
      setError("You're offline. Photos need a connection to upload. Try again with signal, or remove the photos to save the details now.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = await createWine(user.uid, { ...fields, list }, photos);
      navigate(`/wine/${id}`, { replace: true });
    } catch {
      setError("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  };

  const same = step === 'review' && list === 'cellar' && wines ? findSameWine(wines, fields) : undefined;
  const addToExisting = async (w: Wine) => {
    setSaving(true);
    await updateWine(user.uid, w.id, { quantity: (w.quantity ?? 0) + 1, list: 'cellar' });
    navigate(`/wine/${w.id}`, { replace: true });
  };

  return (
    <main className="mx-auto max-w-lg pb-36">
      <PageHeader
        title={step === 'review' ? (analysis ? 'Check the details' : 'Add a wine') : 'Scan a bottle'}
        back={list === 'wishlist' ? '/wishlist' : '/cellar'}
      />

      <div className="px-4">
        <div className="grid grid-cols-2 rounded-xl bg-cream-200 p-1 text-sm font-medium">
          {(['cellar', 'wishlist'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeList(l)}
              className={`rounded-lg py-1.5 ${list === l ? 'bg-white shadow-sm' : 'text-ink-500'}`}
            >
              {l === 'cellar' ? 'Cellar' : 'Wishlist'}
            </button>
          ))}
        </div>

        {/* Photo strip, shown in every step */}
        {photos.length > 0 && (
          <div className="mt-4 flex gap-2">
            {photos.map((p, i) => (
              <div key={p.previewUrl} className="relative">
                <img src={p.previewUrl} alt={`Photo ${i + 1}`} className="h-36 w-27 rounded-xl object-cover shadow-sm" />
                {step === 'capture' && (
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setPhotos((ps) => ps.filter((x) => x !== p))}
                    className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-ink-900 text-sm text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

        {step === 'capture' && (
          <div className="mt-5 flex flex-col gap-3">
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ''; }} />
            <input ref={libraryInput} type="file" accept="image/*" multiple hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ''; }} />

            {photos.length < MAX_PHOTOS && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={preparing}
                  onClick={() => cameraInput.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white py-6 font-medium ring-1 ring-ink-200 active:bg-cream-50 disabled:opacity-50"
                >
                  <span className="text-3xl">📷</span>
                  {photos.length === 0 ? 'Take photo' : 'Add back label'}
                </button>
                <button
                  type="button"
                  disabled={preparing}
                  onClick={() => libraryInput.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white py-6 font-medium ring-1 ring-ink-200 active:bg-cream-50 disabled:opacity-50"
                >
                  <span className="text-3xl">🖼️</span>
                  From photos
                </button>
              </div>
            )}
            <p className="text-center text-sm text-ink-500">
              {preparing
                ? 'Preparing photo…'
                : photos.length === 0
                  ? 'Photograph the front label. Adding the back label helps.'
                  : `${photos.length} of ${MAX_PHOTOS} photos`}
            </p>
          </div>
        )}

        {step === 'reading' && (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <div className="size-10 animate-spin rounded-full border-4 border-wine-100 border-t-wine-800" />
            <p className="font-serif text-lg">Reading the label…</p>
            <p className="text-sm text-ink-500">Usually takes a few seconds.</p>
          </div>
        )}

        {step === 'review' && (
          <div className="mt-4 flex flex-col gap-3">
            {analysis && !analysis.is_wine_label && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This doesn't look like a wine label. {analysis.notes}</p>
            )}
            {analysis?.is_wine_label && (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/70">
                <p className="font-serif text-xl font-semibold">
                  {displayName(fields)} {fields.vintage ?? ''}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Label read with <b>{analysis.label_reading_confidence}</b> confidence.
                  {analysis.notes ? ` ${analysis.notes}` : ''}
                </p>
                {result && (
                  <p className="mt-2 text-xs text-ink-500">
                    Read by {result.model} in {(result.ms / 1000).toFixed(1)}s
                  </p>
                )}
                {analysis.taste_fit && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold text-wine-800">Taste fit {analysis.taste_fit.score}/5.</span> {analysis.taste_fit.reason}
                  </p>
                )}
              </div>
            )}
            {same && (
              <div className="rounded-2xl bg-wine-50 p-4 text-sm">
                <p>
                  <b>{displayName(same)} {same.vintage ?? ''}</b> is already in your {same.list === 'finished' ? 'finished list' : 'cellar'}
                  {same.quantity ? ` (×${same.quantity})` : ''}.
                </p>
                <button type="button" disabled={saving} onClick={() => addToExisting(same)} className="mt-2 font-semibold text-wine-800 underline">
                  Add one more bottle to it instead
                </button>
              </div>
            )}
            <WineForm value={fields} onChange={setFields} fromAi={analysis != null} />
          </div>
        )}
      </div>

      {(step === 'review' || (step === 'capture' && photos.length > 0)) && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-cream-50/95 px-4 pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-lg gap-3">
            {step === 'capture' ? (
              <button type="button" onClick={() => read()} disabled={preparing} className="flex-1 rounded-2xl bg-wine-800 py-3.5 font-semibold text-white active:bg-wine-900 disabled:opacity-50">
                Read label
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setStep('capture')} disabled={saving} className="rounded-2xl px-4 py-3.5 font-medium text-ink-700 ring-1 ring-ink-200">
                  Photos
                </button>
                <button type="button" onClick={save} disabled={saving} className="flex-1 rounded-2xl bg-wine-800 py-3.5 font-semibold text-white active:bg-wine-900 disabled:opacity-50">
                  {saving ? 'Saving…' : list === 'cellar' ? 'Add to cellar' : 'Add to wishlist'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
