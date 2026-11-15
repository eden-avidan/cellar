import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth/AuthProvider.tsx';
import { LoginPage } from './auth/LoginPage.tsx';
import { AddWinePage } from './features/AddWinePage.tsx';
import { EditWinePage } from './features/EditWinePage.tsx';
import { PreviousWinesPage } from './features/PreviousWinesPage.tsx';
import { WineDetailPage } from './features/WineDetailPage.tsx';
import { WineListPage } from './features/WineListPage.tsx';
import { TabBar } from './ui/TabBar.tsx';

export function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-ink-500">Opening the cellar…</div>;
  }
  if (!user) return <LoginPage />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/cellar" replace />} />
        <Route path="/cellar" element={<WineListPage key="cellar" list="cellar" />} />
        <Route path="/wishlist" element={<WineListPage key="wishlist" list="wishlist" />} />
        <Route path="/add" element={<AddWinePage />} />
        <Route path="/add/previous" element={<PreviousWinesPage />} />
        <Route path="/wine/:id" element={<WineDetailPage />} />
        <Route path="/wine/:id/edit" element={<EditWinePage />} />
        <Route path="*" element={<Navigate to="/cellar" replace />} />
      </Routes>
      <TabBar />
    </>
  );
}
