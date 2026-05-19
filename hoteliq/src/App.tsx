import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Onboarding } from '@/components/Onboarding';

// Lazy-loading страниц (code splitting)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const GridPage = lazy(() => import('@/pages/GridPage'));
const PropertiesPage = lazy(() => import('@/pages/PropertiesPage'));
const ChannelsPage = lazy(() => import('@/pages/ChannelsPage'));
const GuestsPage = lazy(() => import('@/pages/GuestsPage'));
const FinancePage = lazy(() => import('@/pages/FinancePage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
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

export default function App() {
  return (
    <ErrorBoundary>
      <Onboarding />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/grid" element={<Suspense fallback={<PageLoader />}><GridPage /></Suspense>} />
          <Route path="/properties" element={<Suspense fallback={<PageLoader />}><PropertiesPage /></Suspense>} />
          <Route path="/channels" element={<Suspense fallback={<PageLoader />}><ChannelsPage /></Suspense>} />
          <Route path="/guests" element={<Suspense fallback={<PageLoader />}><GuestsPage /></Suspense>} />
          <Route path="/finance" element={<Suspense fallback={<PageLoader />}><FinancePage /></Suspense>} />
          <Route path="/tasks" element={<Suspense fallback={<PageLoader />}><TasksPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
