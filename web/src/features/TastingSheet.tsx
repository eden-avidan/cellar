import { useState } from 'react';
import { addTasting, type Wine } from '../data/wines.ts';
import { Sheet } from '../ui/Sheet.tsx';
import { StarInput } from '../ui/Stars.tsx';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function TastingSheet({ uid, wine, openingBottle, onClose }: { uid: string; wine: Wine; openingBottle: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today);
  const [opened, setOpened] = useState(openingBottle);
  const [saving, setSaving] = useState(false);
  const lastBottle = opened && wine.list === 'cellar' && (wine.quantity ?? 0) <= 1;

  const save = async () => {
    setSaving(true);
    await addTasting(uid, wine, { date, rating, notes: notes.trim() }, opened);
    onClose();
  };

  return (
    <Sheet title={openingBottle ? 'Open a bottle' : 'Rate this wine'} onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex flex-col items-center gap-1">
          <StarInput value={rating} onChange={setRating} />
          <p className="text-sm text-ink-500">{['Tap to rate', 'Not for me', 'Meh', 'Good', 'Very good', 'Loved it'][rating]}</p>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was it? Who did you drink it with?"
          className="min-h-24 rounded-xl bg-white px-3 py-2.5 ring-1 ring-ink-200 outline-none focus:ring-2 focus:ring-wine-500"
        />
        <label className="flex items-center justify-between text-sm">
          <span className="text-ink-700">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg bg-white px-2 py-1 ring-1 ring-ink-200" />
        </label>
        {wine.list === 'cellar' && (
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={opened} onChange={(e) => setOpened(e.target.checked)} className="size-4 accent-wine-800" />
            Take one bottle out of the cellar
            {wine.quantity != null && <span className="text-ink-500">({wine.quantity} left)</span>}
          </label>
        )}
        {lastBottle && <p className="-mt-2 text-xs text-ink-500">That's the last bottle, so the wine moves to Finished.</p>}
        <button
          type="button"
          onClick={save}
          disabled={rating === 0 || saving}
          className="rounded-2xl bg-wine-800 py-3.5 font-semibold text-white active:bg-wine-900 disabled:opacity-40"
        >
          Save tasting
        </button>
      </div>
    </Sheet>
  );
}
