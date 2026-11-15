import { useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { setPendingPhotos } from '../lib/pendingPhotos.ts';

const MAX_PHOTOS = 3;

/**
 * A button that opens the phone's own photo menu (on iPhone: Photo Library / Take Photo /
 * Choose File), then goes to the scan page with the chosen photos. The file input has no
 * `capture` attribute on purpose: that would skip the menu and open the camera only.
 */
export function PickPhotosButton({
  list,
  className,
  label,
  children,
}: {
  list: 'cellar' | 'wishlist';
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (!files.length) return; // menu dismissed
          setPendingPhotos(files.slice(0, MAX_PHOTOS));
          navigate(`/add?list=${list}`);
        }}
      />
      <button type="button" aria-label={label} className={className} onClick={() => input.current?.click()}>
        {children}
      </button>
    </>
  );
}
