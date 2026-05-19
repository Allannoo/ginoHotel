// Раздел «Команда» — тонкая обёртка вокруг универсального TeamManager.
// Тот же компонент используется во вкладке «Сотрудники» в Настройках,
// чтобы интерфейс был идентичным в обоих местах.
import { useMemo } from 'react';
import { Trophy, Sparkles, ClipboardList, Clock3, Star } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TeamManager } from '@/components/TeamManager';
import { useAuth, ROLE_LABEL } from '@/store/auth';
import { cn } from '@/utils/format';

// Детерминированный KPI-мок (на каждого сотрудника свои стабильные цифры)
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface MemberKpi {
  bookings: number;
  rooms: number;
  responseMin: number;
  rating: number;        // 1-5
  hours: number;         // ч/мес
  efficiency: number;    // 0-100%
}

function kpiFor(id: string, role: string): MemberKpi {
  const h = hash(id);
  const isCleaner = role === 'cleaner';
  const isManager = role === 'manager' || role === 'admin';
  return {
    bookings: isManager ? 40 + (h % 60) : isCleaner ? 0 : 15 + (h % 35),
    rooms: isCleaner ? 80 + (h % 80) : isManager ? 0 : 20 + (h % 30),
    responseMin: 2 + (h % 8),
    rating: Math.round(((4.2 + (h % 70) / 100) + Number.EPSILON) * 10) / 10,
    hours: 140 + (h % 60),
    efficiency: 65 + (h % 35),
  };
}

export default function TeamPage() {
  const team = useAuth((s) => s.team);
  const active = useMemo(() => team.filter((m) => m.active), [team]);
  const stats = useMemo(() => active.map((m) => ({ member: m, kpi: kpiFor(m.id, m.role) })), [active]);

  // Лидеры по 3 номинациям
  const leaders = useMemo(() => {
    if (stats.length === 0) return null;
    const byBookings = [...stats].sort((a, b) => b.kpi.bookings - a.kpi.bookings)[0];
    const byRooms = [...stats].sort((a, b) => b.kpi.rooms - a.kpi.rooms)[0];
    const byRating = [...stats].sort((a, b) => b.kpi.rating - a.kpi.rating)[0];
    return { byBookings, byRooms, byRating };
  }, [stats]);

  return (
    <PageTransition>
      <PageHeader title="Команда" subtitle="Сотрудники, роли, доступы · KPI этого месяца" />

      {/* Лидеры месяца */}
      {leaders && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <LeaderCard icon={<ClipboardList className="h-4 w-4" />} title="Больше всего броней" name={leaders.byBookings.member.name} value={`${leaders.byBookings.kpi.bookings} броней`} avatar={leaders.byBookings.member.avatar} />
          <LeaderCard icon={<Sparkles className="h-4 w-4" />} title="Лидер по уборкам" name={leaders.byRooms.member.name} value={`${leaders.byRooms.kpi.rooms} номеров`} avatar={leaders.byRooms.member.avatar} />
          <LeaderCard icon={<Star className="h-4 w-4" />} title="Высший рейтинг гостей" name={leaders.byRating.member.name} value={`★ ${leaders.byRating.kpi.rating}`} avatar={leaders.byRating.member.avatar} />
        </div>
      )}

      {/* KPI по каждому */}
      <Card padding="md" className="mb-5">
        <CardHeader
          title="KPI сотрудников"
          subtitle="Брони, обслуженные номера, время реакции, рейтинг гостей, отработанные часы и общая эффективность"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] uppercase font-bold text-text-muted">Сотрудник</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase font-bold text-text-muted">Роль</th>
                <th className="px-3 py-2 text-right text-[11px] uppercase font-bold text-text-muted"><ClipboardList className="inline h-3 w-3 mr-1" />Брони</th>
                <th className="px-3 py-2 text-right text-[11px] uppercase font-bold text-text-muted"><Sparkles className="inline h-3 w-3 mr-1" />Уборки</th>
                <th className="px-3 py-2 text-right text-[11px] uppercase font-bold text-text-muted"><Clock3 className="inline h-3 w-3 mr-1" />Реакция</th>
                <th className="px-3 py-2 text-right text-[11px] uppercase font-bold text-text-muted"><Star className="inline h-3 w-3 mr-1" />Рейтинг</th>
                <th className="px-3 py-2 text-right text-[11px] uppercase font-bold text-text-muted">Часов</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase font-bold text-text-muted">Эффективность</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && (
                <tr><td colSpan={8} className="text-center py-6 text-text-muted">Добавьте сотрудников ниже</td></tr>
              )}
              {stats.map(({ member, kpi }) => (
                <tr key={member.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} src={member.avatar} size="sm" />
                      <span className="font-bold text-text">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2"><Badge tone="neutral">{ROLE_LABEL[member.role]}</Badge></td>
                  <td className="px-3 py-2 text-right font-mono text-text">{kpi.bookings || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-text">{kpi.rooms || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-muted">{kpi.responseMin} мин</td>
                  <td className="px-3 py-2 text-right font-bold text-gold">★ {kpi.rating}</td>
                  <td className="px-3 py-2 text-right font-mono text-text-muted">{kpi.hours} ч</td>
                  <td className="px-3 py-2 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', kpi.efficiency >= 85 ? 'bg-success' : kpi.efficiency >= 70 ? 'bg-primary' : 'bg-warning')}
                          style={{ width: `${kpi.efficiency}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-text w-9 text-right">{kpi.efficiency}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TeamManager />
    </PageTransition>
  );
}

function LeaderCard({ icon, title, name, value, avatar }: { icon: React.ReactNode; title: string; name: string; value: string; avatar?: string }) {
  return (
    <Card padding="md" className="border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-btn bg-gold/15 flex items-center justify-center text-gold">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase font-bold text-text-muted flex items-center gap-1">{icon}{title}</p>
          <p className="font-bold text-text truncate">{name}</p>
        </div>
        <Avatar name={name} src={avatar} size="md" />
      </div>
      <p className="text-2xl font-display text-gold mt-2">{value}</p>
    </Card>
  );
}
