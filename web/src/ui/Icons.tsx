const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const XIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 16 16" strokeWidth="2" className={className} {...base}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export const ChevronRight = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 16 16" strokeWidth="2" className={className} {...base}>
    <path d="M6 3.5L10.5 8 6 12.5" />
  </svg>
);

export const GlassIcon = ({ className = 'size-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" strokeWidth="1.8" className={className} {...base}>
    <path d="M8 3h8c.3 3.5.6 6.5-.8 8.6-.8 1.3-2 1.9-3.2 2-1.2-.1-2.4-.7-3.2-2C7.4 9.5 7.7 6.5 8 3z" />
    <path d="M12 14v6M8.5 20.5h7" />
  </svg>
);
