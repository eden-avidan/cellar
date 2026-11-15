import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useUser } from '../auth/AuthProvider.tsx';
import { averageRating, displayName, updateWine, useWines, type Wine } from '../data/wines.ts';
import { PageHeader } from '../ui/PageHeader.tsx';
import { Stars } from '../ui/Stars.tsx';
import { BottleArt } from '../ui/WineCard.tsx';

const ORDER: Record<Wine['list'], number> = { finished: 0, wishlist: 1, cellar: 2 };

function where(w: Wine): string {
  if (w.list === 'finished') return 'Finished';
  if (w.list === 'wishlist') return 'On your wishlist';
  return w.quantity ? `In the cellar ×${w.quantity}` : 'In the cellar';
}

/** Re-add a wine you've recorded before (no scan, no API call): tastings and the stored scan come with it. */
export function PreviousWinesPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const target = params.get('list') === 'wishlist' ? 'wishlist' : 'cellar';
  const { wines } = useWines(user.uid);
  const [search, setSearch] = useState('');

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (wines ?? [])
      .filter((w) => (target === 'wishlist' ? w.list === 'finished' : true))
      .filter((w) => !q || `${displayName(w)} ${w.vintage ?? ''} ${w.region} ${w.grapes.map((g) => g.grape).join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) => ORDER[a.list] - ORDER[b.list]);
  }, [wines, search, target]);

  const add = (w: Wine) => {
    if (target === 'wishlist') {
      updateWine(user.uid, w.id, { list: 'wishlist', quantity: null });
    } else if (w.list === 'cellar') {
      updateWine(user.uid, w.id, { quantity: (w.quantity ?? 0) + 1 });
    } else {
      updateWine(user.uid, w.id, { list: 'cellar', quantity: 1 });
    }
    navigate(`/wine/${w.id}`, { replace: true });
  };

  return (
    <main className="mx-auto max-w-lg pb-16">
      <PageHeader title={target === 'wishlist' ? 'Want it again' : 'From my wines'} back={`/${target}`} />
      <div className="flex flex-col gap-3 px-4">
        <p className="text-sm text-ink-500">
          {target === 'wishlist'
            ? 'Pick a finished wine to put back on your wishlist.'
            : 'Pick a wine to add a bottle of it to your cellar. Its tastings and details come along; no scan needed.'}
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, grape, region, year…"
          className="w-full rounded-xl bg-white px-4 py-2.5 ring-1 ring-ink-200 outline-none focus:ring-wine-500"
        />
        {wines == null && <p className="py-10 text-center text-ink-500">Loading…</p>}
        {wines != null && candidates.length === 0 && (
          <p className="py-10 text-center text-ink-500">{search ? 'No wines match.' : 'No wines to choose from yet.'}</p>
        )}
        {candidates.map((w) => {
          const avg = averageRating(w);
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => add(w)}
              className="flex items-center gap-3 rounded-2xl bg-white p-2.5 text-left shadow-sm ring-1 ring-ink-200/70 active:bg-cream-50"
            >
              {w.photos[0] ? (
                <img src={w.photos[0].thumbUrl} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <BottleArt type={w.wineType} className="h-16 w-12 shrink-0 rounded-lg" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[16px] font-semibold">
                  {displayName(w)} {w.vintage ?? ''}
                </span>
                <span className="flex items-center gap-2 text-sm text-ink-500">
                  {where(w)}
                  {avg != null && <Stars value={avg} size="size-3.5" />}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-wine-800 px-3 py-1.5 text-sm font-semibold text-white">
                {target === 'wishlist' ? 'Add' : '+1'}
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
