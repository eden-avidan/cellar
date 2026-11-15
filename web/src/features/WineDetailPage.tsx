import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useUser } from '../auth/AuthProvider.tsx';
import { addPhotos, averageRating, deleteWine, displayName, removePhoto, removeTasting, updateWine, useWine, grapesText, type Wine } from '../data/wines.ts';
import { drinkStatus, toneClass } from '../lib/drink.ts';
import { preparePhotos } from '../lib/images.ts';
import { PageHeader } from '../ui/PageHeader.tsx';
import { Stars } from '../ui/Stars.tsx';
import { BottleArt, typeColor } from '../ui/WineCard.tsx';
import { TastingSheet } from './TastingSheet.tsx';

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/70">
      <h2 className="mb-2 font-serif text-lg font-semibold">
        {title}
        {hint && <span className="ml-2 font-sans text-xs font-normal text-ink-500">{hint}</span>}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-ink-200/60 py-1.5 text-sm last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="text-right first-letter:uppercase">{value}</span>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full bg-cream-200 px-2.5 py-1 text-sm text-ink-700">
          {t}
        </span>
      ))}
    </div>
  );
}

const range = (a: number | null, b: number | null, unit = '') =>
  a == null && b == null ? null : a != null && b != null && a !== b ? `${a}–${b}${unit}` : `${a ?? b}${unit}`;

export function WineDetailPage() {
  const { id = '' } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const wine = useWine(user.uid, id);
  return (
    <>
      {wine === undefined && <p className="py-20 text-center text-ink-500">Loading…</p>}
      {wine === null && (
        <div className="py-20 text-center text-ink-500">
          <p>This wine is gone.</p>
          <button type="button" className="mt-3 text-wine-800 underline" onClick={() => navigate('/cellar')}>
            Back to the cellar
          </button>
        </div>
      )}
      {wine && <WineDetail uid={user.uid} wine={wine} />}
    </>
  );
}

