import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const RoomServicePage = lazy(() => import('@/pages/RoomServicePage'));
const LocksPage = lazy(() => import('@/pages/LocksPage'));
const MvdPage = lazy(() => import('@/pages/MvdPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Каркас экрана при ленивой подгрузке страницы:
// фейк-шапка + сетка skeleton-карточек + строки таблицы.
function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-7 w-56 rounded-md" />
          <div className="skeleton h-4 w-72 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-10 w-36 rounded-btn" />
          <div className="skeleton h-10 w-28 rounded-btn" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="skeleton h-72 rounded-card lg:col-span-2" />
        <div className="skeleton h-72 rounded-card" />
      </div>
    </motion.div>
  );
}

// Премиальный полноэкранный лоадер с пульсирующим логотипом "G"
function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bg via-surface to-bg gap-6">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-primary via-gold to-primary opacity-30 blur-xl"
        />
        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-[#08111f] flex items-center justify-center shadow-2xl">
          <span className="font-display text-5xl text-gold leading-none">G</span>
        </div>
      </motion.div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted font-bold">GinoHotel</p>
    </div>
  );
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
            <Route path="/pricing" element={<Protected perm="pricing"><Suspense fallback={<PageLoader />}><PricingPage /></Suspense></Protected>} />
            <Route path="/expenses" element={<Protected perm="expenses"><Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense></Protected>} />
            <Route path="/roomservice" element={<Protected perm="roomservice"><Suspense fallback={<PageLoader />}><RoomServicePage /></Suspense></Protected>} />
            <Route path="/locks" element={<Protected perm="locks"><Suspense fallback={<PageLoader />}><LocksPage /></Suspense></Protected>} />
            <Route path="/mvd" element={<Protected perm="mvd"><Suspense fallback={<PageLoader />}><MvdPage /></Suspense></Protected>} />
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
        )}
      </Routes>
    </ErrorBoundary>
  );
}
