// Страница: Расходы / OPEX
// Категории, фильтры, аплоад чеков (мок), авто-распределение shared расходов,
// мини P&L по каждому объекту, экспорт XLSX.
import { useMemo, useState, useRef } from 'react';
import { Plus, Receipt, Download, Trash2, Paperclip, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useExpenses, EXPENSE_CATEGORY_LABEL } from '@/store/expenses';
import { useBookings } from '@/store/bookings';
import { properties } from '@/mock/data';
import { fmtMoney, fmtDate, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import type { Expense, ExpenseCategory } from '@/types';

const CATEGORY_TONE: Record<ExpenseCategory, 'neutral' | 'primary' | 'warning' | 'info' | 'error' | 'gold' | 'success'> = {
  salary: 'primary', utilities: 'info', laundry: 'info', cleaning: 'info',
  maintenance: 'warning', supplies: 'neutral', marketing: 'gold', taxes: 'error',
  insurance: 'neutral', rent: 'warning', food: 'success', commission: 'error',
  depreciation: 'neutral', other: 'neutral',
};

export default function ExpensesPage() {
  const { expenses, addExpense, removeExpense } = useExpenses();
  const bookings = useBookings((s) => s.bookings);
  const { push } = useToast();
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (propertyFilter !== 'all' && e.propertyId !== propertyFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, propertyFilter, categoryFilter]);

  // Авто-распределение shared расходов пропорционально доле выручки
  const pnl = useMemo(() => {
    const hotels = properties.filter((p) => p.type === 'hotel');
    const revenueByProp: Record<string, number> = {};
    for (const p of hotels) revenueByProp[p.id] = 0;
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      if (revenueByProp[b.propertyId] !== undefined) revenueByProp[b.propertyId] += b.amount;
    }
    const totalRev = Object.values(revenueByProp).reduce((s, v) => s + v, 0) || 1;

    const directByProp: Record<string, number> = {};
    let sharedTotal = 0;
    for (const e of expenses) {
      if (e.propertyId === 'shared') sharedTotal += e.amount;
      else directByProp[e.propertyId] = (directByProp[e.propertyId] || 0) + e.amount;
    }

    return hotels.map((p) => {
      const share = revenueByProp[p.id] / totalRev;
      const allocatedShared = Math.round(sharedTotal * share);
      const direct = directByProp[p.id] || 0;
      const totalExpense = direct + allocatedShared;
      const revenue = revenueByProp[p.id];
      const profit = revenue - totalExpense;
      return { property: p, revenue, direct, allocatedShared, totalExpense, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
    });
  }, [expenses, bookings]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = useMemo(() => {
    const m = new Map<ExpenseCategory, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) || 0) + e.amount);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map((e) => ({
      Дата: fmtDate(e.date),
      Категория: EXPENSE_CATEGORY_LABEL[e.category],
      Описание: e.description,
      Поставщик: e.vendor || '',
      Объект: e.propertyId === 'shared' ? 'Общие' : properties.find((p) => p.id === e.propertyId)?.name || e.propertyId,
      Сумма: e.amount,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расходы');
    XLSX.writeFile(wb, `expenses-${new Date().toISOString().slice(0, 10)}.xlsx`);
    push({ tone: 'success', title: 'Экспортировано' });
  };

  return (
    <PageTransition>
      <PageHeader
        title="Расходы / OPEX"
        subtitle="Зарплаты, коммуналка, прачечная, ремонт, амортизация. Авто-распределение на P&L по объектам."
        action={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>Экспорт XLSX</Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Добавить расход</Button>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Расходы итого</p>
          <p className="font-display text-2xl text-text mt-1">{fmtMoney(totalExpenses, { compact: true })}</p>
          <p className="text-[11px] text-text-muted mt-0.5">{expenses.length} операций</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">ФОТ</p>
          <p className="font-display text-2xl text-text mt-1">{fmtMoney(expenses.filter((e) => e.category === 'salary').reduce((s, e) => s + e.amount, 0), { compact: true })}</p>
          <Badge tone="primary" className="mt-2">salary</Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Коммуналка + прачечная</p>
          <p className="font-display text-2xl text-text mt-1">{fmtMoney(expenses.filter((e) => e.category === 'utilities' || e.category === 'laundry').reduce((s, e) => s + e.amount, 0), { compact: true })}</p>
          <Badge tone="info" className="mt-2">utilities</Badge>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Комиссии каналов</p>
          <p className="font-display text-2xl text-text mt-1">{fmtMoney(expenses.filter((e) => e.category === 'commission').reduce((s, e) => s + e.amount, 0), { compact: true })}</p>
          <Badge tone="error" className="mt-2">commission</Badge>
        </Card>
      </div>

      {/* P&L по объектам */}
      <Card padding="md" className="mb-5">
        <CardHeader title="P&L по объектам" subtitle="Выручка минус прямые и распределённые общие расходы" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-bold text-text-muted border-b border-border">
                <th className="py-2.5 pr-3">Объект</th>
                <th className="py-2.5 pr-3 text-right">Выручка</th>
                <th className="py-2.5 pr-3 text-right">Прямые</th>
                <th className="py-2.5 pr-3 text-right">Распределённые</th>
                <th className="py-2.5 pr-3 text-right">Прибыль</th>
                <th className="py-2.5 text-right">Маржа</th>
              </tr>
            </thead>
            <tbody>
              {pnl.map((row) => (
                <tr key={row.property.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="py-2.5 pr-3 font-bold text-text">{row.property.name}</td>
                  <td className="py-2.5 pr-3 text-right text-text">{fmtMoney(row.revenue, { compact: true })}</td>
                  <td className="py-2.5 pr-3 text-right text-text-muted">{fmtMoney(row.direct, { compact: true })}</td>
                  <td className="py-2.5 pr-3 text-right text-text-muted">{fmtMoney(row.allocatedShared, { compact: true })}</td>
                  <td className={cn('py-2.5 pr-3 text-right font-bold', row.profit >= 0 ? 'text-success' : 'text-error')}>
                    {fmtMoney(row.profit, { compact: true })}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={row.margin >= 30 ? 'success' : row.margin >= 10 ? 'warning' : 'error'}>
                      {row.margin > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />} {row.margin.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Структура расходов */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card padding="md" className="lg:col-span-2">
          <CardHeader title="Структура по категориям" subtitle="Доля каждой категории в общих расходах" />
          <div className="space-y-2">
            {byCategory.map(([cat, amount]) => {
              const pct = (amount / totalExpenses) * 100;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <Badge tone={CATEGORY_TONE[cat]}>{EXPENSE_CATEGORY_LABEL[cat]}</Badge>
                    </span>
                    <span className="font-bold text-text">{fmtMoney(amount, { compact: true })} <span className="text-text-muted text-xs">· {pct.toFixed(1)}%</span></span>
                  </div>
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="Фильтры" />
          <div className="space-y-3">
            <Select
              label="Объект"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Все объекты' },
                { value: 'shared', label: 'Общие (shared)' },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              label="Категория"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Все категории' },
                ...(Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABEL[c] })),
              ]}
            />
            <div className="pt-2 text-xs text-text-muted flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" /> Найдено: <span className="font-bold text-text">{filtered.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Таблица расходов */}
      <Card padding="md">
        <CardHeader title="Операции" subtitle={`Всего: ${filtered.length}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-bold text-text-muted border-b border-border">
                <th className="py-2.5 pr-3">Дата</th>
                <th className="py-2.5 pr-3">Категория</th>
                <th className="py-2.5 pr-3">Описание</th>
                <th className="py-2.5 pr-3">Объект</th>
                <th className="py-2.5 pr-3">Поставщик</th>
                <th className="py-2.5 pr-3 text-right">Сумма</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="py-2.5 pr-3 text-text-muted">{fmtDate(e.date)}</td>
                  <td className="py-2.5 pr-3"><Badge tone={CATEGORY_TONE[e.category]}>{EXPENSE_CATEGORY_LABEL[e.category]}</Badge></td>
                  <td className="py-2.5 pr-3 text-text">
                    <span className="inline-flex items-center gap-1.5">
                      {e.attachmentName && <Paperclip className="h-3 w-3 text-text-muted" />}
                      {e.description}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-text-muted text-xs">
                    {e.propertyId === 'shared' ? 'Общие' : properties.find((p) => p.id === e.propertyId)?.name || e.propertyId}
                  </td>
                  <td className="py-2.5 pr-3 text-text-muted text-xs">{e.vendor || '—'}</td>
                  <td className="py-2.5 pr-3 text-right font-bold text-text">{fmtMoney(e.amount)}</td>
                  <td className="py-2.5 text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeExpense(e.id)}>
                      <Trash2 className="h-4 w-4 text-error" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-text-muted text-sm">Нет расходов по фильтру</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={(e) => { addExpense(e); push({ tone: 'success', title: 'Расход добавлен' }); }} />
    </PageTransition>
  );
}

// === Модалка добавления расхода ===
function AddExpenseModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (e: Expense) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'utilities' as ExpenseCategory,
    description: '',
    amount: '',
    propertyId: 'shared',
    vendor: '',
    attachmentName: undefined as string | undefined,
    attachmentDataUrl: undefined as string | undefined,
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, attachmentName: file.name, attachmentDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const amount = Number(form.amount);
    if (!form.description || !amount) return;
    onAdd({
      id: `e-${Date.now()}`,
      date: form.date,
      category: form.category,
      description: form.description,
      amount,
      propertyId: form.propertyId,
      vendor: form.vendor || undefined,
      attachmentName: form.attachmentName,
      attachmentDataUrl: form.attachmentDataUrl,
      createdAt: new Date().toISOString(),
    });
    onClose();
    setForm({ date: new Date().toISOString().slice(0, 10), category: 'utilities', description: '', amount: '', propertyId: 'shared', vendor: '', attachmentName: undefined, attachmentDataUrl: undefined });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новый расход"
      subtitle="Заполните параметры. Можно прикрепить скан чека."
      size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Отмена</Button><Button onClick={handleSubmit} leftIcon={<Receipt className="h-4 w-4" />}>Добавить</Button></>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="Дата" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input label="Сумма, ₽" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
        <Select label="Категория" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
          options={(Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABEL[c] }))}
        />
        <Select label="Объект" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
          options={[{ value: 'shared', label: 'Общие (shared)' }, ...properties.map((p) => ({ value: p.id, label: p.name }))]}
        />
        <Input className="col-span-2" label="Поставщик" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Например: Севкавказэнерго" />
        <Textarea className="col-span-2" label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Например: Электроэнергия за ноябрь" />
        <div className="col-span-2">
          <span className="block text-xs font-semibold text-text-muted mb-1.5">Чек / счёт-фактура</span>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button variant="outline" size="sm" leftIcon={<Paperclip className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
            {form.attachmentName ? form.attachmentName : 'Прикрепить файл'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
