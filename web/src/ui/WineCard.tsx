import { Link } from 'react-router';
import { averageRating, displayName, type Wine } from '../data/wines.ts';
import { drinkStatus, toneClass } from '../lib/drink.ts';
import { Stars } from './Stars.tsx';

export const typeColor: Record<string, string> = {
  red: '#7A2335',
  white: '#D9C27A',
  rosé: '#E8A0A8',
  sparkling: '#C9B97A',
  dessert: '#C98A2E',
  fortified: '#6B3A2A',
  orange: '#D9813A',
  '': '#CFC7BE',
};

export function BottleArt({ type, className = '' }: { type: string; className?: string }) {
  return (
    <div className={`grid place-items-center bg-cream-200 ${className}`}>
      <svg viewBox="0 0 40 100" className="h-3/4">
        <path d="M16 4h8v22c0 3 6 7 6 14v52a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V40c0-7 6-11 6-14z" fill={typeColor[type] ?? typeColor['']} />
        <rect x="12" y="52" width="16" height="22" rx="2" fill="#FBF7F2" opacity="0.9" />
      </svg>
    </div>
  );
}

export function WineCard({ wine }: { wine: Wine }) {
  const status = wine.list === 'cellar' ? drinkStatus(wine) : null;
  const avg = averageRating(wine);
  const thumb = wine.photos[0]?.thumbUrl;
  const sub = [wine.vintage, wine.region || wine.country].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="flex gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-ink-200/70 active:bg-cream-50"
    >
      {thumb ? (
        <img src={thumb} alt="" loading="lazy" className="h-24 w-18 shrink-0 rounded-xl object-cover" />
      ) : (
        <BottleArt type={wine.wineType} className="h-24 w-18 shrink-0 rounded-xl" />
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-start gap-2">
          <p className="line-clamp-2 flex-1 font-serif text-[17px] leading-tight font-semibold">{displayName(wine)}</p>
          {wine.list === 'cellar' && wine.quantity != null && wine.quantity > 0 && (
            <span className="shrink-0 rounded-full bg-wine-50 px-2 py-0.5 text-xs font-semibold text-wine-800">×{wine.quantity}</span>
          )}
        </div>
        {sub && <p className="truncate text-sm text-ink-500">{sub}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          {wine.wineType && (
            <span className="flex items-center gap-1 text-xs text-ink-700 capitalize">
              <span className="size-2.5 rounded-full" style={{ background: typeColor[wine.wineType] }} />
              {wine.wineType}
            </span>
          )}
          {status && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass[status.tone]}`}>{status.label}</span>}
          {wine.list === 'wishlist' && wine.typicalPriceIls != null && (
            <span className="text-xs text-ink-500">~₪{Math.round(wine.typicalPriceIls)}</span>
          )}
          {wine.list === 'wishlist' && wine.tasteFitScore != null && (
            <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs text-ink-700">Fit {wine.tasteFitScore}/5</span>
          )}
          {avg != null && <Stars value={avg} size="size-3.5" />}
        </div>
      </div>
    </Link>
  );
}
