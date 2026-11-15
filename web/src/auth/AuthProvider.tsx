import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getRedirectResult, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase.ts';

type AuthState = { user: User | null; loading: boolean; redirectError: string | null };
const AuthContext = createContext<AuthState>({ user: null, loading: true, redirectError: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, redirectError: null });

  useEffect(() => {
    getRedirectResult(auth).catch((err: { code?: string }) =>
      setState((s) => ({
        ...s,
        redirectError: err.code === 'auth/user-cancelled' ? 'Sign-in was cancelled.' : 'Sign-in failed. Try again.',
      })),
    );
    return onAuthStateChanged(auth, (user) => setState((s) => ({ ...s, user, loading: false })));
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export const useAuth = () => useContext(AuthContext);

/** For pages behind the login gate, where the user is guaranteed. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useUser() outside the signed-in area');
  return user;
}
