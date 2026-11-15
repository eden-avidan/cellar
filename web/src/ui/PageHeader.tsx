import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

export function PageHeader({ title, back, right }: { title?: string; back?: string | true; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe sticky top-0 z-10 bg-cream-100/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-3">
        {back && (
          <button
            type="button"
            onClick={() => (back === true ? navigate(-1) : navigate(back))}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-wine-800 active:bg-cream-200"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}
        {title && <h1 className="flex-1 truncate font-serif text-lg font-semibold">{title}</h1>}
        {!title && <div className="flex-1" />}
        {right}
      </div>
    </header>
  );
}
