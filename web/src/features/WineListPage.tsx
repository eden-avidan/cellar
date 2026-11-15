import { useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { useUser } from '../auth/AuthProvider.tsx';
import { auth } from '../firebase.ts';
import { averageRating, displayName, useWines, type Wine } from '../data/wines.ts';
import { drinkStatus } from '../lib/drink.ts';
import { usePersistentState } from '../lib/usePersistentState.ts';
import { Link } from 'react-router';
import { PickPhotosButton } from '../ui/PickPhotosButton.tsx';
import { PeakBanner } from '../ui/PeakBanner.tsx';
import { WineCard } from '../ui/WineCard.tsx';

type Sort = 'newest' | 'drink' | 'rating' | 'vintage' | 'fit';
const TYPE_FILTERS = ['all', 'red', 'white', 'rosé', 'sparkling', 'other'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

const MAIN_TYPES = ['red', 'white', 'rosé', 'sparkling'];

function lastGoodYear(w: Wine) {
  return Math.min(w.drinkUntil ?? Infinity, w.expiresYear ?? Infinity);
}

const sorters: Record<Sort, (a: Wine, b: Wine) => number> = {
  newest: () => 0, // the query already returns newest first
  drink: (a, b) => lastGoodYear(a) - lastGoodYear(b),
  rating: (a, b) => (averageRating(b) ?? -1) - (averageRating(a) ?? -1),
  vintage: (a, b) => (b.vintage ?? 0) - (a.vintage ?? 0),
  fit: (a, b) => (b.tasteFitScore ?? -1) - (a.tasteFitScore ?? -1),
};

export function WineListPage({ list }: { list: 'cellar' | 'wishlist' }) {
  const user = useUser();
  const { wines, error } = useWines(user.uid);
  // View choices are remembered per list, so leaving (a bottle, the other tab, the app) doesn't reset them.
  const k = (name: string) => `cellar.view.${list}.${name}`;
  const isBool = (v: unknown) => typeof v === 'boolean';
  const [showFinished, setShowFinished] = usePersistentState(k('finished'), false, { valid: isBool });
  const [search, setSearch] = usePersistentState(k('search'), '', { valid: (v) => typeof v === 'string', session: true });
  const [type, setType] = usePersistentState<TypeFilter>(k('type'), 'all', { valid: (v) => TYPE_FILTERS.includes(v as TypeFilter) });
  const [readyOnly, setReadyOnly] = usePersistentState(k('ready'), false, { valid: isBool });
  const [chosenSort, setSort] = usePersistentState<Sort>(k('sort'), 'newest', { valid: (v) => typeof v === 'string' && v in sorters });

  const shownList = list === 'cellar' && showFinished ? 'finished' : list;
  // Some orders only exist in some views ("Drink soonest" in the cellar, "Taste fit" in the wishlist).
  // Keep the choice stored, but show "Newest" where it doesn't apply.
  const available: Sort[] = ['newest', ...(shownList === 'cellar' ? (['drink'] as const) : []), 'rating', 'vintage', ...(list === 'wishlist' ? (['fit'] as const) : [])];
  const sort: Sort = available.includes(chosenSort) ? chosenSort : 'newest';

  const visible = useMemo(() => {
    if (!wines) return [];
    const q = search.trim().toLowerCase();
    return wines
      .filter((w) => w.list === shownList)
      .filter((w) => type === 'all' || (type === 'other' ? !MAIN_TYPES.includes(w.wineType) : w.wineType === type))
      .filter((w) => !readyOnly || ['ready', 'peak', 'soon'].includes(drinkStatus(w)?.tone ?? ''))
      .filter(
        (w) =>
          !q ||
          [displayName(w), w.region, w.country, w.grapes.map((g) => g.grape).join(' '), String(w.vintage ?? ''), w.location]
            .join(' ')
            .toLowerCase()
            .includes(q),
      )
      .sort(sorters[sort]);
  }, [wines, shownList, search, type, readyOnly, sort]);

  const bottles = (wines ?? []).filter((w) => w.list === 'cellar').reduce((s, w) => s + (w.quantity ?? 1), 0);
  const wishCount = (wines ?? []).filter((w) => w.list === 'wishlist').length;

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-sm capitalize ${active ? 'bg-wine-800 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200'}`;

  return (
    <main className="mx-auto max-w-lg pb-32">
      <header className="pt-safe px-4">
        <div className="flex items-end justify-between pt-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-wine-900">{list === 'cellar' ? 'My Cellar' : 'Wishlist'}</h1>
            <p className="text-sm text-ink-500">
              {wines == null
                ? ' '
                : list === 'cellar'
                  ? `${bottles} bottle${bottles === 1 ? '' : 's'}`
                  : `${wishCount} wine${wishCount === 1 ? '' : 's'} to try`}
            </p>
          </div>
          <button type="button" onClick={() => signOut(auth)} className="pb-1 text-sm text-ink-500 active:text-ink-900">
            Sign out
          </button>
        </div>

        {list === 'cellar' && (
          <div className="mt-4 grid grid-cols-2 rounded-xl bg-cream-200 p-1 text-sm font-medium">
            {[false, true].map((fin) => (
              <button
                key={String(fin)}
                type="button"
                onClick={() => setShowFinished(fin)}
                className={`rounded-lg py-1.5 ${showFinished === fin ? 'bg-white shadow-sm' : 'text-ink-500'}`}
              >
                {fin ? 'Finished' : 'In the cellar'}
              </button>
            ))}
          </div>
        )}

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, grape, region, year…"
          className="mt-3 w-full rounded-xl bg-white px-4 py-2.5 ring-1 ring-ink-200 outline-none focus:ring-wine-500"
        />

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {TYPE_FILTERS.map((t) => (
            <button key={t} type="button" className={chip(type === t)} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {shownList === 'cellar' ? (
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={readyOnly} onChange={(e) => setReadyOnly(e.target.checked)} className="size-4 accent-wine-800" />
              Ready to drink
            </label>
          ) : (
            <span />
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg bg-transparent py-1 text-sm! text-ink-700"
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            {shownList === 'cellar' && <option value="drink">Drink soonest</option>}
            <option value="rating">Top rated</option>
            <option value="vintage">Vintage</option>
            {list === 'wishlist' && <option value="fit">Taste fit</option>}
          </select>
        </div>
      </header>

      <section className="mt-3 flex flex-col gap-2.5 px-4">
        {wines && <PeakBanner wines={wines} />}
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Couldn't load your wines: {error}</p>}
        {wines == null && !error && <p className="py-10 text-center text-ink-500">Loading…</p>}
        {wines != null && visible.length === 0 && (
          <div className="py-12 text-center text-ink-500">
            {wines.some((w) => w.list === shownList) ? (
              <p>No wines match.</p>
            ) : shownList === 'finished' ? (
              <p>Bottles you finish will show up here.</p>
            ) : (
              <>
                <p className="mb-4">{list === 'cellar' ? 'Your cellar is empty.' : 'Nothing on the wishlist yet.'}</p>
                <PickPhotosButton list={list} className="rounded-full bg-wine-800 px-5 py-2.5 font-medium text-white">
                  Add a bottle
                </PickPhotosButton>
                <Link to={`/add?list=${list}&manual=1`} className="mt-4 block text-sm text-wine-700 underline">
                  or add one manually
                </Link>
              </>
            )}
          </div>
        )}
        {visible.map((w) => (
          <WineCard key={w.id} wine={w} />
        ))}
      </section>
    </main>
  );
}
