// Финансы и Аналитика: BarChart по каналам, сравнение, таблица + heatmap
import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { bookings, properties } from '@/mock/data';
import { fmtMoney, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

export default function FinancePage() {
  const [period, setPeriod] = useState('30d');
  const { push } = useToast();

  // Группировка выручки по каналам
  const byChannel = useMemo(() => {
    const m = new Map<string, number>();
    bookings.forEach((b) => m.set(b.channel, (m.get(b.channel) || 0) + b.amount));
    return Array.from(m.entries()).map(([name, value]) => ({
      name: { ostrovok: 'Островок', yandex: 'Яндекс', sutochno: 'Суточно', otello: 'Отелло', '101hotels': '101Hotels', avito: 'Авито', direct: 'Прямые' }[name] || name,
      revenue: value,
      prev: Math.round(value * (0.7 + Math.random() * 0.4)),
    }));
  }, []);

  const total = byChannel.reduce((s, x) => s + x.revenue, 0);
  const totalPrev = byChannel.reduce((s, x) => s + x.prev, 0);
  const growth = ((total - totalPrev) / totalPrev) * 100;

  // Тепловая карта — 365 ячеек
  const heatmap = useMemo(() => Array.from({ length: 12 }).map((_, m) => {
    const days = new Date(2026, m + 1, 0).getDate();
    return Array.from({ length: days }).map(() => Math.random());
  }), []);

  const handleExport = (kind: 'csv' | 'pdf') => {
    if (kind === 'csv') {
      const rows = bookings.slice(0, 100).map((b) => `${b.id},${b.guestName},${b.checkIn},${b.checkOut},${b.amount},${b.channel}`);
      const csv = ['id,guest,check_in,check_out,amount,channel', ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ginohotel-transactions.csv'; a.click();
      URL.revokeObjectURL(url);
      push({ tone: 'success', title: 'CSV экспортирован' });
    } else {
      push({ tone: 'info', title: 'PDF-отчёт', description: 'Генерация запущена, придёт на email' });
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Финансы и Аналитика"
        subtitle="Доходы, отчёты, тепловая карта занятости"
        action={
          <>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} options={[
              { value: '7d', label: '7 дней' },
              { value: '30d', label: '30 дней' },
              { value: '90d', label: '90 дней' },
              { value: '1y', label: 'Год' },
            ]} />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => handleExport('csv')}>CSV</Button>
            <Button leftIcon={<FileText className="h-4 w-4" />} onClick={() => handleExport('pdf')}>PDF</Button>
          </>
        }
      />

      {/* Сравнение периодов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Выручка за период</p>
          <p className="font-display text-3xl text-text mt-1">{fmtMoney(total, { compact: true })}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {growth >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-error" />}
            <span className={cn('text-sm font-bold', growth >= 0 ? 'text-success' : 'text-error')}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% к прошлому периоду
            </span>
          </div>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Средний чек</p>
          <p className="font-display text-3xl text-text mt-1">{fmtMoney(total / bookings.length)}</p>
          <Badge tone="success" dot className="mt-2">+4.2% к прошлому периоду</Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Кол-во транзакций</p>
          <p className="font-display text-3xl text-text mt-1">{bookings.length}</p>
          <Badge tone="success" dot className="mt-2">+12 к прошлому периоду</Badge>
        </Card>
      </div>

      {/* График по каналам */}
      <Card padding="md" className="mb-6">
        <CardHeader title="Выручка по каналам" subtitle="Сравнение с предыдущим периодом" />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byChannel}>
              <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="rgb(var(--text-muted))" fontSize={11} />
              <YAxis stroke="rgb(var(--text-muted))" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                cursor={{ fill: 'rgb(var(--surface-2))' }}
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-bg border border-border rounded-btn px-3 py-2 shadow-lift text-xs">
                      <p className="font-bold text-text mb-1">{label}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                          {p.name}: {fmtMoney(p.value, { compact: true })}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="prev" name="Прошлый период" fill="rgb(var(--text-muted) / 0.4)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="revenue" name="Текущий" fill="rgb(var(--accent-primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Тепловая карта */}
      <Card padding="md" className="mb-6">
        <CardHeader title="Тепловая карта занятости" subtitle="Год по дням — интенсивность заполнения" />
        <div className="overflow-x-auto">
          <div className="space-y-1.5 min-w-[800px]">
            {heatmap.map((month, mi) => (
              <div key={mi} className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-text-muted w-8 shrink-0">
                  {['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][mi]}
                </span>
                <div className="flex gap-0.5">
                  {month.map((v, di) => (
                    <div
                      key={di}
                      title={`День ${di + 1}: ${Math.round(v * 100)}% загрузки`}
                      className="h-4 w-4 rounded-sm transition-transform hover:scale-150"
                      style={{
                        background: `rgb(var(--accent-primary) / ${0.1 + v * 0.85})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
          <span>0%</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div key={v} className="h-3 w-3 rounded-sm" style={{ background: `rgb(var(--accent-primary) / ${v})` }} />
            ))}
          </div>
          <span>100%</span>
        </div>
      </Card>

      {/* Таблица транзакций */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-lg text-text">Транзакции</h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 sticky top-0">
              <tr>{['Гость', 'Объект', 'Заезд', 'Выезд', 'Канал', 'Сумма'].map((h) =>
                <th key={h} className="px-4 py-2.5 text-left text-xs uppercase font-bold text-text-muted">{h}</th>,
              )}</tr>
            </thead>
            <tbody>
              {bookings.slice(0, 50).map((b) => {
                const p = properties.find((x) => x.id === b.propertyId);
                return (
                  <tr key={b.id} className="border-t border-border hover:bg-surface-2/50">
                    <td className="px-4 py-2.5 font-bold text-text">{b.guestName}</td>
                    <td className="px-4 py-2.5 text-text-muted">{p?.name}</td>
                    <td className="px-4 py-2.5 text-text-muted">{b.checkIn}</td>
                    <td className="px-4 py-2.5 text-text-muted">{b.checkOut}</td>
                    <td className="px-4 py-2.5"><Badge tone="neutral">{b.channel}</Badge></td>
                    <td className="px-4 py-2.5 font-bold text-primary">{fmtMoney(b.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageTransition>
  );
}
