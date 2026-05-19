// Страница: RMS / Управление доходностью
// 365-дневный прогноз, what-if симуляция, авто-цены, Pace & Pickup
import { useMemo, useState } from 'react';
import {
  Calendar as CalIcon, Zap, Target, Sliders, Info,
  Plus, Trash2, Pencil, Lightbulb, Brain, MapPin,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Area, ComposedChart, ReferenceLine,
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
import { cityEvents, CITY_EVENT_CATEGORY_LABEL, CITY_EVENT_CATEGORY_COLOR } from '@/mock/cityEvents';
import { fmtMoney, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import { PricingRuleModal, RULE_CONDITION_LABEL } from '@/components/pricing/PricingRuleModal';
import type { PricingRule } from '@/types';

export default function PricingPage() {
  const { rules, forecast, pace, toggleRule, removeRule, addRule, updateRule, applyRecommendations } = usePricing();
  // Работает для всех объектов: отели + апартаменты
  const propertyOptions = properties;
  const [activeHotel, setActiveHotel] = useState(propertyOptions[0]?.id ?? '');
  const [horizon, setHorizon] = useState<7 | 30 | 90 | 365>(30);
  const [whatIfDelta, setWhatIfDelta] = useState(0); // ±%
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
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
        title="Управление доходностью (RMS)"
        subtitle="Прогноз цены и загрузки. Авто-правила. Pace & Pickup — для всех объектов."
        action={
          <Select
            value={activeHotel}
            onChange={(e) => setActiveHotel(e.target.value)}
            options={propertyOptions.map((p) => ({
              value: p.id,
              label: `${p.type === 'hotel' ? '🏨' : '🏠'} ${p.name}`,
            }))}
            className="!h-10 w-64"
          />
        }
      />

      {/* Пояснение */}
      <Card padding="md" className="mb-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-text-muted leading-relaxed">
            <p className="font-bold text-text mb-1">Что это за страница?</p>
            <p className="mb-1">
              <span className="font-bold text-text">RMS (Revenue Management System)</span> — система управления доходностью.
              Помогает решать <span className="font-bold">сколько просить за номер сегодня и завтра</span>, чтобы зарабатывать больше.
            </p>
            <p className="mb-1">
              <span className="font-bold text-text">ADR</span> — Average Daily Rate, средняя цена проданного номера за сутки (выручка ÷ проданные номера).
              {' '}
              <span className="font-bold text-text">RevPAR</span> — Revenue per Available Room, выручка с каждого доступного номера (ADR × загрузка).
              Главные метрики гостиничного бизнеса.
            </p>
            <p>
              <span className="font-bold text-text">Симулятор «А что если…»</span> — быстрая прикидка: «если подниму цену на 10%, что будет с выручкой?»
              Учитывает эластичность спроса (дороже = меньше бронируют). Полезно перед сезоном или событием.
            </p>
          </div>
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted flex items-center gap-1">
            ADR (текущий)
            <Info className="h-3 w-3" aria-label="Средняя цена проданного номера за сутки" />
          </p>
          <p className="font-display text-2xl text-text mt-1">{fmtMoney(avgCurrent)}</p>
          <Badge tone="neutral" className="mt-2">средний за {horizon} дн.</Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted flex items-center gap-1">
            ADR (рекомендован.)
            <Info className="h-3 w-3" aria-label="Цена, которую советует алгоритм" />
          </p>
          <p className="font-display text-2xl text-primary mt-1">{fmtMoney(avgRecommended)}</p>
          <Badge tone={avgRecommended > avgCurrent ? 'success' : 'warning'} className="mt-2">
            {avgRecommended > avgCurrent ? '+' : ''}{(((avgRecommended - avgCurrent) / avgCurrent) * 100).toFixed(1)}%
          </Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted flex items-center gap-1">
            Прогноз загрузки
            <Info className="h-3 w-3" aria-label="Какой процент номеров будет продан" />
          </p>
          <p className="font-display text-2xl text-text mt-1">{avgOccupancy.toFixed(0)}%</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted flex items-center gap-1">
            RevPAR (прогноз)
            <Info className="h-3 w-3" aria-label="Выручка с каждого доступного номера = ADR × загрузка" />
          </p>
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
          title="Симулятор «A что если…»"
          subtitle="Подвиньте цену ±30% — увидите эффект на выручку. Дороже = меньше броней (эластичность −0,8): +10% к цене ≈ −8% к загрузке."
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
          subtitle={`${rules.filter((r) => r.enabled).length} активно из ${rules.length} · сортировка по приоритету`}
          action={
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => { setEditingRule(null); setRuleModalOpen(true); }}
            >
              Добавить правило
            </Button>
          }
        />
        <div className="space-y-2">
          {rules.length === 0 && (
            <div className="text-center py-8 text-sm text-text-muted">
              Правил пока нет. Добавьте первое — например, «+15% на выходные».
            </div>
          )}
          {rules.slice().sort((a, b) => a.priority - b.priority).map((r) => {
            const propertyName = r.propertyId === 'all'
              ? 'Все объекты'
              : properties.find((p) => p.id === r.propertyId)?.name ?? r.propertyId;
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-card border border-border bg-surface">
                <Switch checked={r.enabled} onChange={() => toggleRule(r.id)} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text">{r.name}</p>
                  <p className="text-[11px] text-text-muted">
                    {RULE_CONDITION_LABEL[r.condition]}
                    {r.threshold > 0 && <> · порог {r.threshold}</>}
                    {' → '}
                    <span className="font-bold text-text">
                      {r.action === 'increase' ? `+${r.amount}%` : r.action === 'decrease' ? `−${r.amount}%` : `=${fmtMoney(r.amount)}`}
                    </span>
                    {' · '}{propertyName}{' · '}приоритет {r.priority}
                  </p>
                </div>
                {r.enabled
                  ? <Badge tone="success" dot>Активно</Badge>
                  : <Badge tone="neutral" dot>Выключено</Badge>}
                <Button size="icon" variant="ghost" onClick={() => { setEditingRule(r); setRuleModalOpen(true); }}>
                  <Pencil className="h-4 w-4 text-text-muted" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeRule(r.id)}>
                  <Trash2 className="h-4 w-4 text-error" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <PricingRuleModal
        open={ruleModalOpen}
        onClose={() => { setRuleModalOpen(false); setEditingRule(null); }}
        initial={editingRule}
        onSave={(rule) => {
          if (editingRule) {
            updateRule(editingRule.id, rule);
            push({ tone: 'success', title: 'Правило обновлено' });
          } else {
            addRule(rule);
            push({ tone: 'success', title: 'Правило добавлено', description: rule.name });
          }
        }}
      />

      <MLForecastSection propertyForecast={propertyForecast} />
    </PageTransition>
  );
}

// =====================================================================
// ML-прогноз спроса + календарь городских событий Владикавказа
// =====================================================================
function MLForecastSection({
  propertyForecast,
}: {
  propertyForecast: Array<{ date: string; currentPrice: number; recommendedPrice: number; forecastOccupancy: number; }>;
}) {
  // Простая ML-модель: EMA по recommendedPrice + boost от ближайшего события + дов. интервал ±15%
  const eventByDate = useMemo(() => {
    const m = new Map<string, typeof cityEvents[0]>();
    cityEvents.forEach((e) => m.set(e.date, e));
    return m;
  }, []);

  const mlData = useMemo(() => {
    if (propertyForecast.length === 0) return [];
    const alpha = 0.35; // коэффициент сглаживания EMA
    let ema = propertyForecast[0].recommendedPrice;
    return propertyForecast.map((f) => {
      ema = alpha * f.recommendedPrice + (1 - alpha) * ema;
      const ev = eventByDate.get(f.date);
      const eventBoost = ev ? ev.impactPct / 100 : 0;
      const mlPrice = Math.round(ema * (1 + eventBoost));
      const lower = Math.round(mlPrice * 0.85);
      const upper = Math.round(mlPrice * 1.15);
      const mlOccupancy = Math.min(99, Math.round(f.forecastOccupancy * (1 + eventBoost * 0.6)));
      return {
        date: f.date.slice(5),
        current: f.currentPrice,
        ml: mlPrice,
        lower,
        upper,
        confBand: upper - lower,
        occupancy: mlOccupancy,
        event: ev?.name,
      };
    });
  }, [propertyForecast, eventByDate]);

  const upcomingEvents = useMemo(() => {
    const horizonEnd = propertyForecast[propertyForecast.length - 1]?.date;
    if (!horizonEnd) return cityEvents.slice(0, 6);
    return cityEvents.filter((e) => e.date <= horizonEnd).slice(0, 8);
  }, [propertyForecast]);

  return (
    <>
      <Card padding="md" className="mt-6">
        <CardHeader
          title={<span className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> ML-прогноз цены и спроса</span>}
          subtitle="Сглаживание EMA + boost от городских событий, доверительный коридор ±15%"
          action={<Badge tone="primary" dot>модель v0.3</Badge>}
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mlData}>
              <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="rgb(var(--text-muted))" fontSize={11} />
              <YAxis stroke="rgb(var(--text-muted))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'rgb(var(--bg))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Доверительный коридор') return null;
                  return [typeof value === 'number' ? fmtMoney(value) : value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="lower" stackId="ci" stroke="none" fill="transparent" name="нижняя граница" />
              <Area type="monotone" dataKey="confBand" stackId="ci" stroke="none" fill="rgb(var(--accent-primary))" fillOpacity={0.12} name="Доверительный коридор" />
              <Line type="monotone" dataKey="current" name="Текущая цена" stroke="rgb(var(--text-muted))" strokeDasharray="4 3" dot={false} />
              <Line type="monotone" dataKey="ml" name="ML-прогноз" stroke="rgb(var(--accent-primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              {upcomingEvents.map((e) => (
                <ReferenceLine
                  key={e.id}
                  x={e.date.slice(5)}
                  stroke={CITY_EVENT_CATEGORY_COLOR[e.category]}
                  strokeDasharray="2 2"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
          <div className="p-2 rounded-btn bg-surface-2">
            <p className="text-text-muted">Средний ML-прогноз</p>
            <p className="font-bold text-text">{fmtMoney(Math.round(mlData.reduce((s, d) => s + d.ml, 0) / Math.max(1, mlData.length)))}</p>
          </div>
          <div className="p-2 rounded-btn bg-surface-2">
            <p className="text-text-muted">Пик прогноза</p>
            <p className="font-bold text-success">{fmtMoney(Math.max(...mlData.map((d) => d.ml), 0))}</p>
          </div>
          <div className="p-2 rounded-btn bg-surface-2">
            <p className="text-text-muted">Событий в окне</p>
            <p className="font-bold text-primary">{upcomingEvents.length}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" className="mt-4">
        <CardHeader
          title={<span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-warning" /> Календарь событий Владикавказа</span>}
          subtitle="Учитываются ML-моделью при прогнозе цен"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {upcomingEvents.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-btn border border-border hover:bg-surface-2 transition">
              <div
                className="h-10 w-10 rounded-btn flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: CITY_EVENT_CATEGORY_COLOR[e.category] }}
              >
                {new Date(e.date).getDate()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text truncate">{e.name}</p>
                <p className="text-[11px] text-text-muted">{e.venue} · {CITY_EVENT_CATEGORY_LABEL[e.category]}{e.attendance ? ` · ~${e.attendance.toLocaleString('ru-RU')} чел.` : ''}</p>
              </div>
              <Badge tone="warning">+{e.impactPct}%</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
