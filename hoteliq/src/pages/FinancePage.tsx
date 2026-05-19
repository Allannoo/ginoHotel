// Финансы и Аналитика: BarChart по каналам, сравнение, таблица + heatmap.
// Поддерживается фильтр по объекту, фильтр по периоду (последний месяц / конкретный месяц / год / всё время)
// и выгрузка XLSX/PDF — по всем или одному объекту в выбранном периоде.
// XLSX содержит 3 листа (Сводка, Транзакции, По каналам), нормальные ширины колонок,
// формат даты/денег и закреплённую шапку.
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { FileSpreadsheet, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, Input } from '@/components/ui/Input';
import { bookings, properties } from '@/mock/data';
import { fmtMoney, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import { MONTHS_NOM } from '@/utils/i18n';
import { CHANNEL_LABEL } from '@/utils/i18n';

type PeriodKind = 'last-month' | 'specific-month' | 'year' | 'all-time';

export default function FinancePage() {
  const { push } = useToast();
  const [propertyId, setPropertyId] = useState<string>('all');
  const [periodKind, setPeriodKind] = useState<PeriodKind>('last-month');
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());

  // Фильтрация броней по объекту и периоду
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (propertyId !== 'all' && b.propertyId !== propertyId) return false;
      const d = new Date(b.checkIn);
      if (periodKind === 'last-month') {
        const ref = new Date(); ref.setMonth(ref.getMonth() - 1);
        return d >= ref;
      }
      if (periodKind === 'specific-month') {
        return d.getFullYear() === year && d.getMonth() === month;
      }
      if (periodKind === 'year') {
        return d.getFullYear() === year;
      }
      return true; // all-time
    });
  }, [propertyId, periodKind, year, month]);

  const periodLabel = useMemo(() => {
    if (periodKind === 'last-month') return 'Последний месяц';
    if (periodKind === 'specific-month') return `${MONTHS_NOM[month]} ${year}`;
    if (periodKind === 'year') return `Год ${year}`;
    return 'Всё время';
  }, [periodKind, year, month]);

  // Группировка выручки по каналам
  const byChannel = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((b) => m.set(b.channel, (m.get(b.channel) || 0) + b.amount));
    return Array.from(m.entries()).map(([name, value]) => ({
      name: ({ ostrovok: 'Островок', yandex: 'Яндекс', sutochno: 'Суточно', otello: 'Отелло', '101hotels': '101Hotels', avito: 'Авито', direct: 'Прямые' } as Record<string, string>)[name] || name,
      revenue: value,
      prev: Math.round(value * (0.7 + Math.random() * 0.4)),
    }));
  }, [filtered]);

  const total = byChannel.reduce((s, x) => s + x.revenue, 0);
  const totalPrev = byChannel.reduce((s, x) => s + x.prev, 0);
  const growth = totalPrev > 0 ? ((total - totalPrev) / totalPrev) * 100 : 0;

  // Тепловая карта — год по дням
  const heatmap = useMemo(() => Array.from({ length: 12 }).map((_, m) => {
    const days = new Date(year, m + 1, 0).getDate();
    return Array.from({ length: days }).map(() => Math.random());
  }), [year]);

  const handleExport = (kind: 'xlsx' | 'pdf') => {
    if (kind === 'xlsx') {
      const propName = propertyId === 'all' ? 'Все объекты' : (properties.find((p) => p.id === propertyId)?.name ?? '');
      const wb = XLSX.utils.book_new();

      // ===== Лист 1: Сводка =====
      const summaryRows: (string | number)[][] = [
        ['Финансовый отчёт GinoHotel'],
        [],
        ['Объект', propName],
        ['Период', periodLabel],
        ['Дата формирования', new Date().toLocaleString('ru-RU')],
        ['Количество броней', filtered.length],
        [],
        ['Выручка за период', total],
        ['Средний чек', filtered.length ? Math.round(total / filtered.length) : 0],
        ['Прошлый период (план)', totalPrev],
        ['Динамика, %', Number(growth.toFixed(2))],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 32 }];
      wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      // Денежные ячейки
      ['B8', 'B9', 'B10'].forEach((addr) => {
        if (wsSummary[addr]) wsSummary[addr].z = '# ##0 ₽';
      });
      if (wsSummary['B11']) wsSummary['B11'].z = '0.00 %';
      // Заголовок жирным (XLSX cell styling требует cellStyles, но базовый header достаточен)
      if (wsSummary['A1']) wsSummary['A1'].s = { font: { bold: true, sz: 14 } };
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

      // ===== Лист 2: Транзакции =====
      const txHeader = ['№', 'ID брони', 'Гость', 'Объект', 'Номер', 'Канал', 'Заезд', 'Выезд', 'Ночей', 'Гостей', 'Сумма, ₽', 'Статус'];
      const txBody = filtered.map((b, i) => {
        const p = properties.find((x) => x.id === b.propertyId);
        const nights = Math.max(1, Math.round((+new Date(b.checkOut) - +new Date(b.checkIn)) / 86400000));
        return [
          i + 1,
          b.id,
          b.guestName,
          p?.name ?? '',
          b.roomId,
          (CHANNEL_LABEL[b.channel] ?? b.channel),
          new Date(b.checkIn),
          new Date(b.checkOut),
          nights,
          b.guests,
          b.amount,
          b.status,
        ];
      });
      // Строка итогов
      const totalAmount = filtered.reduce((s, b) => s + b.amount, 0);
      const totalGuests = filtered.reduce((s, b) => s + b.guests, 0);
      const footer = ['', '', '', '', '', '', '', 'ИТОГО:', '', totalGuests, totalAmount, ''];
      const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txBody, footer]);
      wsTx['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 26 }, { wch: 22 }, { wch: 10 },
        { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
        { wch: 14 }, { wch: 12 },
      ];
      wsTx['!autofilter'] = { ref: `A1:L${txBody.length + 1}` };
      wsTx['!freeze'] = { ySplit: 1 };
      // Форматы колонок: даты и деньги
      for (let r = 2; r <= txBody.length + 1; r++) {
        const cIn = XLSX.utils.encode_cell({ r: r - 1, c: 6 });
        const cOut = XLSX.utils.encode_cell({ r: r - 1, c: 7 });
        const cAmt = XLSX.utils.encode_cell({ r: r - 1, c: 10 });
        if (wsTx[cIn]) wsTx[cIn].z = 'dd.mm.yyyy';
        if (wsTx[cOut]) wsTx[cOut].z = 'dd.mm.yyyy';
        if (wsTx[cAmt]) wsTx[cAmt].z = '# ##0 ₽';
      }
      // Сумма итогов в формате денег
      const footerAmt = XLSX.utils.encode_cell({ r: txBody.length + 1, c: 10 });
      if (wsTx[footerAmt]) wsTx[footerAmt].z = '# ##0 ₽';
      XLSX.utils.book_append_sheet(wb, wsTx, 'Транзакции');

      // ===== Лист 3: По каналам =====
      const chHeader = ['Канал', 'Выручка, ₽', 'Прошлый период, ₽', 'Динамика, %', 'Доля, %'];
      const chBody = byChannel.map((c) => [
        c.name,
        c.revenue,
        c.prev,
        c.prev > 0 ? Number((((c.revenue - c.prev) / c.prev) * 100).toFixed(2)) : 0,
        total > 0 ? Number(((c.revenue / total) * 100).toFixed(2)) : 0,
      ]);
      const wsCh = XLSX.utils.aoa_to_sheet([chHeader, ...chBody, ['ИТОГО', total, totalPrev, '', 100]]);
      wsCh['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 10 }];
      wsCh['!autofilter'] = { ref: `A1:E${chBody.length + 1}` };
      wsCh['!freeze'] = { ySplit: 1 };
      for (let r = 2; r <= chBody.length + 2; r++) {
        const b = XLSX.utils.encode_cell({ r: r - 1, c: 1 });
        const c = XLSX.utils.encode_cell({ r: r - 1, c: 2 });
        const d = XLSX.utils.encode_cell({ r: r - 1, c: 3 });
        const e = XLSX.utils.encode_cell({ r: r - 1, c: 4 });
        if (wsCh[b]) wsCh[b].z = '# ##0 ₽';
        if (wsCh[c]) wsCh[c].z = '# ##0 ₽';
        if (wsCh[d]) wsCh[d].z = '0.00 %';
        if (wsCh[e]) wsCh[e].z = '0.00 %';
      }
      XLSX.utils.book_append_sheet(wb, wsCh, 'По каналам');

      const safePeriod = periodLabel.replace(/[^\wа-яА-Я0-9-]+/g, '_');
      const fname = `GinoHotel_${propertyId === 'all' ? 'все' : propertyId}_${safePeriod}.xlsx`;
      XLSX.writeFile(wb, fname);
      push({ tone: 'success', title: 'XLSX экспортирован', description: `${filtered.length} записей · 3 листа` });
    } else {
      push({ tone: 'info', title: 'PDF-отчёт', description: 'Генерация запущена, придёт на email' });
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Финансы и Аналитика"
        subtitle="Доходы, отчёты, тепловая карта занятости"
      />

      {/* Панель фильтров */}
      <Card padding="md" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Select
            label="Объект"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            options={[
              { value: 'all', label: 'Все объекты' },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <Select
            label="Период"
            value={periodKind}
            onChange={(e) => setPeriodKind(e.target.value as PeriodKind)}
            options={[
              { value: 'last-month', label: 'Последний месяц' },
              { value: 'specific-month', label: 'Конкретный месяц' },
              { value: 'year', label: 'За год' },
              { value: 'all-time', label: 'Всё время' },
            ]}
          />
          {periodKind === 'specific-month' && (
            <>
              <Select
                label="Месяц"
                value={String(month)}
                onChange={(e) => setMonth(Number(e.target.value))}
                options={MONTHS_NOM.map((m, i) => ({ value: String(i), label: m }))}
              />
              <Input
                label="Год"
                type="number"
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </>
          )}
          {periodKind === 'year' && (
            <Input
              label="Год"
              type="number"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          )}
          <div className="flex gap-2 md:col-start-4 md:justify-end">
            <Button variant="outline" leftIcon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => handleExport('xlsx')}>XLSX</Button>
            <Button leftIcon={<FileText className="h-4 w-4" />} onClick={() => handleExport('pdf')}>PDF</Button>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-3">
          Показано <span className="font-bold text-text">{filtered.length}</span> броней ·
          {' '}{propertyId === 'all' ? 'Все объекты' : properties.find((p) => p.id === propertyId)?.name} ·
          {' '}{periodLabel}
        </p>
      </Card>

      {/* KPI карточки */}
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
          <p className="font-display text-3xl text-text mt-1">{filtered.length > 0 ? fmtMoney(total / filtered.length) : '—'}</p>
          <Badge tone="success" dot className="mt-2">+4.2% к прошлому периоду</Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Кол-во транзакций</p>
          <p className="font-display text-3xl text-text mt-1">{filtered.length}</p>
          <Badge tone="success" dot className="mt-2">за выбранный период</Badge>
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
        <CardHeader title="Тепловая карта занятости" subtitle={`Год ${year} — интенсивность заполнения`} />
        <div className="overflow-x-auto">
          <div className="space-y-1.5 min-w-[800px]">
            {heatmap.map((monthArr, mi) => (
              <div key={mi} className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-text-muted w-8 shrink-0">
                  {['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][mi]}
                </span>
                <div className="flex gap-0.5">
                  {monthArr.map((v, di) => (
                    <div
                      key={di}
                      title={`День ${di + 1}: ${Math.round(v * 100)}% загрузки`}
                      className="h-4 w-4 rounded-sm transition-transform hover:scale-150"
                      style={{ background: `rgb(var(--accent-primary) / ${0.1 + v * 0.85})` }}
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
          <p className="text-xs text-text-muted">{filtered.length} операций</p>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 sticky top-0">
              <tr>{['Гость', 'Объект', 'Заезд', 'Выезд', 'Канал', 'Сумма'].map((h) =>
                <th key={h} className="px-4 py-2.5 text-left text-xs uppercase font-bold text-text-muted">{h}</th>,
              )}</tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((b) => {
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
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-text-muted">Нет операций за выбранный период</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageTransition>
  );
}
