import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase.ts';
import { useAuth } from './AuthProvider.tsx';

export function LoginPage() {
  const { redirectError } = useAuth();
  return (
    <main className="pt-safe pb-safe mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 text-center">
      <div>
        <img src="/icon.svg" alt="" className="mx-auto mb-4 size-24 rounded-[28px] shadow-lg" />
        <h1 className="tracking-[-0.015em] text-4xl font-semibold text-wine-900">Cellar</h1>
        <p className="mt-1 text-ink-500">Your bottles, your notes, your wishlist.</p>
      </div>
      <button
        type="button"
        onClick={() => signInWithRedirect(auth, new GoogleAuthProvider())}
        className="flex items-center justify-center gap-3 rounded-2xl bg-white py-3.5 font-medium shadow-sm ring-1 ring-ink-200 active:bg-cream-100"
      >
        <span className="text-xl font-bold text-[#4285F4]">G</span>
        Continue with Google
      </button>
      {redirectError && <p className="text-sm text-red-700">{redirectError}</p>}
    </main>
  );
}
