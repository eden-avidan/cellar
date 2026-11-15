import { Fragment, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { useUser } from '../auth/AuthProvider.tsx';
import { auth } from '../firebase.ts';
import { averageRating, displayName, useWines, type Wine } from '../data/wines.ts';
import { drinkStatus } from '../lib/drink.ts';
import { usePersistentState } from '../lib/usePersistentState.ts';
import { Link } from 'react-router';
import { PickPhotosButton } from '../ui/PickPhotosButton.tsx';
import { PeakBanner } from '../ui/PeakBanner.tsx';
import { listAxis, nowYear } from '../ui/Ribbon.tsx';
import { XIcon } from '../ui/Icons.tsx';
import { SectionHeader, TonightCard, WineRow } from '../ui/WineCard.tsx';

type Sort = 'newest' | 'drink' | 'rating' | 'vintage' | 'fit';
const TYPE_FILTERS = ['all', 'red', 'white', 'rosé', 'sparkling', 'other'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

const MAIN_TYPES = ['red', 'white', 'rosé', 'sparkling'];

const STATUS_RANK: Record<string, number> = { past: 0, soon: 1, peak: 2, ready: 3, hold: 4 };
const NONE = 9999; // wines with no window at all go last

/**
 * "Drink soonest": by the year it's best to have opened it — the end of its peak when known,
 * otherwise the end of its drinking window, otherwise its expiry. Ties: past its best, then
 * drink-now, then at its peak, then ready, then hold; then the end of the drinking window.
 */
function drinkSoonestKey(w: Wine): [number, number, number] {
  const bestBy = w.peakTo ?? w.drinkUntil ?? w.expiresYear ?? NONE;
  const rank = STATUS_RANK[drinkStatus(w)?.tone ?? ''] ?? 5;
  const lastGood = Math.min(w.drinkUntil ?? NONE, w.expiresYear ?? NONE);
  return [bestBy, rank, lastGood];
}
const byKeys = (a: number[], b: number[]) => a.reduce((d, x, i) => d || x - b[i], 0);

const sorters: Record<Sort, (a: Wine, b: Wine) => number> = {
  newest: () => 0, // the query already returns newest first
  drink: (a, b) => byKeys(drinkSoonestKey(a), drinkSoonestKey(b)),
  rating: (a, b) => (averageRating(b) ?? -1) - (averageRating(a) ?? -1),
  vintage: (a, b) => (b.vintage ?? 0) - (a.vintage ?? 0),
  fit: (a, b) => (b.tasteFitScore ?? -1) - (a.tasteFitScore ?? -1),
};

/** The cellar, grouped by what to do about each bottle, most urgent first. */
const GROUPS: { title: string; tones: (string | undefined)[] }[] = [
  { title: 'Past its best', tones: ['past'] },
  { title: 'Drink soon', tones: ['soon'] },
  { title: 'At its peak', tones: ['peak'] },
  { title: 'Ready', tones: ['ready'] },
  { title: 'Hold', tones: ['hold'] },
  { title: 'No window yet', tones: [undefined] },
];

const SORT_LABEL: Record<Sort, string> = { newest: 'Newest', drink: 'Drink soonest', rating: 'Top rated', vintage: 'Vintage', fit: 'Taste fit' };

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
  const [chosenSort, setSort] = usePersistentState<Sort>(k('sort'), list === 'cellar' ? 'drink' : 'newest', { valid: (v) => typeof v === 'string' && v in sorters });

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

  const now = nowYear();
  const axis = listAxis(now);
  const filtered = !!search.trim() || type !== 'all' || readyOnly;
  // The bottle to open tonight: first in "drink soonest" order that is drinkable now.
  const tonight =
    shownList === 'cellar' && !filtered
      ? (wines ?? [])
          .filter((w) => w.list === 'cellar' && ['past', 'soon', 'peak', 'ready'].includes(drinkStatus(w)?.tone ?? ''))
          .sort(sorters.drink)[0]
      : undefined;
  const rows = tonight ? visible.filter((w) => w.id !== tonight.id) : visible;
  const groups =
    shownList === 'cellar' && sort === 'drink'
      ? GROUPS.map((g) => ({ ...g, wines: rows.filter((w) => g.tones.includes(drinkStatus(w)?.tone)) })).filter((g) => g.wines.length)
      : [{ title: '', tones: [], wines: rows }];

  const chip = (active: boolean) =>
    `hit h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold capitalize ${active ? 'bg-fg text-ground' : 'bg-well text-fg2 active:bg-line'}`;

  return (
    <main className="mx-auto max-w-lg pb-36">
      <header className="pt-safe">
        <div className="flex items-end gap-2 px-4 pt-2">
          <h1 className="text-[34px] leading-10 font-bold tracking-[-0.025em]">{list === 'cellar' ? 'Cellar' : 'Wishlist'}</h1>
          <p className="tnum pb-1.5 text-[15px] font-medium text-fg2">
            {wines == null
              ? ' '
              : list === 'cellar'
                ? `${bottles} bottle${bottles === 1 ? '' : 's'}`
                : `${wishCount} to try`}
          </p>
        </div>
      </header>

      {wines && <div className="mt-2 px-4 empty:hidden"><PeakBanner wines={wines} /></div>}
      {tonight && (
        <section aria-labelledby="tonight">
          <h2 id="tonight" className="px-4 pt-3 pb-2 text-xl leading-6 font-bold tracking-[-0.02em]">
            Open tonight
          </h2>
          <TonightCard wine={tonight} now={now} />
        </section>
      )}

      <div className="px-4">
        <label className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-well px-3 text-fg3 focus-within:ring-2 focus-within:ring-wine-500">
          <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="7" cy="7" r="5.2" />
            <path d="M11 11l3.6 3.6" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wines, grapes, regions"
            aria-label="Search"
            className="h-full min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg3"
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="-mr-3 grid size-10 shrink-0 place-items-center text-fg2">
              <span className="grid size-4.5 place-items-center rounded-full bg-fg3 text-well">
                <XIcon className="size-2.5" />
              </span>
            </button>
          )}
        </label>

        {list === 'cellar' && (
          <div className="mt-2 grid h-9 grid-cols-2 rounded-[10px] bg-well p-0.5 text-[13px] font-semibold" role="tablist">
            {[false, true].map((fin) => (
              <button
                key={String(fin)}
                type="button"
                role="tab"
                aria-selected={showFinished === fin}
                onClick={() => setShowFinished(fin)}
                className={`hit rounded-lg ${showFinished === fin ? 'bg-surface text-fg shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'text-fg2'}`}
              >
                {fin ? 'Finished' : 'In the cellar'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
        <label className={`${chip(false)} relative flex items-center gap-1 normal-case`}>
          {SORT_LABEL[sort]}
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="absolute inset-x-0 -inset-y-1 z-10 opacity-0"
            aria-label="Sort"
          >
            {available.map((o) => (
              <option key={o} value={o}>
                {SORT_LABEL[o]}
              </option>
            ))}
          </select>
        </label>
        {shownList === 'cellar' && (
          <button type="button" className={`${chip(readyOnly)} normal-case`} aria-pressed={readyOnly} onClick={() => setReadyOnly(!readyOnly)}>
            Ready to drink
          </button>
        )}
        <span className="my-2 w-px shrink-0 bg-line" aria-hidden="true" />
        {TYPE_FILTERS.map((t) => (
          <button key={t} type="button" className={chip(type === t)} aria-pressed={type === t} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
      </div>

      <section className="mt-1">
        {error && <p className="mx-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Couldn't load your wines: {error}</p>}
        {wines == null && !error && <p className="py-10 text-center text-fg2">Loading…</p>}
        {wines != null && rows.length === 0 && !tonight && (
          <div className="px-4 py-12 text-center text-fg2">
            {wines.some((w) => w.list === shownList) ? (
              <>
                <p>No wines match.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setType('all');
                    setReadyOnly(false);
                  }}
                  className="mt-4 h-11 rounded-full bg-well px-5 text-[15px] font-semibold text-fg active:bg-line"
                >
                  Clear search and filters
                </button>
              </>
            ) : shownList === 'finished' ? (
              <p>Bottles you finish will show up here.</p>
            ) : (
              <>
                <p className="mb-4">{list === 'cellar' ? 'Your cellar is empty.' : 'Nothing on the wishlist yet.'}</p>
                <PickPhotosButton list={list} className="h-11 rounded-full bg-fg px-5 font-semibold text-ground">
                  Scan a bottle
                </PickPhotosButton>
                <Link to={`/add?list=${list}&manual=1`} className="mt-4 block text-sm text-fg underline underline-offset-2">
                  or add one manually
                </Link>
              </>
            )}
          </div>
        )}
        {groups.map((g, i) => (
          <Fragment key={g.title || 'all'}>
            {shownList === 'cellar' && (g.title || i === 0) && g.wines.length > 0 && (
              <SectionHeader title={g.title || SORT_LABEL[sort]} count={g.wines.length} axis={axis} now={now} continues={i > 0} />
            )}
            <div className="divide-y divide-line">
              {g.wines.map((w) => (
                <WineRow key={w.id} wine={w} axis={axis} now={now} />
              ))}
            </div>
          </Fragment>
        ))}
      </section>
      <p className="tnum mt-10 text-center text-[11px] text-fg3">
        Version {__BUILD__} ·{' '}
        <button type="button" onClick={() => signOut(auth)} className="underline underline-offset-2 active:text-fg">
          Sign out
        </button>
      </p>
    </main>
  );
}
