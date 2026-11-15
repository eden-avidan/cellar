import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { averageRating, displayName, type Wine } from '../data/wines.ts';
import { drinkStatus, toneText, type DrinkTone } from '../lib/drink.ts';
import { wineFlag } from '../lib/flags.ts';
import { Ribbon, stagesOf } from './Ribbon.tsx';
import { Stars } from './Stars.tsx';

export const typeColor: Record<string, string> = {
  red: '#7A2335',
  white: '#D9C27A',
  rosé: '#E8A0A8',
  sparkling: '#C9B97A',
  dessert: '#C98A2E',
  fortified: '#6B3A2A',
  orange: '#D9813A',
  '': '#A6B2C0',
};

export function BottleArt({ type, className = '' }: { type: string; className?: string }) {
  return (
    <div className={`grid place-items-center bg-well ${className}`}>
      <svg viewBox="0 0 40 100" className="h-3/4">
        <path d="M16 4h8v22c0 3 6 7 6 14v52a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V40c0-7 6-11 6-14z" fill={typeColor[type] ?? typeColor['']} />
        <rect x="12" y="52" width="16" height="22" rx="2" fill="#F4F6F8" opacity="0.9" />
      </svg>
    </div>
  );
}

/**
 * The bottle's photo as a portrait tile. Clean product photos are white squares with the bottle
 * centred, so they're cropped to the bottle and kept on white in both appearances.
 */
export function BottleThumb({ wine, className = '' }: { wine: Wine; className?: string }) {
  const photo = wine.photos[0];
  if (!photo) return <BottleArt type={wine.wineType} className={`overflow-hidden rounded-lg ${className}`} />;
  const clean = !!photo.source;
  return (
    <div className={`overflow-hidden rounded-lg ${clean ? 'bg-[#fff]' : 'bg-well'} ${className}`}>
      <img
        src={photo.thumbUrl}
        alt=""
        loading="lazy"
        className={`size-full object-cover ${clean ? 'scale-[1.18] dark:brightness-[.94]' : ''}`}
      />
    </div>
  );
}

export const TRACK = 'w-28'; // the ribbon column, shared by rows and section headers
const fade: CSSProperties = {
  maskImage: 'linear-gradient(90deg, transparent, #000 6px, #000 calc(100% - 6px), transparent)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6px, #000 calc(100% - 6px), transparent)',
};

/** The vertical "now" line through a row's ribbon column; rows stack so it reads as one line. */
export function NowLine({ axis, now }: { axis: [number, number]; now: number }) {
  return (
    <i
      aria-hidden="true"
      className="absolute -inset-y-px -ml-px w-0.5 bg-fg"
      style={{ left: `${((now - axis[0]) / axis[1]) * 100}%` }}
    />
  );
}

export function WineRow({ wine, axis, now }: { wine: Wine; axis: [number, number]; now: number }) {
  const inCellar = wine.list === 'cellar';
  const status = inCellar ? drinkStatus(wine) : null;
  const avg = averageRating(wine);
  const meta = metaLine(wine);
  const title = wine.producer && wine.wineName ? wine.wineName : displayName(wine);

  return (
    <Link to={`/wine/${wine.id}`} className="mx-4 flex items-stretch gap-3 active:bg-well">
      <BottleThumb wine={wine} className="my-2 h-14 w-11 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-center py-2">
        <p className="flex items-baseline gap-1.5">
          <span className="truncate text-[15px] leading-5 font-semibold tracking-[-0.01em]">{title}</span>
          {inCellar && wine.quantity != null && wine.quantity > 1 && (
            <span className="tnum shrink-0 text-xs font-semibold text-fg2">×{wine.quantity}</span>
          )}
        </p>
        {meta && <p className="tnum truncate text-xs leading-4 text-fg2">{meta}</p>}
        {status && <p className={`tnum mt-0.5 truncate text-xs leading-4 font-medium ${toneText[status.tone]}`}>{status.label}</p>}
        {!inCellar && avg != null && (
          <span className="mt-0.5">
            <Stars value={avg} size="size-3.5" />
          </span>
        )}
      </div>
      {inCellar ? (
        <div className={`relative shrink-0 ${TRACK}`}>
          <div className="absolute inset-0 overflow-hidden" style={fade}>
            <Ribbon stages={stagesOf(wine)} axis={axis} className="relative h-full" />
          </div>
          <NowLine axis={axis} now={now} />
        </div>
      ) : (
        <div className="tnum flex shrink-0 flex-col items-end justify-center gap-0.5 text-xs text-fg2">
          {wine.typicalPriceIls != null && <span className="text-[15px] font-semibold text-fg">₪{Math.round(wine.typicalPriceIls)}</span>}
          {wine.list === 'wishlist' && wine.tasteFitScore != null && <span>Fit {wine.tasteFitScore}/5</span>}
        </div>
      )}
    </Link>
  );
}

