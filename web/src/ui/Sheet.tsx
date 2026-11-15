import { useEffect, type ReactNode } from 'react';

/** Bottom sheet modal. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink-900/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="pb-safe max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 px-5 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink-200" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="tracking-[-0.015em] text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex min-h-11 items-center rounded-full px-3 text-sm text-ink-500 active:bg-cream-200">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
