// Страница «Дашборд» — главная
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Area, AreaChart,
  BarChart, Bar,
} from 'recharts';
import {
  TrendingUp, Wallet, BedDouble, Activity, Users, CalendarCheck,
  Sparkles, AlertTriangle, AlertCircle, Info, ArrowUpRight, ArrowDownRight, Target,
  LogIn, LogOut, ClipboardList, KeyRound, Sparkle, Percent, PiggyBank,
} from 'lucide-react';
import { PageTransition, StaggerList, staggerItem } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountUp } from '@/components/ui/CountUp';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import {
  kpiToday, bookingTrend, channelDistribution, aiInsights, alerts, upcomingCheckins, bookings, rooms,
} from '@/mock/data';
import { fmtDateShort, fmtMoney } from '@/utils/format';
import { cn } from '@/utils/format';
import { useCurrentUser } from '@/store/auth';

// ---------- KPI карточка ----------
function KpiCard({
  icon, label, value, format, delta, tone = 'primary', onClick,
}: {
  icon: React.ReactNode; label: string; value: number;
  format: 'number' | 'money' | 'percent' | 'compact-money';
  delta: number; tone?: 'primary' | 'success' | 'gold' | 'info';
  onClick?: () => void;
}) {
  const positive = delta >= 0;
  const toneBg = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    gold: 'bg-gold/15 text-gold',
    info: 'bg-info/10 text-info',
  }[tone];
  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card hoverable onClick={onClick} className="h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('h-10 w-10 rounded-btn flex items-center justify-center', toneBg)}>
            {icon}
          </div>
          <Badge tone={positive ? 'success' : 'error'} dot>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </Badge>
        </div>
        <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{label}</p>
        <p className="font-display text-2xl sm:text-3xl text-text mt-1 break-words">
          <CountUp value={value} format={format} />
        </p>
        <p className={cn('text-[10px] mt-2 font-semibold', onClick ? 'text-primary' : 'invisible')}>
          Подробнее →
        </p>
      </Card>
    </motion.div>
  );
}

