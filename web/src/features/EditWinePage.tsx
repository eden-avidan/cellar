import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useUser } from '../auth/AuthProvider.tsx';
import { updateWine, useWine, type Wine, type WineFields } from '../data/wines.ts';
import { PageHeader } from '../ui/PageHeader.tsx';
import { WineForm } from './WineForm.tsx';

export function EditWinePage() {
  const { id = '' } = useParams();
  const user = useUser();
  const wine = useWine(user.uid, id);
  if (wine === undefined) return <p className="py-20 text-center text-ink-500">Loading…</p>;
  if (wine === null) return <p className="py-20 text-center text-ink-500">This wine is gone.</p>;
  // Keyed so the form starts from the stored values once, and later snapshots don't clobber typing.
  return <EditForm key={wine.id} uid={user.uid} wine={wine} />;
}

function EditForm({ uid, wine }: { uid: string; wine: Wine }) {
  const navigate = useNavigate();
  const { id, tastings: _t, photos: _p, createdAt: _c, updatedAt: _u, ...initial } = wine;
  const [fields, setFields] = useState<WineFields>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    try {
      await updateWine(uid, id, fields);
      navigate(-1);
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg pb-32">
      <PageHeader title="Edit wine" back />
      <div className="flex flex-col gap-3 px-4">
        <label className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-ink-200/70">
          <span className="text-sm text-ink-700">List</span>
          <select
            value={fields.list}
            onChange={(e) => setFields({ ...fields, list: e.target.value as WineFields['list'] })}
            className="bg-transparent font-medium"
          >
            <option value="cellar">In the cellar</option>
            <option value="finished">Finished</option>
            <option value="wishlist">Wishlist</option>
          </select>
        </label>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <WineForm value={fields} onChange={setFields} />
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-cream-50/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-2xl bg-wine-800 py-3.5 font-semibold text-white active:bg-wine-900 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </main>
  );
}
