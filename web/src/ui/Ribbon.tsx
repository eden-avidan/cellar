import type { CSSProperties } from 'react';
import type { WineFields } from '../data/wines.ts';

type Window = Pick<WineFields, 'vintage' | 'drinkFrom' | 'drinkUntil' | 'expiresYear' | 'peakFrom' | 'peakTo'>;

/**
 * A bottle's life on a year axis, as positions in fractional years (a year Y spans Y..Y+1):
 * start → hold → ready (from) → peak (peakFrom..peakTo) → ready → past (after drinkUntil) → end.
 */
export interface Stages {
  start: number;
  from: number | null;
  peak: [number, number] | null;
  until: number;
  end: number;
}

export function stagesOf(w: Window): Stages | null {
  const { vintage, drinkFrom, drinkUntil, expiresYear, peakFrom, peakTo } = w;
  if (drinkFrom == null && drinkUntil == null && peakFrom == null && expiresYear == null) return null;
  const first = drinkFrom ?? peakFrom ?? drinkUntil ?? expiresYear!;
  const start = Math.min(vintage ?? first - 2, first);
  const peak: [number, number] | null = peakFrom != null ? [peakFrom, (peakTo ?? peakFrom) + 1] : null;
  const until = Math.max((drinkUntil ?? expiresYear ?? peakTo ?? first) + 1, peak?.[1] ?? 0, (drinkFrom ?? start) + 1);
  const end = Math.max(until + 1, (expiresYear ?? 0) + 1);
  return { start, from: drinkFrom != null && drinkFrom > start ? drinkFrom : null, peak, until, end };
}

/** Today as a fractional year (mid-November 2026 → 2026.87). */
export function nowYear(d = new Date()) {
  const y = d.getFullYear();
  return y + (d.getTime() - new Date(y, 0, 1).getTime()) / (new Date(y + 1, 0, 1).getTime() - new Date(y, 0, 1).getTime());
}

const pct = (x: number) => `${Math.round(x * 10000) / 100}%`;

/** The gradient along the bar: colour bands with short blends at each stage change. */
function gradient(s: Stages) {
  const L = s.end - s.start;
  const at = (y: number) => (y - s.start) / L;
  const bl = Math.min(0.035, 0.25 / L);
  const stops: string[] = [];
  const band = (color: string, a: number, b: number) => {
    stops.push(`var(${color}) ${pct(Math.max(0, a + bl))}`, `var(${color}) ${pct(Math.min(1, b - bl))}`);
  };
  let cursor = 0;
  if (s.from != null) {
    band('--hold', 0, at(s.from));
    cursor = at(s.from);
  }
  if (s.peak) {
    band('--ready', cursor, at(s.peak[0]));
    band('--peak', at(s.peak[0]), at(s.peak[1]));
    cursor = at(s.peak[1]);
  }
  band('--ready', cursor, at(s.until));
  band('--past', at(s.until), 1);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/**
 * The drinking-window ribbon on an axis [from, from + span). `size` sets the thickness;
 * `now` draws the vertical now line through the full height of the box.
 */
export function Ribbon({
  stages,
  axis,
  size = 'sm',
  now,
  className = 'relative',
}: {
  stages: Stages | null;
  axis: [number, number];
  size?: 'sm' | 'lg';
  now?: number;
  className?: string;
}) {
  const [A, N] = axis;
  const x = (y: number) => (y - A) / N;
  const h = size === 'lg' ? { bar: 14, peak: 22 } : { bar: 6, peak: 10 };
  const bar = (left: number, right: number, height: number, style: CSSProperties) => (
    <i
      aria-hidden="true"
      className="absolute top-1/2 -translate-y-1/2 rounded-full"
      style={{ left: pct(x(left)), width: pct((right - left) / N), height, ...style }}
    />
  );
  return (
    <div className={className}>
      {stages && bar(stages.start, stages.end, h.bar, { background: gradient(stages) })}
      {stages?.peak &&
        bar(stages.peak[0], stages.peak[1], h.peak, {
          background: 'linear-gradient(90deg, var(--peak-lt), var(--peak) 35%, var(--peak) 65%, var(--peak-lt))',
          boxShadow: size === 'lg' ? '0 0 0 3px color-mix(in oklab, var(--peak) 22%, transparent)' : undefined,
        })}
      {now != null && (
        <i aria-hidden="true" className="absolute inset-y-0 -ml-px w-0.5 rounded-full bg-fg" style={{ left: pct(x(now)) }} />
      )}
    </div>
  );
}

/** Shared year axis for list rows: two years back, eight ahead. */
export function listAxis(now = nowYear()): [number, number] {
  return [Math.floor(now) - 2, 10];
}