function WineDetail({ uid, wine }: { uid: string; wine: Wine }) {
  const navigate = useNavigate();
  const [tasting, setTasting] = useState<null | 'open' | 'rate'>(null);
  const [busy, setBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const status = wine.list === 'cellar' ? drinkStatus(wine) : null;
  const avg = averageRating(wine);
  const backTo = wine.list === 'wishlist' ? '/wishlist' : '/cellar';

  const run = async (fn: () => unknown) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const onAddPhotos = (files: FileList | null) =>
    files?.length && run(async () => addPhotos(uid, wine, await preparePhotos([...files].slice(0, 3))));

  const onDelete = () => {
    if (!confirm(`Delete ${displayName(wine)} and its photos? This can't be undone.`)) return;
    void run(async () => {
      await deleteWine(uid, wine);
      navigate(backTo, { replace: true });
    });
  };

  const btn = 'flex-1 rounded-2xl py-3 font-semibold disabled:opacity-50';
  const primary = `${btn} bg-wine-800 text-white active:bg-wine-900`;
  const secondary = `${btn} bg-white text-wine-800 ring-1 ring-wine-200 active:bg-wine-50`;

  return (
    <main className="mx-auto max-w-lg pb-16">
      <PageHeader
        back={backTo}
        right={
          <Link to={`/wine/${wine.id}/edit`} className="rounded-full px-3 py-1 font-medium text-wine-800 active:bg-cream-200">
            Edit
          </Link>
        }
      />

      {/* Photos */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4">
        {wine.photos.length === 0 && <BottleArt type={wine.wineType} className="h-64 w-full rounded-2xl" />}
        {wine.photos.map((p) => (
          <div key={p.path} className="relative shrink-0 snap-center">
            <img src={p.url} alt="" className="h-72 max-w-[85vw] rounded-2xl object-cover shadow-sm" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => confirm('Remove this photo?') && run(() => removePhoto(uid, wine, p))}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-ink-900/60 text-white"
            >
              ✕
            </button>
          </div>
        ))}
        {wine.photos.length < 6 && (
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            disabled={busy}
            className="grid h-72 w-28 shrink-0 place-items-center rounded-2xl bg-white text-sm text-ink-500 ring-1 ring-ink-200"
          >
            + Photo
          </button>
        )}
        <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={(e) => { void onAddPhotos(e.target.files); e.target.value = ''; }} />
      </div>

      <div className="mt-4 flex flex-col gap-3 px-4">
        {/* Title */}
        <div>
          <h1 className="font-serif text-3xl leading-tight font-semibold text-wine-900">{displayName(wine)}</h1>
          <p className="mt-1 text-ink-500">
            {[wine.vintage, wine.classification, [wine.region, wine.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {wine.wineType && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm capitalize ring-1 ring-ink-200">
                <span className="size-2.5 rounded-full" style={{ background: typeColor[wine.wineType] }} />
                {wine.wineType}
              </span>
            )}
            {status && <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${toneClass[status.tone]}`}>{status.label}</span>}
            {wine.list === 'finished' && <span className="rounded-full bg-ink-200 px-2.5 py-1 text-sm">Finished</span>}
            {wine.list === 'wishlist' && <span className="rounded-full bg-wine-50 px-2.5 py-1 text-sm text-wine-800">Wishlist</span>}
            {avg != null && (
              <span className="flex items-center gap-1 text-sm text-ink-700">
                <Stars value={avg} /> {avg.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {wine.list === 'cellar' && (
          <>
            <div className="flex gap-2">
              <button type="button" className={primary} onClick={() => setTasting('open')}>
                Open a bottle
              </button>
              <button type="button" className={secondary} onClick={() => setTasting('rate')}>
                Rate
              </button>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 ring-1 ring-ink-200/70">
              <span className="text-sm text-ink-700">Bottles in the cellar</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="One bottle fewer"
                  disabled={busy || !wine.quantity}
                  onClick={() => run(() => updateWine(uid, wine.id, { quantity: Math.max(0, (wine.quantity ?? 1) - 1) }))}
                  className="grid size-9 place-items-center rounded-full bg-cream-200 text-xl disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center text-lg font-semibold">{wine.quantity ?? '–'}</span>
                <button
                  type="button"
                  aria-label="One bottle more"
                  disabled={busy}
                  onClick={() => run(() => updateWine(uid, wine.id, { quantity: (wine.quantity ?? 0) + 1 }))}
                  className="grid size-9 place-items-center rounded-full bg-cream-200 text-xl"
                >
                  +
                </button>
              </div>
            </div>
          </>
        )}
        {wine.list === 'wishlist' && (
          <div className="flex gap-2">
            <button
              type="button"
              className={primary}
              disabled={busy}
              onClick={() => run(() => updateWine(uid, wine.id, { list: 'cellar', quantity: 1 }))}
            >
              Bought it → cellar
            </button>
            <button type="button" className={secondary} onClick={() => setTasting('rate')}>
              Rate
            </button>
          </div>
        )}
        {wine.list === 'finished' && (
          <div className="flex gap-2">
            <button
              type="button"
              className={secondary}
              disabled={busy}
              onClick={() => run(() => updateWine(uid, wine.id, { list: 'cellar', quantity: 1 }))}
            >
              Bought more
            </button>
            <button type="button" className={primary} onClick={() => setTasting('rate')}>
              Rate
            </button>
          </div>
        )}

        {/* When to drink */}
        {(wine.drinkFrom || wine.drinkUntil || wine.drinkNote || wine.expiresYear) && (
          <Card title="When to drink">
            {wine.drinkNote && <p className="mb-2 text-[15px]">{wine.drinkNote}</p>}
            <Row label="Best time to open" value={range(wine.drinkFrom, wine.drinkUntil)} />
            <Row
              label="Expires"
              value={wine.expiresYear ? `${wine.expiresYear}${wine.expiresSource === 'label' ? ' (on label)' : wine.expiresSource === 'estimate' ? ' (estimate)' : ''}` : null}
            />
          </Card>
        )}

        {/* Taste fit */}
        {wine.tasteFitScore != null && (
          <Card title={`Taste fit ${wine.tasteFitScore}/5`}>
            <p className="text-[15px]">{wine.tasteFitReason}</p>
          </Card>
        )}

        {/* Style & serving */}
        <Card title="Style & serving">
          <Tags items={wine.tastingNotes} />
          <div className="mt-2">
            <Row label="Body" value={wine.body} />
            <Row label="Sweetness" value={wine.sweetness} />
            <Row label="Acidity" value={wine.acidity} />
            <Row label="Tannin" value={wine.tannin} />
            <Row label="Serve at" value={range(wine.servingTempMin, wine.servingTempMax, '°C')} />
            <Row label="Decant" value={wine.decantMinutes ? `${wine.decantMinutes} min` : wine.decantMinutes === 0 ? 'Not needed' : null} />
            <Row label="Typical price" value={wine.typicalPriceIls != null ? `~₪${Math.round(wine.typicalPriceIls)}` : null} />
          </div>
          {wine.foodPairings.length > 0 && (
            <>
              <p className="mt-3 mb-1.5 text-xs font-medium text-ink-500">Goes with</p>
              <Tags items={wine.foodPairings} />
            </>
          )}
        </Card>

        {/* Label facts */}
        <Card title="From the label">
          <Row label="Producer" value={wine.producer} />
          <Row label="Wine" value={wine.wineName} />
          <Row label="Vintage" value={wine.vintage} />
          <Row label="Grapes" value={grapesText(wine.grapes)} />
          <Row label="Appellation" value={wine.appellation} />
          <Row label="Alcohol" value={wine.alcohol != null ? `${wine.alcohol}%` : null} />
          <Row label="Bottle" value={wine.bottleSizeMl ? `${wine.bottleSizeMl} ml` : null} />
          {(wine.aiNotes || wine.aiModel) && (
            <p className="mt-2 text-xs text-ink-500">
              {wine.aiModel && <>Read by {wine.aiModel}. </>}
              {wine.aiNotes}
            </p>
          )}
          {wine.scan && (
            <details className="mt-2 text-xs text-ink-500">
              <summary className="cursor-pointer">
                Original scan ({wine.scan.model}, {(wine.scan.ms / 1000).toFixed(1)}s, {wine.scan.scannedAt.slice(0, 10)})
              </summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-cream-100 p-2 text-[11px] leading-snug whitespace-pre-wrap">
                {JSON.stringify(wine.scan.analysis, null, 2)}
              </pre>
            </details>
          )}
        </Card>

        {/* Yours */}
        {(wine.location || wine.pricePaid != null || wine.boughtAt || wine.purchaseDate || wine.notes) && (
          <Card title="Your details">
            <Row label="Storage spot" value={wine.location} />
            <Row label="Price paid" value={wine.pricePaid != null ? `₪${wine.pricePaid}` : null} />
            <Row label="Bought at" value={wine.boughtAt} />
            <Row label="Purchase date" value={wine.purchaseDate} />
            {wine.notes && <p className="mt-2 text-[15px] whitespace-pre-wrap">{wine.notes}</p>}
          </Card>
        )}

        {/* Tastings */}
        <Card title="Tastings" hint={wine.tastings.length ? `${wine.tastings.length}` : undefined}>
          {wine.tastings.length === 0 && <p className="text-sm text-ink-500">Not rated yet. After you taste it, tap Rate.</p>}
          <ul className="flex flex-col gap-3">
            {[...wine.tastings].reverse().map((t) => (
              <li key={t.id} className="border-b border-ink-200/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Stars value={t.rating} />
                    <span className="text-sm text-ink-500">{t.date}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => confirm('Delete this tasting?') && run(() => removeTasting(uid, wine, t.id))}
                    className="text-xs text-ink-500"
                  >
                    Delete
                  </button>
                </div>
                {t.notes && <p className="mt-1 text-[15px] whitespace-pre-wrap">{t.notes}</p>}
              </li>
            ))}
          </ul>
        </Card>

        <button type="button" onClick={onDelete} disabled={busy} className="mt-4 py-3 text-sm font-medium text-rose-700">
          Delete wine
        </button>
      </div>

      {tasting && <TastingSheet uid={uid} wine={wine} openingBottle={tasting === 'open'} onClose={() => setTasting(null)} />}
    </main>
  );
}
