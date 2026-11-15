import { Link, NavLink, useLocation } from 'react-router';
import { PickPhotosButton } from './PickPhotosButton.tsx';

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-1 text-xs font-medium ${isActive ? 'text-wine-800' : 'text-ink-500'}`;

export function TabBar() {
  const { pathname } = useLocation();
  // Only on the two list screens; the add/detail/edit screens have their own actions.
  if (pathname !== '/cellar' && pathname !== '/wishlist') return null;
  const list = pathname === '/wishlist' ? 'wishlist' : 'cellar';

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-end px-6 pt-1.5">
        <NavLink to="/cellar" className={tab}>
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 3h8c.3 3.5.6 6.5-.8 8.6-.8 1.3-2 1.9-3.2 2-1.2-.1-2.4-.7-3.2-2C7.4 9.5 7.7 6.5 8 3z" />
            <path d="M12 14v6M8.5 20.5h7" strokeLinecap="round" />
          </svg>
          Cellar
        </NavLink>

        <div className="flex flex-col items-center gap-0.5">
          {/* Opens the phone's own menu: Photo Library / Take Photo / Choose File. */}
          <PickPhotosButton
            list={list}
            label="Scan a bottle"
            className="-mt-6 grid size-14 place-items-center rounded-full bg-wine-800 text-white shadow-lg shadow-wine-900/30 active:bg-wine-900"
          >
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </PickPhotosButton>
          <Link
            to={`/add?list=${list}&manual=1`}
            aria-label="Add manually"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-ink-500 active:text-wine-800"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20h4L19 9l-4-4L4 16z" strokeLinejoin="round" />
            </svg>
            Manually
          </Link>
        </div>

        <NavLink to="/wishlist" className={tab}>
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" strokeLinejoin="round" />
          </svg>
          Wishlist
        </NavLink>
      </div>
    </nav>
  );
}
