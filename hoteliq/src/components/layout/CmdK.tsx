// Глобальный поиск Cmd+K с fuzzy-фильтром по сущностям
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Building2, Users, CalendarRange, Wallet, ListChecks, Radio, Settings, LayoutDashboard } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '@/store/ui';
import { properties, guests, bookings } from '@/mock/data';

interface Result { id: string; icon: React.ReactNode; title: string; subtitle: string; to: string; }

export function CmdK() {
  const { cmdkOpen, setCmdk } = useUi();
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const results = useMemo<Result[]>(() => {
    const navItems: Result[] = [
      { id: 'n1', icon: <LayoutDashboard className="h-4 w-4" />, title: 'Дашборд', subtitle: 'Главная страница', to: '/' },
      { id: 'n2', icon: <CalendarRange className="h-4 w-4" />, title: 'Шахматка', subtitle: 'Календарь бронирований', to: '/grid' },
      { id: 'n3', icon: <Building2 className="h-4 w-4" />, title: 'Объекты', subtitle: 'Управление недвижимостью', to: '/properties' },
      { id: 'n4', icon: <Radio className="h-4 w-4" />, title: 'Каналы', subtitle: 'OTA подключения', to: '/channels' },
      { id: 'n5', icon: <Users className="h-4 w-4" />, title: 'Гости', subtitle: 'CRM база', to: '/guests' },
      { id: 'n6', icon: <Wallet className="h-4 w-4" />, title: 'Финансы', subtitle: 'Доходы и отчёты', to: '/finance' },
      { id: 'n7', icon: <ListChecks className="h-4 w-4" />, title: 'Задачи', subtitle: 'Kanban доска', to: '/tasks' },
      { id: 'n8', icon: <Settings className="h-4 w-4" />, title: 'Настройки', subtitle: 'Профиль и интеграции', to: '/settings' },
    ];

    const propItems: Result[] = properties.map((p) => ({
      id: p.id, icon: <Building2 className="h-4 w-4" />, title: p.name,
      subtitle: `${p.city} • ${p.rooms} ${p.type === 'hotel' ? 'номеров' : 'апт'}`, to: `/properties`,
    }));
    const guestItems: Result[] = guests.slice(0, 30).map((g) => ({
      id: g.id, icon: <Users className="h-4 w-4" />, title: `${g.firstName} ${g.lastName}`,
      subtitle: g.email, to: '/guests',
    }));
    const bookItems: Result[] = bookings.slice(0, 30).map((b) => ({
      id: b.id, icon: <CalendarRange className="h-4 w-4" />, title: `Бронь: ${b.guestName}`,
      subtitle: `${b.checkIn} → ${b.checkOut}`, to: '/grid',
    }));

    const all = [...navItems, ...propItems, ...guestItems, ...bookItems];
    if (!q.trim()) return all.slice(0, 12);
    const lc = q.toLowerCase();
    return all.filter((r) => (r.title + r.subtitle).toLowerCase().includes(lc)).slice(0, 20);
  }, [q]);

  const handleSelect = (to: string) => {
    setCmdk(false);
    setQ('');
    navigate(to);
  };

  return (
    <AnimatePresence>
      {cmdkOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setCmdk(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="w-full max-w-xl bg-bg border border-border rounded-modal shadow-lift overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
              <Search className="h-5 w-5 text-text-muted" />
              <input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск: брони, гости, объекты, разделы…"
                className="flex-1 bg-transparent outline-none text-text placeholder:text-text-muted text-sm"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-text-muted">ESC</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="text-center text-sm text-text-muted py-8">Ничего не найдено</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r.to)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2 transition-colors text-left"
                  >
                    <span className="h-8 w-8 rounded-btn bg-surface flex items-center justify-center text-text-muted">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{r.title}</p>
                      <p className="text-xs text-text-muted truncate">{r.subtitle}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
