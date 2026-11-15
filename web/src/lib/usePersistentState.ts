import { useEffect, useState } from 'react';

/**
 * useState that survives leaving the page (and, with localStorage, closing the app). Per-device view
 * preferences only — sort order, filters — never data. If storage is unavailable (private mode,
 * blocked site data) it quietly behaves like plain useState.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  options: { valid?: (v: unknown) => boolean; session?: boolean } = {},
) {
  const storage = () => (options.session ? sessionStorage : localStorage);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = storage().getItem(key);
      if (raw != null) {
        const parsed: unknown = JSON.parse(raw);
        if (!options.valid || options.valid(parsed)) return parsed as T;
      }
    } catch {
      // unreadable or blocked storage: use the default
    }
    return initial;
  });
  useEffect(() => {
    try {
      storage().setItem(key, JSON.stringify(value));
    } catch {
      // blocked storage: the preference just isn't remembered
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- storage() is stable per options.session
  }, [key, value]);
  return [value, setValue] as const;
}
