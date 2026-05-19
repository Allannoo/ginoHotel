import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Onboarding } from '@/components/Onboarding';
import { useCurrentUser, useAuth } from '@/store/auth';
import type { PermissionKey } from '@/types';

// Lazy-loading страниц (code splitting)
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const GridPage = lazy(() => import('@/pages/GridPage'));
const PropertiesPage = lazy(() => import('@/pages/PropertiesPage'));
const ChannelsPage = lazy(() => import('@/pages/ChannelsPage'));
const GuestsPage = lazy(() => import('@/pages/GuestsPage'));
const FinancePage = lazy(() => import('@/pages/FinancePage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-32 rounded-card" />
      ))}
    </div>
  );
}

function FullPageLoader() {
  return <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">Загрузка…</div>;
}

// Защищённый раздел с проверкой прав
function Protected({ perm, children }: { perm: PermissionKey; children: React.ReactNode }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && !user.permissions.includes(perm)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const user = useCurrentUser();
  const location = useLocation();
  const hasHydrated = useAuth.persist?.hasHydrated?.() ?? true;

  if (!hasHydrated) return <FullPageLoader />;

  return (
    <ErrorBoundary>
      {user && <Onboarding />}
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : (
              <Suspense fallback={<FullPageLoader />}>
                <LoginPage />
              </Suspense>
            )
          }
        />
        {user ? (
          <Route element={<MainLayout />}>
            <Route path="/" element={<Protected perm="dashboard"><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></Protected>} />
            <Route path="/grid" element={<Protected perm="grid"><Suspense fallback={<PageLoader />}><GridPage /></Suspense></Protected>} />
            <Route path="/properties" element={<Protected perm="properties"><Suspense fallback={<PageLoader />}><PropertiesPage /></Suspense></Protected>} />
            <Route path="/channels" element={<Protected perm="channels"><Suspense fallback={<PageLoader />}><ChannelsPage /></Suspense></Protected>} />
            <Route path="/guests" element={<Protected perm="guests"><Suspense fallback={<PageLoader />}><GuestsPage /></Suspense></Protected>} />
            <Route path="/finance" element={<Protected perm="finance"><Suspense fallback={<PageLoader />}><FinancePage /></Suspense></Protected>} />
            <Route path="/tasks" element={<Protected perm="tasks"><Suspense fallback={<PageLoader />}><TasksPage /></Suspense></Protected>} />
            <Route path="/settings" element={<Protected perm="settings"><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></Protected>} />
            <Route path="/team" element={<Protected perm="team"><Suspense fallback={<PageLoader />}><TeamPage /></Suspense></Protected>} />
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
        )}
      </Routes>
    </ErrorBoundary>
  );
}
