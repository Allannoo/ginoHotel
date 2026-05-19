import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CalendarRange, Building2, Radio, Users,
  Wallet, ListChecks, Settings, ChevronsLeft, ChevronsRight,
  Sun, Moon, Sparkles, UserCog, LogOut,
} from 'lucide-react';
import { useUi } from '@/store/ui';
import { useThemeStore } from '@/store/theme';
import { useAuth, useCurrentUser } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/format';
import type { PermissionKey } from '@/types';

const nav: { to: string; icon: any; label: string; end?: boolean; perm: PermissionKey }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд', end: true, perm: 'dashboard' },
  { to: '/grid', icon: CalendarRange, label: 'Календарь броней', perm: 'grid' },
  { to: '/properties', icon: Building2, label: 'Объекты', perm: 'properties' },
  { to: '/channels', icon: Radio, label: 'Каналы', perm: 'channels' },
  { to: '/guests', icon: Users, label: 'Гости', perm: 'guests' },
  { to: '/finance', icon: Wallet, label: 'Финансы', perm: 'finance' },
  { to: '/tasks', icon: ListChecks, label: 'Задачи', perm: 'tasks' },
  { to: '/team', icon: UserCog, label: 'Команда', perm: 'team' },
  { to: '/settings', icon: Settings, label: 'Настройки', perm: 'settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileDrawerOpen, setMobileDrawer } = useUi();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const logout = useAuth((s) => s.logout);

  const collapsed = sidebarCollapsed;
  const visibleNav = nav.filter((n) => !currentUser || currentUser.role === 'admin' || currentUser.permissions.includes(n.perm));

  return (
    <>
      {/* Подложка для мобильного drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileDrawer(false)} />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-surface border-r border-border transition-all duration-300 ease-smooth',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
          'w-[260px]',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Лого */}
        <div className={cn('h-16 flex items-center border-b border-border px-4 gap-3', collapsed && 'lg:justify-center lg:px-2')}>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-display text-lg shrink-0 shadow-soft">G</div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg leading-none text-text">GinoHotel</p>
              <p className="text-[10px] text-text-muted mt-0.5">PMS Platform</p>
            </div>
          )}
        </div>

        {/* Навигация */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNav.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileDrawer(false)}
                className={cn(
                  'relative flex items-center gap-3 rounded-btn px-3 h-10 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text',
                  collapsed && 'lg:justify-center lg:px-2',
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-primary"
                    transition={{ duration: 0.25 }}
                  />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Низ: AI статус */}
        <div className={cn('px-3 pb-3 space-y-2', collapsed && 'lg:px-2')}>
          {!collapsed && (
            <div className="rounded-card border border-border bg-bg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-xs font-bold text-text">AI-ассистент</span>
                <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
              </div>
              <p className="text-[11px] text-text-muted leading-snug">3 рекомендации готовы к просмотру</p>
            </div>
          )}

          {/* Профиль пользователя + выход */}
          {currentUser && (
            <div className={cn(
              'flex items-center gap-2.5 p-2 rounded-card border border-border bg-bg',
              collapsed && 'lg:justify-center lg:p-1.5',
            )}>
              <Avatar name={currentUser.name} size="sm" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text truncate leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-text-muted truncate mt-1">{currentUser.role === 'admin' ? 'Директор' : currentUser.email}</p>
                </div>
              )}
              <button
                onClick={() => { logout(); navigate('/login'); }}
                title="Выйти"
                className="text-text-muted hover:text-error transition-colors shrink-0 h-7 w-7 rounded-btn hover:bg-surface-2 flex items-center justify-center"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Темa + collapse */}
          <div className={cn('flex items-center gap-2', collapsed ? 'lg:flex-col' : 'justify-between')}>
            <button
              onClick={toggleTheme}
              className="flex-1 h-9 rounded-btn border border-border hover:bg-surface-2 flex items-center justify-center gap-2 text-xs font-semibold text-text-muted transition-colors"
              title="Переключить тему"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {!collapsed && <span>{theme === 'light' ? 'Тёмная' : 'Светлая'}</span>}
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex h-9 w-9 rounded-btn border border-border hover:bg-surface-2 items-center justify-center text-text-muted transition-colors shrink-0"
              title="Свернуть"
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
