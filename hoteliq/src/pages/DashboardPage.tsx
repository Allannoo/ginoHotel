// Страница «Дашборд» — главная
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import {
  TrendingUp, Wallet, BedDouble, Activity, Users, CalendarCheck,
  Sparkles, AlertTriangle, AlertCircle, Info, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { PageTransition, StaggerList, staggerItem } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountUp } from '@/components/ui/CountUp';
import { Button } from '@/components/ui/Button';
import {
  kpiToday, bookingTrend, channelDistribution, aiInsights, alerts, upcomingCheckins,
} from '@/mock/data';
import { fmtDateShort } from '@/utils/format';
import { cn } from '@/utils/format';

// ---------- KPI карточка ----------
function KpiCard({
  icon, label, value, format, delta, tone = 'primary',
}: {
  icon: React.ReactNode; label: string; value: number;
  format: 'number' | 'money' | 'percent' | 'compact-money';
  delta: number; tone?: 'primary' | 'success' | 'gold' | 'info';
}) {
  const positive = delta >= 0;
  const toneBg = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    gold: 'bg-gold/15 text-gold',
    info: 'bg-info/10 text-info',
  }[tone];
  return (
    <motion.div variants={staggerItem}>
      <Card hoverable>
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
        <p className="font-display text-3xl text-text mt-1">
          <CountUp value={value} format={format} />
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
  return (
    <PageTransition>
      <PageHeader
        title="Доброе утро, Алексей!"
        subtitle="Вот сводка по вашим объектам за сегодня"
        action={
          <>
            <Button variant="outline" size="md">Сегодня</Button>
            <Button size="md" leftIcon={<TrendingUp className="h-4 w-4" />}>Отчёт</Button>
          </>
        }
      />

      {/* KPI */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard icon={<Activity className="h-5 w-5" />} label="Загрузка" value={kpiToday.occupancy} format="percent" delta={4} tone="primary" />
        <KpiCard icon={<Wallet className="h-5 w-5" />} label="Выручка сегодня" value={kpiToday.revenueToday} format="compact-money" delta={12} tone="success" />
        <KpiCard icon={<BedDouble className="h-5 w-5" />} label="ADR" value={kpiToday.adr} format="money" delta={3} tone="gold" />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="RevPAR" value={kpiToday.revpar} format="money" delta={-2} tone="info" />
        <KpiCard icon={<CalendarCheck className="h-5 w-5" />} label="Активные брони" value={kpiToday.activeBookings} format="number" delta={8} tone="primary" />
        <KpiCard icon={<Users className="h-5 w-5" />} label="Гости сегодня" value={kpiToday.guestsToday} format="number" delta={5} tone="success" />
      </StaggerList>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2" padding="md">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI инсайты */}
        <Card padding="md">
          <CardHeader
            title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /> AI-инсайты</span>}
            subtitle="Рекомендации на сегодня"
          />
          <div className="space-y-3">
            {aiInsights.map((a) => (
              <div key={a.id} className="flex gap-3 p-3 rounded-btn bg-surface-2 hover-lift cursor-pointer">
                <div className="text-2xl">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text">{a.title}</p>
                  <p className="text-xs text-text-muted leading-snug mt-1">{a.text}</p>
                </div>
              </div>
            ))}
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
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                  {guest.avatar}
                </div>
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
    </PageTransition>
  );
}
