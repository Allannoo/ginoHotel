// Страница: RMS / Revenue Management System
// 365-дневный прогноз, what-if симуляция, авто-цены, Pace & Pickup
import { useMemo, useState } from 'react';
import {
  TrendingUp, Calendar as CalIcon, Zap, Target, Sliders,
  CheckCircle2, X, Plus, Trash2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { usePricing } from '@/store/pricing';
import { properties } from '@/mock/data';
import { fmtMoney, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

export default function PricingPage() {
  const { rules, forecast, pace, toggleRule, removeRule, applyRecommendations } = usePricing();
  const hotels = properties.filter((p) => p.type === 'hotel');
  const [activeHotel, setActiveHotel] = useState(hotels[0]?.id ?? '');
  const [horizon, setHorizon] = useState<7 | 30 | 90 | 365>(30);
  const [whatIfDelta, setWhatIfDelta] = useState(0); // ±%
  const { push } = useToast();

  const propertyForecast = useMemo(
    () => forecast.filter((f) => f.propertyId === activeHotel).slice(0, horizon),
    [forecast, activeHotel, horizon]
  );

  // What-if: считаем revenue текущий и при изменённой цене
  const whatIfData = useMemo(() => {
    return propertyForecast.map((f) => {
      const adjusted = Math.round(f.currentPrice * (1 + whatIfDelta / 100));
      // эластичность спроса: при росте цены — падение загрузки
      const elasticity = -0.8;
      const occupancyDelta = whatIfDelta * elasticity / 100;
      const adjustedOccupancy = Math.max(10, Math.min(99, f.forecastOccupancy * (1 + occupancyDelta)));
      const currentRev = f.currentPrice * (f.forecastOccupancy / 100);
      const adjustedRev = adjusted * (adjustedOccupancy / 100);
      return {
        date: f.date,
        current: Math.round(currentRev),
        adjusted: Math.round(adjustedRev),
      };
    });
  }, [propertyForecast, whatIfDelta]);

  const totalCurrent = whatIfData.reduce((s, d) => s + d.current, 0);
  const totalAdjusted = whatIfData.reduce((s, d) => s + d.adjusted, 0);
  const deltaPct = totalCurrent > 0 ? ((totalAdjusted - totalCurrent) / totalCurrent) * 100 : 0;

  const avgRecommended = propertyForecast.reduce((s, f) => s + f.recommendedPrice, 0) / Math.max(1, propertyForecast.length);
  const avgCurrent = propertyForecast.reduce((s, f) => s + f.currentPrice, 0) / Math.max(1, propertyForecast.length);
  const avgOccupancy = propertyForecast.reduce((s, f) => s + f.forecastOccupancy, 0) / Math.max(1, propertyForecast.length);
  const revPAR = (avgRecommended * avgOccupancy) / 100;

  const handleApplyRecs = (days: number) => {
    const applied = applyRecommendations(activeHotel, days);
    push({ tone: 'success', title: 'Цены обновлены', description: `Применено к ${applied} дням` });
  };

  return (
    <PageTransition>
      <PageHeader
        title="Revenue Management"
        subtitle="365-дневный прогноз загрузки и ADR. Правила авто-ценообразования. Pace & Pickup."
        action={
          <Select
            value={activeHotel}
            onChange={(e) => setActiveHotel(e.target.value)}
            options={hotels.map((p) => ({ value: p.id, label: p.name }))}
            className="!h-10 w-64"
          />
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">ADR (текущий)</p>
          <p className="font-display text-2xl text-text mt-1">{fmtMoney(avgCurrent)}</p>
          <Badge tone="neutral" className="mt-2">средний за {horizon} дн.</Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">ADR (рекомендован.)</p>
          <p className="font-display text-2xl text-primary mt-1">{fmtMoney(avgRecommended)}</p>
          <Badge tone={avgRecommended > avgCurrent ? 'success' : 'warning'} className="mt-2">
            {avgRecommended > avgCurrent ? '+' : ''}{(((avgRecommended - avgCurrent) / avgCurrent) * 100).toFixed(1)}%
          </Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Прогноз загрузки</p>
          <p className="font-display text-2xl text-text mt-1">{avgOccupancy.toFixed(0)}%</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">RevPAR (прогноз)</p>
          <p className="font-display text-2xl text-gold mt-1">{fmtMoney(revPAR)}</p>
        </Card>
      </div>

      {/* График прогноза */}
      <Card padding="md" className="mb-5">
        <CardHeader
          title="Прогноз цены и загрузки"
          subtitle="Текущая, рекомендованная и конкурентная цена день за днём"
          action={
            <div className="bg-surface-2 rounded-btn p-1 flex">
              {([7, 30, 90, 365] as const).map((h) => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={cn('px-3 h-8 rounded-btn text-xs font-bold', horizon === h ? 'bg-surface text-text' : 'text-text-muted')}
                >
                  {h} дн.
                </button>
              ))}
            </div>
          }
        />
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={propertyForecast.map((f) => ({ ...f, date: f.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="currentPrice" name="Текущая" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="recommendedPrice" name="Рекомендация" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="competitorAvg" name="Конкуренты" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" leftIcon={<Zap className="h-3.5 w-3.5" />} onClick={() => handleApplyRecs(7)}>Применить рекомендации на 7 дн.</Button>
          <Button size="sm" variant="outline" leftIcon={<Zap className="h-3.5 w-3.5" />} onClick={() => handleApplyRecs(30)}>Применить на 30 дн.</Button>
          <Button size="sm" variant="outline" leftIcon={<Zap className="h-3.5 w-3.5" />} onClick={() => handleApplyRecs(90)}>Применить на 90 дн.</Button>
        </div>
      </Card>

      {/* What-if */}
      <Card padding="md" className="mb-5">
        <CardHeader
          title="What-if симуляция"
          subtitle="Подвиньте цену — увидите эффект на выручку (с учётом эластичности спроса)"
          action={<Sliders className="h-5 w-5 text-text-muted" />}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-text">Изменение цены</span>
                <Badge tone={whatIfDelta > 0 ? 'success' : whatIfDelta < 0 ? 'warning' : 'neutral'}>
                  {whatIfDelta > 0 ? '+' : ''}{whatIfDelta}%
                </Badge>
              </div>
              <input
                type="range"
                min={-30} max={30} step={1}
                value={whatIfDelta}
                onChange={(e) => setWhatIfDelta(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>−30%</span><span>0</span><span>+30%</span>
              </div>
            </div>
            <div className="rounded-card border border-border bg-surface-2/40 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Выручка текущая:</span><span className="font-bold text-text">{fmtMoney(totalCurrent, { compact: true })}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Выручка адаптир.:</span><span className="font-bold text-text">{fmtMoney(totalAdjusted, { compact: true })}</span></div>
              <div className="flex justify-between pt-1.5 border-t border-border"><span className="text-text-muted">Δ:</span>
                <span className={cn('font-bold', deltaPct >= 0 ? 'text-success' : 'text-error')}>
                  {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2" style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={whatIfData.slice(0, 14).map((d) => ({ ...d, date: d.date.slice(5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="current" name="Текущая" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="adjusted" name="После изменения" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Pace & Pickup */}
      <Card padding="md" className="mb-5">
        <CardHeader title="Pace & Pickup" subtitle="Сравнение с прошлым годом — насколько мы обгоняем/отстаём" action={<Target className="h-5 w-5 text-text-muted" />} />
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={pace.map((p) => ({ ...p, date: p.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="bookingsOnBook" name="Текущий on-book" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="prevYearOnBook" name="Прошлый год на эту дату" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="finalLastYear" name="Финальный прошлого года" stroke="#94a3b8" strokeWidth={2} strokeDasharray="2 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Правила */}
      <Card padding="md">
        <CardHeader
          title="Правила авто-ценообразования"
          subtitle={`${rules.filter((r) => r.enabled).length} активно из ${rules.length}`}
          action={<Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />}>Добавить</Button>}
        />
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-card border border-border bg-surface">
              <Switch checked={r.enabled} onChange={() => toggleRule(r.id)} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-text">{r.name}</p>
                <p className="text-[11px] text-text-muted">
                  Действие: <span className="font-bold">{r.action === 'increase' ? `+${r.amount}%` : r.action === 'decrease' ? `−${r.amount}%` : `=${fmtMoney(r.amount)}`}</span>
                  {' · '}приоритет: {r.priority}
                </p>
              </div>
              {r.enabled
                ? <Badge tone="success" dot>Активно</Badge>
                : <Badge tone="neutral" dot>Выключено</Badge>}
              <Button size="icon" variant="ghost" onClick={() => removeRule(r.id)}><Trash2 className="h-4 w-4 text-error" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </PageTransition>
  );
}