// ---------- Кастомный тултип для recharts ----------
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg border border-border rounded-btn shadow-lift px-3 py-2 text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold text-text">
          {p.name}: <span style={{ color: p.color }}>{p.value.toLocaleString('ru-RU')}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const role = user?.role ?? 'admin';
  const isReception = role === 'reception';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const [drillKey, setDrillKey] = useState<null | 'revenue' | 'occupancy' | 'adr' | 'revpar' | 'bookings' | 'guests' | 'checkin' | 'checkout' | 'free' | 'tasks' | 'margin'>(null);
  const [todayOpen, setTodayOpen] = useState(false);

  // Метрики для ресепшен — вычисляем из mock
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const checkInToday = bookings.filter((b) => {
    const d = new Date(b.checkIn); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
  const checkOutToday = bookings.filter((b) => {
    const d = new Date(b.checkOut); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
  const freeRooms = rooms.filter((r) => r.status === 'clean').length;
  const pendingHousekeeping = rooms.filter((r) => r.status === 'dirty' || r.status === 'inspection').length;

  // Метрики для директора: маржа (мок)
  const margin = 38; // %
  const monthRevenue = kpiToday.revenueToday * 28;

  const greetName = user?.name?.split(' ')[0] ?? 'Алексей';
  const greetSubtitle = isReception
    ? 'Заезды, выезды и состояние номеров на смене'
    : isAdmin ? 'Финансовая сводка по объектам за сегодня'
    : isManager ? 'Операционная сводка по объектам'
    : 'Сводка за сегодня';
  return (
    <PageTransition>
      <PageHeader
        title={`Здравствуйте, ${greetName}!`}
        subtitle={greetSubtitle}
        action={
          <>
            <Button variant="outline" size="md" onClick={() => setTodayOpen(true)}>Сегодня</Button>
            <Button size="md" leftIcon={<TrendingUp className="h-4 w-4" />} onClick={() => navigate('/reports')}>Отчёт</Button>
          </>
        }
      />

      {/* KPI — зависит от роли */}
      {isReception ? (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={<LogIn className="h-5 w-5" />} label="Заезды сегодня" value={checkInToday} format="number" delta={0} tone="primary" onClick={() => setDrillKey('checkin')} />
          <KpiCard icon={<LogOut className="h-5 w-5" />} label="Выезды сегодня" value={checkOutToday} format="number" delta={0} tone="info" onClick={() => setDrillKey('checkout')} />
          <KpiCard icon={<KeyRound className="h-5 w-5" />} label="Свободно номеров" value={freeRooms} format="number" delta={0} tone="success" onClick={() => setDrillKey('free')} />
          <KpiCard icon={<Sparkle className="h-5 w-5" />} label="К уборке" value={pendingHousekeeping} format="number" delta={0} tone="gold" onClick={() => setDrillKey('tasks')} />
        </StaggerList>
      ) : isAdmin ? (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <KpiCard icon={<Wallet className="h-5 w-5" />} label="Выручка сегодня" value={kpiToday.revenueToday} format="compact-money" delta={12} tone="success" onClick={() => setDrillKey('revenue')} />
          <KpiCard icon={<PiggyBank className="h-5 w-5" />} label="Маржа" value={margin} format="percent" delta={2} tone="gold" onClick={() => setDrillKey('margin')} />
          <KpiCard icon={<Activity className="h-5 w-5" />} label="Загрузка" value={kpiToday.occupancy} format="percent" delta={4} tone="primary" onClick={() => setDrillKey('occupancy')} />
          <KpiCard icon={<BedDouble className="h-5 w-5" />} label="ADR" value={kpiToday.adr} format="money" delta={3} tone="gold" onClick={() => setDrillKey('adr')} />
          <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="RevPAR" value={kpiToday.revpar} format="money" delta={-2} tone="info" onClick={() => setDrillKey('revpar')} />
          <KpiCard icon={<Percent className="h-5 w-5" />} label="Выручка / мес." value={monthRevenue} format="compact-money" delta={9} tone="success" onClick={() => setDrillKey('revenue')} />
        </StaggerList>
      ) : isManager ? (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <KpiCard icon={<Activity className="h-5 w-5" />} label="Загрузка" value={kpiToday.occupancy} format="percent" delta={4} tone="primary" onClick={() => setDrillKey('occupancy')} />
          <KpiCard icon={<CalendarCheck className="h-5 w-5" />} label="Активные брони" value={kpiToday.activeBookings} format="number" delta={8} tone="primary" onClick={() => setDrillKey('bookings')} />
          <KpiCard icon={<Users className="h-5 w-5" />} label="Гости сегодня" value={kpiToday.guestsToday} format="number" delta={5} tone="success" onClick={() => setDrillKey('guests')} />
          <KpiCard icon={<BedDouble className="h-5 w-5" />} label="ADR" value={kpiToday.adr} format="money" delta={3} tone="gold" onClick={() => setDrillKey('adr')} />
          <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="RevPAR" value={kpiToday.revpar} format="money" delta={-2} tone="info" onClick={() => setDrillKey('revpar')} />
          <KpiCard icon={<Sparkle className="h-5 w-5" />} label="К уборке" value={pendingHousekeeping} format="number" delta={0} tone="gold" onClick={() => setDrillKey('tasks')} />
        </StaggerList>
      ) : (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <KpiCard icon={<Activity className="h-5 w-5" />} label="Загрузка" value={kpiToday.occupancy} format="percent" delta={4} tone="primary" />
          <KpiCard icon={<Wallet className="h-5 w-5" />} label="Выручка сегодня" value={kpiToday.revenueToday} format="compact-money" delta={12} tone="success" />
          <KpiCard icon={<BedDouble className="h-5 w-5" />} label="ADR" value={kpiToday.adr} format="money" delta={3} tone="gold" />
          <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="RevPAR" value={kpiToday.revpar} format="money" delta={-2} tone="info" />
          <KpiCard icon={<CalendarCheck className="h-5 w-5" />} label="Активные брони" value={kpiToday.activeBookings} format="number" delta={8} tone="primary" />
          <KpiCard icon={<Users className="h-5 w-5" />} label="Гости сегодня" value={kpiToday.guestsToday} format="number" delta={5} tone="success" />
        </StaggerList>
      )}

      {/* Графики */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2" padding="md">
          <CardHeader
            title="Динамика бронирований"
            subtitle="Последние 30 дней"
            action={<Badge tone="success" dot>+18% к прошлому месяцу</Badge>}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--accent-primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="rgb(var(--accent-primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="rgb(var(--text-muted))" fontSize={11} interval={4} />
                <YAxis stroke="rgb(var(--text-muted))" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="bookings" name="Брони" stroke="rgb(var(--accent-primary))" strokeWidth={2.5} fill="url(#g1)" />
                <Line type="monotone" dataKey="bookings" stroke="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="Источники броней" subtitle="Распределение за месяц" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2}>
                  {channelDistribution.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {channelDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-text-muted truncate flex-1">{c.name}</span>
                <span className="text-text font-semibold">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI инсайты + Алёрты + Заезды */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* AI инсайты */}
        <Card padding="md">
          <CardHeader
            title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /> AI-инсайты</span>}
            subtitle="Рекомендации на сегодня"
          />
          <div className="space-y-3">
            {aiInsights.map((a) => {
              const INSIGHT_ICON: Record<string, { Icon: typeof TrendingUp; tone: string }> = {
                trending: { Icon: TrendingUp, tone: 'bg-success/15 text-success' },
                warning: { Icon: AlertTriangle, tone: 'bg-warning/15 text-warning' },
                target: { Icon: Target, tone: 'bg-primary/15 text-primary' },
              };
              const cfg = INSIGHT_ICON[a.icon] ?? INSIGHT_ICON.target;
              const { Icon } = cfg;
              return (
                <div key={a.id} className="flex gap-3 p-3 rounded-btn bg-surface-2 hover-lift cursor-pointer">
                  <div className={cn('h-9 w-9 rounded-btn flex items-center justify-center shrink-0', cfg.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text">{a.title}</p>
                    <p className="text-xs text-text-muted leading-snug mt-1">{a.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Алёрты */}
        <Card padding="md">
          <CardHeader title="Алёрты" subtitle="Требуют вашего внимания" />
          <div className="space-y-3">
            {alerts.map((a) => {
              const config = {
                error: { Icon: AlertCircle, bg: 'bg-error/10', color: 'text-error' },
                warning: { Icon: AlertTriangle, bg: 'bg-warning/10', color: 'text-warning' },
                info: { Icon: Info, bg: 'bg-info/10', color: 'text-info' },
              }[a.level];
              const { Icon } = config;
              return (
                <div key={a.id} className="flex gap-3 p-3 rounded-btn border border-border hover-lift cursor-pointer">
                  <div className={cn('h-9 w-9 rounded-btn flex items-center justify-center shrink-0', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text">{a.title}</p>
                    <p className="text-xs text-text-muted leading-snug mt-0.5">{a.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Предстоящие заезды */}
        <Card padding="md">
          <CardHeader title="Предстоящие заезды" subtitle="Ближайшие 48 часов" />
          <div className="space-y-3">
            {upcomingCheckins.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">Заездов в ближайшие 2 дня нет</p>
            )}
            {upcomingCheckins.map(({ booking, guest, property }) => (
              <div key={booking.id} className="flex items-center gap-3 p-2 rounded-btn hover:bg-surface-2 transition-colors cursor-pointer">
                <Avatar name={`${guest.firstName} ${guest.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text truncate">{guest.firstName} {guest.lastName}</p>
                  <p className="text-xs text-text-muted truncate">{property.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{fmtDateShort(booking.checkIn)}</p>
                  <p className="text-[10px] text-text-muted">{booking.guests} гост.</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Сводка «Сегодня» — быстрый снимок ключевых показателей дня */}
      <Modal
        open={todayOpen}
        onClose={() => setTodayOpen(false)}
        title={`Сводка за сегодня · ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`}
        subtitle="Оперативные показатели на текущий день"
        size="md"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-btn bg-surface-2">
            <p className="text-[11px] uppercase font-bold text-text-muted">Заезды</p>
            <p className="font-display text-2xl text-text mt-1">{checkInToday}</p>
          </div>
          <div className="p-3 rounded-btn bg-surface-2">
            <p className="text-[11px] uppercase font-bold text-text-muted">Выезды</p>
            <p className="font-display text-2xl text-text mt-1">{checkOutToday}</p>
          </div>
          <div className="p-3 rounded-btn bg-surface-2">
            <p className="text-[11px] uppercase font-bold text-text-muted">Свободно номеров</p>
            <p className="font-display text-2xl text-text mt-1">{freeRooms}</p>
          </div>
          <div className="p-3 rounded-btn bg-surface-2">
            <p className="text-[11px] uppercase font-bold text-text-muted">К уборке</p>
            <p className="font-display text-2xl text-text mt-1">{pendingHousekeeping}</p>
          </div>
          <div className="p-3 rounded-btn bg-surface-2">
            <p className="text-[11px] uppercase font-bold text-text-muted">Выручка</p>
            <p className="font-display text-xl text-text mt-1">{fmtMoney(kpiToday.revenueToday)}</p>
          </div>
          <div className="p-3 rounded-btn bg-surface-2">
            <p className="text-[11px] uppercase font-bold text-text-muted">Загрузка</p>
            <p className="font-display text-2xl text-text mt-1">{kpiToday.occupancy}%</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => { setTodayOpen(false); navigate('/grid'); }}>Открыть календарь</Button>
          <Button className="flex-1" onClick={() => { setTodayOpen(false); navigate('/reports'); }}>Полный отчёт</Button>
        </div>
      </Modal>

      {/* Drill-down модалка: разбивка KPI по дням и каналам */}
      <Modal
        open={drillKey !== null}
        onClose={() => setDrillKey(null)}
        title={
          drillKey === 'revenue' ? 'Выручка — разбивка'
          : drillKey === 'occupancy' ? 'Загрузка — разбивка'
          : drillKey === 'adr' ? 'ADR — разбивка'
          : drillKey === 'revpar' ? 'RevPAR — разбивка'
          : drillKey === 'margin' ? 'Маржа — разбивка'
          : drillKey === 'checkin' ? 'Заезды сегодня'
          : drillKey === 'checkout' ? 'Выезды сегодня'
          : drillKey === 'free' ? 'Свободные номера'
          : drillKey === 'tasks' ? 'Номера к уборке'
          : 'Подробнее'
        }
        subtitle="Динамика за 14 дней и распределение по каналам"
        size="lg"
      >
        <div className="space-y-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingTrend.slice(-14)}>
                <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="rgb(var(--text-muted))" fontSize={11} />
                <YAxis stroke="rgb(var(--text-muted))" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bookings" name="Значение" fill="rgb(var(--accent-primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {channelDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-2 p-2 rounded-btn bg-surface-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-xs text-text flex-1">{c.name}</span>
                <span className="text-xs font-bold text-text">{c.value}%</span>
                {drillKey === 'revenue' && (
                  <span className="text-[10px] text-text-muted">{fmtMoney(kpiToday.revenueToday * c.value / 100)}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-muted">Данные демонстрационные — в проде будет реальный rollup по бронированиям.</p>
        </div>
      </Modal>
    </PageTransition>
  );
}