/** Section header for the grouped cellar: title, count, and the year axis over the ribbon column. */
export function SectionHeader({
  title,
  count,
  axis,
  now,
  continues = false,
}: {
  title: string;
  count: number;
  axis: [number, number];
  now: number;
  /** Carry the now line from the section above through this header, broken only by its label. */
  continues?: boolean;
}) {
  const [A, N] = axis;
  const at = (y: number) => `${((y - A) / N) * 100}%`;
  const mid = A + Math.round(N * 0.6);
  return (
    <div className="mx-4 flex items-stretch gap-3">
      <h2 className="flex flex-1 items-baseline gap-1.5 self-end pt-5 pb-1.5 text-xl leading-6 font-bold tracking-[-0.02em]">
        {title}
        <span className="tnum text-[13px] font-semibold tracking-normal text-fg3">{count}</span>
      </h2>
      <div className={`tnum relative min-h-9 shrink-0 self-stretch text-[11px] leading-4 font-semibold text-fg3 ${TRACK}`}>
        {continues && <i aria-hidden="true" className="absolute top-0 bottom-6 -ml-px w-0.5 bg-fg" style={{ left: at(now) }} />}
        <span className="absolute bottom-1.5 -translate-x-1/2 text-fg" style={{ left: at(now) }}>
          Now
        </span>
        {now < mid - 1.6 && (
          <span className="absolute bottom-1.5 -translate-x-1/2" style={{ left: at(mid) }}>
            {mid}
          </span>
        )}
        <span className="absolute right-0 bottom-1.5">{A + N}</span>
        <i aria-hidden="true" className="absolute -bottom-px h-1.5 -ml-px w-0.5 bg-fg" style={{ left: at(now) }} />
      </div>
    </div>
  );
}

const heroTint: Record<DrinkTone, string> = {
  past: 'bg-past/12 ring-past/30',
  soon: 'bg-soon/14 ring-soon/35',
  peak: 'bg-peak/14 ring-peak/40',
  ready: 'bg-ready/14 ring-ready/35',
  hold: 'bg-hold/14 ring-hold/35',
};


/** The reason, in one line: the deadline in bold, then what it means. */
function advice(wine: Wine, tone: DrinkTone, year: number): [string, string] {
  const last = Math.min(wine.drinkUntil ?? Infinity, wine.expiresYear ?? Infinity);
  switch (tone) {
    case 'past':
      return [`Past its best since ${last}.`, 'Open it soon, before it fades further.'];
    case 'soon':
      return year >= last ? ['Its last year.', 'Open it this season.'] : [`Drink by ${last}.`, 'It’s near the end of its window.'];
    case 'peak':
      return [`At its best through ${wine.peakTo}.`, 'A good night for it.'];
    case 'ready':
      return wine.peakFrom != null && wine.peakFrom > year
        ? ['Drinking well now.', `Better still from ${wine.peakFrom}.`]
        : ['Drinking well now.', last !== Infinity ? `Good until ${last}.` : ''];
    default:
      return [`Better after ${wine.drinkFrom}.`, ''];
  }
}

/** "Producer · Region · 🇮🇱 2016": the flag and vintage never split across lines. */
function metaLine(wine: Wine, extra?: string) {
  const lead = [wine.producer && wine.wineName ? wine.producer : '', extra].filter(Boolean).join(' · ');
  const tail = [wineFlag(wine), wine.vintage ?? ''].filter(Boolean).join(' ');
  return (
    <>
      {lead}
      {lead && tail && ' · '}
      {tail && <span className="whitespace-nowrap">{tail}</span>}
    </>
  );
}

/** A bottle's whole life on one ribbon, with its peak and today marked. */
export function WindowChart({ wine, now }: { wine: Wine; now: number }) {
  const stages = stagesOf(wine);
  if (!stages) return null;
  const A = Math.min(stages.start, Math.floor(now));
  const B = Math.max(stages.end, Math.ceil(now));
  const axis: [number, number] = [A, B - A];
  const at = (y: number) => `${((y - A) / (B - A)) * 100}%`;
  const peak = stages.peak;
  const nowLeft = (now - A) / (B - A);
  const peakMid = peak ? ((peak[0] + peak[1]) / 2 - A) / (B - A) : null;
  const peakClashes = peakMid != null && Math.abs(peakMid - nowLeft) < 0.22;
  return (
    <div>
      <Ribbon stages={stages} axis={axis} size="lg" now={now} className="relative h-6" />
      <div className="tnum relative mt-1 h-4 text-xs leading-4 text-fg3">
        {nowLeft > 0.14 && <span className="absolute left-0">{A}</span>}
        {peak && !peakClashes && (
          <span className="absolute -translate-x-1/2 font-semibold whitespace-nowrap text-t-peak" style={{ left: at((peak[0] + peak[1]) / 2) }}>
            Peak {peak[1] - 1 > peak[0] ? `${peak[0]}–${String(peak[1] - 1).slice(-2)}` : peak[0]}
          </span>
        )}
        <span
          className={`absolute font-bold text-fg ${nowLeft > 0.9 ? '-translate-x-full' : nowLeft < 0.1 ? '' : '-translate-x-1/2'}`}
          style={{ left: at(now) }}
        >
          Now
        </span>
        {nowLeft < 0.85 && <span className="absolute right-0">{B}</span>}
      </div>
    </div>
  );
}

/** The one bottle to open tonight, with the reason and its whole life on a ribbon. */
export function TonightCard({ wine, now }: { wine: Wine; now: number }) {
  const status = drinkStatus(wine)!;
  const meta = metaLine(wine);
  const [lead, why] = advice(wine, status.tone, Math.floor(now));

  return (
    <Link to={`/wine/${wine.id}`} aria-label={`Open tonight: ${displayName(wine)}`} className={`mx-4 block rounded-3xl p-4 ring-1 active:opacity-80 ${heroTint[status.tone]}`}>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[28px] leading-8 font-bold tracking-[-0.025em] text-balance">
            {wine.producer && wine.wineName ? wine.wineName : displayName(wine)}
          </h3>
          <p className="tnum mt-1 text-[13px] leading-4 text-fg2">{meta}</p>
          <p className="mt-2.5 text-sm leading-5 text-pretty text-fg2">
            <b className="font-semibold text-fg">{lead}</b> {why}
          </p>
        </div>
        <BottleThumb wine={wine} className="h-[88px] w-16 shrink-0 rounded-xl" />
      </div>

      <div className="mt-3">
        <WindowChart wine={wine} now={now} />
      </div>

    </Link>
  );
}
