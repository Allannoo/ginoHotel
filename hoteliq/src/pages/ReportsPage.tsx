// Отчёты — конструктор + планировщик рассылки
import { useMemo, useState } from 'react';
import { BarChart3, Calendar, Mail, Play, Plus, Send, Settings2, Trash2 } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn, fmtMoney } from '@/utils/format';
import { properties } from '@/mock/data';
import { useBookings } from '@/store/bookings';
import { CHANNEL_LABEL, BOOKING_STATUS_LABEL } from '@/utils/i18n';
import {
  useReports, REPORT_FIELD_LABEL, GROUP_BY_LABEL, CHART_TYPE_LABEL, FREQUENCY_LABEL,
  type ReportField, type GroupBy, type ChartType, type Frequency, type SavedReport,
} from '@/store/reports';

export default function ReportsPage() {
  const reports = useReports((s) => s.reports);
  const scheduled = useReports((s) => s.scheduled);
  const saveReport = useReports((s) => s.saveReport);
  const removeReport = useReports((s) => s.removeReport);
  const schedule = useReports((s) => s.schedule);
  const toggleSchedule = useReports((s) => s.toggleSchedule);
  const removeSchedule = useReports((s) => s.removeSchedule);
  const runNow = useReports((s) => s.runNow);
  const { push } = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<SavedReport | null>(null);
  const [previewFor, setPreviewFor] = useState<SavedReport | null>(null);

  return (
    <PageTransition>
      <PageHeader
        title="Отчёты и аналитика"
        subtitle="Конструктор: выбираете поля, фильтры, группировку и тип графика. Планировщик: отчёт уходит на email по расписанию."
        action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setBuilderOpen(true)}>Новый отчёт</Button>}
      />

      {/* Сохранённые отчёты */}
      <Card padding="md" className="mb-5">
        <CardHeader title="Сохранённые отчёты" subtitle={`${reports.length} шт.`} />
        {reports.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">Нет отчётов — нажмите «Новый отчёт»</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {reports.map((r) => (
              <Card key={r.id} padding="md" className="border border-border">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-text truncate">{r.name}</p>
                    {r.description && <p className="text-xs text-text-muted">{r.description}</p>}
                  </div>
                  <Badge tone="info">{CHART_TYPE_LABEL[r.chart]}</Badge>
                </div>
                <p className="text-xs text-text-muted mb-2">
                  Поля: {r.fields.map((f) => REPORT_FIELD_LABEL[f]).join(', ')}
                </p>
                <p className="text-xs text-text-muted mb-3">Группировка: {GROUP_BY_LABEL[r.groupBy]}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="secondary" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => setPreviewFor(r)}>Запустить</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={() => setScheduleFor(r)}>В рассылку</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => { removeReport(r.id); push({ tone: 'warning', title: 'Отчёт удалён' }); }}>Удалить</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Планировщик */}
      <Card padding="md">
        <CardHeader title="Расписание рассылки" subtitle="Отчёты автоматически уходят получателям по почте" />
        {scheduled.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">Расписаний нет</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map((sc) => {
              const r = reports.find((x) => x.id === sc.reportId);
              return (
                <div key={sc.id} className="p-3 rounded-btn border border-border flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text">{r?.name ?? '(отчёт удалён)'}</p>
                    <p className="text-xs text-text-muted">
                      {FREQUENCY_LABEL[sc.frequency]} · {sc.recipients.join(', ')}
                      {sc.lastRunAt && ` · последний запуск: ${new Date(sc.lastRunAt).toLocaleString('ru')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={sc.enabled ? 'success' : 'neutral'} dot>{sc.enabled ? 'Активна' : 'Пауза'}</Badge>
                    <Button size="sm" variant="ghost" leftIcon={<Send className="h-3.5 w-3.5" />} onClick={() => { runNow(sc.id); push({ tone: 'success', title: 'Отправлено', description: sc.recipients.join(', ') }); }}>Сейчас</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleSchedule(sc.id)}>{sc.enabled ? 'Пауза' : 'Включить'}</Button>
                    <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => removeSchedule(sc.id)}>Удалить</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ReportBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={(payload) => {
          saveReport(payload);
          setBuilderOpen(false);
          push({ tone: 'success', title: 'Отчёт сохранён' });
        }}
      />

      <ScheduleModal
        report={scheduleFor}
        onClose={() => setScheduleFor(null)}
        onSchedule={(s) => {
          schedule(s);
          setScheduleFor(null);
          push({ tone: 'success', title: 'Расписание создано' });
        }}
      />

      <ReportPreviewModal report={previewFor} onClose={() => setPreviewFor(null)} />
    </PageTransition>
  );
}

// =====================================================================
// Конструктор
// =====================================================================
function ReportBuilderModal({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (r: { name: string; description?: string; fields: ReportField[]; groupBy: GroupBy; chart: ChartType; filters: SavedReport['filters'] }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<ReportField[]>(['bookings.count', 'revenue.gross']);
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [chart, setChart] = useState<ChartType>('bar');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [channel, setChannel] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [status, setStatus] = useState('');

  const toggleField = (f: ReportField) => {
    setFields((arr) => arr.includes(f) ? arr.filter((x) => x !== f) : [...arr, f]);
  };

  const reset = () => {
    setName(''); setDescription(''); setFields(['bookings.count', 'revenue.gross']);
    setGroupBy('month'); setChart('bar');
    setDateFrom(''); setDateTo(''); setChannel(''); setPropertyId(''); setStatus('');
  };

  const canSave = name.trim().length > 0 && fields.length > 0;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Конструктор отчёта"
      subtitle="Выберите поля, фильтры и формат вывода"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Отмена</Button>
          <Button
            onClick={() => {
              onSave({
                name: name.trim(),
                description: description.trim() || undefined,
                fields,
                groupBy,
                chart,
                filters: {
                  dateFrom: dateFrom || undefined,
                  dateTo: dateTo || undefined,
                  channel: channel || undefined,
                  propertyId: propertyId || undefined,
                  status: status || undefined,
                },
              });
              reset();
            }}
            disabled={!canSave}
          >
            Сохранить отчёт
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Название отчёта *" value={name} onChange={(e) => setName(e.target.value)} placeholder="например, Выручка по каналам" />
        <Textarea label="Описание" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="(необязательно)" />

        <div>
          <p className="text-[11px] uppercase font-bold text-text-muted mb-2">Поля (выберите 1+)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(REPORT_FIELD_LABEL) as ReportField[]).map((f) => (
              <label key={f} className={cn(
                'flex items-center gap-2 p-2 rounded-btn border cursor-pointer text-sm',
                fields.includes(f) ? 'border-primary bg-primary/5' : 'border-border',
              )}>
                <input type="checkbox" checked={fields.includes(f)} onChange={() => toggleField(f)} className="h-4 w-4 accent-primary" />
                <span className="text-text">{REPORT_FIELD_LABEL[f]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Группировка"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            options={(Object.keys(GROUP_BY_LABEL) as GroupBy[]).map((g) => ({ value: g, label: GROUP_BY_LABEL[g] }))}
          />
          <Select
            label="Тип графика"
            value={chart}
            onChange={(e) => setChart(e.target.value as ChartType)}
            options={(Object.keys(CHART_TYPE_LABEL) as ChartType[]).map((c) => ({ value: c, label: CHART_TYPE_LABEL[c] }))}
          />
        </div>

        <div>
          <p className="text-[11px] uppercase font-bold text-text-muted mb-2">Фильтры</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Дата с" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input label="Дата по" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Select
              label="Канал"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              options={[{ value: '', label: 'Все каналы' }, ...Object.entries(CHANNEL_LABEL).map(([k, v]) => ({ value: k, label: v }))]}
            />
            <Select
              label="Объект"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              options={[{ value: '', label: 'Все объекты' }, ...properties.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <Select
              label="Статус"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[{ value: '', label: 'Любой' }, ...Object.entries(BOOKING_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))]}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================================
// Планировщик
// =====================================================================
function ScheduleModal({ report, onClose, onSchedule }: {
  report: SavedReport | null;
  onClose: () => void;
  onSchedule: (s: { reportId: string; recipients: string[]; frequency: Frequency; enabled: boolean }) => void;
}) {
  const [recipients, setRecipients] = useState('director@horizon-pms.ru');
  const [frequency, setFrequency] = useState<Frequency>('weekly');

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title="Запланировать рассылку"
      subtitle={report?.name}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button
            onClick={() => {
              if (!report) return;
              onSchedule({
                reportId: report.id,
                recipients: recipients.split(',').map((e) => e.trim()).filter(Boolean),
                frequency,
                enabled: true,
              });
            }}
            disabled={recipients.trim().length === 0}
          >
            Запланировать
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Textarea
          label="Получатели (email через запятую)"
          rows={2}
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="director@horizon-pms.ru, owner@hotel.ru"
        />
        <Select
          label="Частота"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          options={(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => ({ value: f, label: FREQUENCY_LABEL[f] }))}
        />
        <p className="text-xs text-text-muted">
          <Calendar className="inline h-3 w-3 mr-1" /> Первая рассылка уйдёт в ближайшее запланированное окно.
        </p>
      </div>
    </Modal>
  );
}

// =====================================================================
// Превью отчёта (на лету по текущим данным)
// =====================================================================
function ReportPreviewModal({ report, onClose }: { report: SavedReport | null; onClose: () => void }) {
  const bookings = useBookings((s) => s.bookings);

  const rows = useMemo(() => {
    if (!report) return [];
    let filtered = bookings;
    const f = report.filters;
    if (f.dateFrom) filtered = filtered.filter((b) => b.checkIn >= f.dateFrom!);
    if (f.dateTo) filtered = filtered.filter((b) => b.checkIn <= f.dateTo!);
    if (f.channel) filtered = filtered.filter((b) => b.channel === f.channel);
    if (f.propertyId) filtered = filtered.filter((b) => b.propertyId === f.propertyId);
    if (f.status) filtered = filtered.filter((b) => b.status === f.status);

    // Группировка
    const buckets = new Map<string, typeof filtered>();
    for (const b of filtered) {
      let key = 'Всё';
      switch (report.groupBy) {
        case 'month': key = b.checkIn.slice(0, 7); break;
        case 'week': {
          const d = new Date(b.checkIn);
          const onejan = new Date(d.getFullYear(), 0, 1);
          const week = Math.ceil((((+d - +onejan) / 86400000) + onejan.getDay() + 1) / 7);
          key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
          break;
        }
        case 'day': key = b.checkIn.slice(0, 10); break;
        case 'channel': key = CHANNEL_LABEL[b.channel]; break;
        case 'property': key = properties.find((p) => p.id === b.propertyId)?.name ?? '—'; break;
        default: key = 'Всё';
      }
      const arr = buckets.get(key) ?? [];
      arr.push(b);
      buckets.set(key, arr);
    }

    return Array.from(buckets.entries()).map(([key, items]) => {
      const amount = items.reduce((s, b) => s + b.amount, 0);
      const nights = items.reduce((s, b) => {
        const d = (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000;
        return s + Math.max(1, Math.round(d));
      }, 0);
      const commission = items.reduce((s, b) => s + (b.commission ?? 0), 0);
      const cancellations = items.filter((b) => b.status === 'cancelled').length;
      return {
        key,
        values: {
          'bookings.count': items.length,
          'bookings.amount': amount,
          'bookings.adr': nights ? Math.round(amount / nights) : 0,
          'bookings.nights': nights,
          'occupancy': Math.min(100, Math.round((nights / Math.max(1, items.length * 3)) * 100)),
          'guests.new': Math.round(items.length * 0.6),
          'guests.returning': Math.round(items.length * 0.4),
          'cancellations': cancellations,
          'revenue.gross': amount,
          'revenue.net': amount - commission,
          'commissions': commission,
          'expenses': Math.round(amount * 0.18),
          'profit': Math.round(amount * 0.82 - commission),
        } as Record<ReportField, number>,
      };
    });
  }, [report, bookings]);

  if (!report) return null;
  const maxValue = Math.max(1, ...rows.flatMap((r) => report.fields.map((f) => r.values[f] ?? 0)));

  const fmt = (f: ReportField, v: number) => {
    if (['bookings.amount', 'bookings.adr', 'revenue.gross', 'revenue.net', 'commissions', 'expenses', 'profit'].includes(f)) return fmtMoney(v);
    if (f === 'occupancy') return `${v}%`;
    return String(v);
  };

  return (
    <Modal open={!!report} onClose={onClose} title={report.name} subtitle="Превью на текущих данных" size="lg">
      <div className="space-y-3">
        {report.chart === 'kpi' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {report.fields.map((f) => {
              const total = rows.reduce((s, r) => s + (r.values[f] ?? 0), 0);
              return (
                <Card key={f} padding="md">
                  <p className="text-[11px] uppercase font-bold text-text-muted">{REPORT_FIELD_LABEL[f]}</p>
                  <p className="font-display text-2xl text-primary">{fmt(f, total)}</p>
                </Card>
              );
            })}
          </div>
        )}

        {(report.chart === 'bar' || report.chart === 'line') && (
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">Нет данных под фильтры</p>
            ) : rows.map((row) => (
              <div key={row.key}>
                <p className="text-xs font-bold text-text mb-1">{row.key}</p>
                <div className="space-y-1">
                  {report.fields.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <span className="w-40 text-text-muted truncate">{REPORT_FIELD_LABEL[f]}</span>
                      <div className="flex-1 h-4 bg-surface-2 rounded-btn overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${((row.values[f] ?? 0) / maxValue) * 100}%` }} />
                      </div>
                      <span className="w-24 text-right font-mono text-text">{fmt(f, row.values[f] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(report.chart === 'table' || report.chart === 'pie') && (
          <div className="border border-border rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] uppercase font-bold text-text-muted">{GROUP_BY_LABEL[report.groupBy]}</th>
                  {report.fields.map((f) => (
                    <th key={f} className="px-3 py-2 text-right text-[11px] uppercase font-bold text-text-muted">{REPORT_FIELD_LABEL[f]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={report.fields.length + 1} className="text-center py-6 text-text-muted">Нет данных</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="px-3 py-2 font-bold text-text">{row.key}</td>
                    {report.fields.map((f) => (
                      <td key={f} className="px-3 py-2 text-right font-mono text-text">{fmt(f, row.values[f] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" leftIcon={<BarChart3 className="h-4 w-4" />}>Экспорт CSV</Button>
          <Button variant="ghost" leftIcon={<Settings2 className="h-4 w-4" />}>Экспорт PDF</Button>
        </div>
      </div>
    </Modal>
  );
}
