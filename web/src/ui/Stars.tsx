const STAR = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';

/** Read-only stars; supports fractional averages (e.g. 3.5). */
export function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} viewBox="0 0 24 24" className={size}>
            <defs>
              <linearGradient id={`s${i}-${fill}`}>
                <stop offset={fill} stopColor="#B23A48" />
                <stop offset={fill} stopColor="#E3DDD6" />
              </linearGradient>
            </defs>
            <path d={STAR} fill={`url(#s${i}-${fill})`} />
          </svg>
        );
      })}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onClick={() => onChange(i)}
          className="p-0.5 active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="size-9">
            <path d={STAR} fill={i <= value ? '#B23A48' : '#E3DDD6'} />
          </svg>
        </button>
      ))}
    </div>
  );
}
