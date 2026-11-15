import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

export function PageHeader({ title, back, right }: { title?: string; back?: string | true; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe sticky top-0 z-10 bg-ground/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-3">
        {back && (
          <button
            type="button"
            onClick={() => (back === true ? navigate(-1) : navigate(back))}
            className="flex min-h-11 items-center gap-0.5 rounded-full pr-2 pl-1 font-medium text-fg active:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}
        {title && <h1 className="flex-1 truncate text-[17px] font-bold tracking-[-0.01em]">{title}</h1>}
        {!title && <div className="flex-1" />}
        {right}
      </div>
    </header>
  );
}
