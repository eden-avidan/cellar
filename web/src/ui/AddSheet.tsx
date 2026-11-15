import { useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { setPendingPhotos } from '../lib/pendingPhotos.ts';
import { Sheet } from './Sheet.tsx';

const MAX_PHOTOS = 3;

function Option({ icon, title, hint, onClick }: { icon: ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-ink-200 active:bg-cream-100"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-wine-50 text-2xl">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-500">{hint}</span>
      </span>
    </button>
  );
}

/** The add menu: photograph the label, pick a photo from the library, or type the details in. */
export function AddSheet({ list, onClose }: { list: 'cellar' | 'wishlist'; onClose: () => void }) {
  const navigate = useNavigate();
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  const picked = (files: FileList | null) => {
    if (!files?.length) return; // picker cancelled: keep the menu open
    setPendingPhotos([...files].slice(0, MAX_PHOTOS));
    onClose();
    navigate(`/add?list=${list}`);
  };

  return (
    <Sheet title={list === 'wishlist' ? 'Add to wishlist' : 'Add a bottle'} onClose={onClose}>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => picked(e.target.files)} />
      <input ref={library} type="file" accept="image/*" multiple hidden onChange={(e) => picked(e.target.files)} />
      <div className="flex flex-col gap-2.5 pb-2">
        <Option icon="📷" title="Take photo" hint="Photograph the front label" onClick={() => camera.current?.click()} />
        <Option icon="🖼️" title="Choose from library" hint="Up to 3 photos, e.g. front and back" onClick={() => library.current?.click()} />
        <Option
          icon="🍷"
          title="From my wines"
          hint={list === 'wishlist' ? 'Want a finished wine again' : "Another bottle of a wine you've had"}
          onClick={() => {
            onClose();
            navigate(`/add/previous?list=${list}`);
          }}
        />
        <div className="my-1 flex items-center gap-3 text-xs text-ink-500">
          <hr className="flex-1 border-ink-200" />
          or
          <hr className="flex-1 border-ink-200" />
        </div>
        <Option
          icon="✍️"
          title="Add manually"
          hint="Type the details in yourself"
          onClick={() => {
            onClose();
            navigate(`/add?list=${list}&manual=1`);
          }}
        />
      </div>
    </Sheet>
  );
}
