import { Menu, Search, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { useCurrentUser, useImpersonation, ROLE_LABEL, useAuth } from '@/store/auth';
import { useEffect, useState, useRef } from 'react';
import type { UserRole } from '@/types';
import { cn } from '@/utils/format';

export function Header() {
  const { setMobileDrawer, setCmdk } = useUi();
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Горячая клавиша Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdk(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCmdk]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={() => setMobileDrawer(true)}
        className="lg:hidden h-10 w-10 rounded-btn hover:bg-surface-2 flex items-center justify-center text-text"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Поиск (Cmd+K) */}
      <button
        onClick={() => setCmdk(true)}
        className="flex items-center gap-3 h-10 px-3.5 rounded-btn bg-surface border border-border text-text-muted text-sm hover:bg-surface-2 transition-colors flex-1 max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Поиск по платформе…</span>
        <span className="hidden md:inline ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-bg">⌘K</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <RoleSwitcher />

        <Button
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          className="hidden sm:inline-flex"
          onClick={() => navigate('/grid?new=1')}
        >
          Новая бронь
        </Button>

        <NotificationsBell />

        <button
          onClick={() => navigate('/settings?tab=profile')}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          title={user?.name ? `${user.name} — настройки профиля` : 'Настройки профиля'}
          aria-label="Профиль"
        >
          <Avatar name={user?.name ?? 'Аккаунт'} src={user?.avatar} size="md" />
        </button>
      </div>
    </header>
  );
}

// =====================================================================
// Свитч ролей: «Смотреть как директор / менеджер / ресепшен / уборка»
// — это импersonation, не меняет реального пользователя.
// =====================================================================
function RoleSwitcher() {
  const realRole = useAuth((s) => s.team.find((u) => u.id === s.currentUserId)?.role) ?? null;
  const imp = useImpersonation((s) => s.role);
  const setImp = useImpersonation((s) => s.setRole);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Закрыть при клике вне
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (realRole !== 'admin') return null; // только директор может «примерять» роли

  const current = imp ?? realRole;
  const roles: UserRole[] = ['admin', 'manager', 'reception', 'cleaner'];

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 h-10 px-3 rounded-btn border text-xs font-semibold transition-colors',
          imp ? 'border-warning/40 bg-warning/10 text-warning' : 'border-border bg-surface text-text-muted hover:bg-surface-2',
        )}
        title="Просмотр интерфейса от лица роли"
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="whitespace-nowrap">{imp ? `Смотрю как: ${ROLE_LABEL[current]}` : 'Смотреть как'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-56 bg-surface border border-border rounded-card shadow-xl py-1.5">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                setImp(r === realRole ? null : r);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-surface-2 flex items-center justify-between',
                current === r && 'text-primary font-bold',
              )}
            >
              <span>{ROLE_LABEL[r]}</span>
              {current === r && <span className="text-[10px] text-text-muted">текущая</span>}
            </button>
          ))}
          {imp && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => { setImp(null); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 text-warning font-semibold"
              >
                Вернуться к своей роли
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
