// Страница: Отчёты в МВД (eFMS / уведомление о прибытии иностранца)
// Дедлайн 24 часа от заезда. Форма прибытия по форме №7, форма убытия.
import { useMemo, useState, useEffect } from 'react';
import {
  FileCheck2, Globe2, AlertTriangle, Send, CheckCircle2, FileText,
  Clock, Download, X, ShieldCheck,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { useBookings } from '@/store/bookings';
import { useMvd, MVD_STATUS_LABEL, isForeign } from '@/store/mvd';
import { rooms, properties } from '@/mock/data';
import { fmtDate, fmtDateLong, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import type { MvdReport, MvdReportStatus, Booking, Guest } from '@/types';

const STATUS_TONE: Record<MvdReportStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', submitted: 'warning', accepted: 'success', rejected: 'error',
};

function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

export default function MvdPage() {
  const bookings = useBookings((s) => s.bookings);
  const guests = useBookings((s) => s.guests);
  const { reports, upsertReport, setStatus, removeReport } = useMvd();
  const { push } = useToast();
  const [filter, setFilter] = useState<'all' | MvdReportStatus | 'no-report'>('all');
  const [preview, setPreview] = useState<MvdReport | null>(null);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // Гости-иностранцы среди активных и предстоящих броней
  const foreignBookings = useMemo(() => {
    const map = new Map<string, Booking & { guest: Guest }>();
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      const guest = guests.find((g) => g.id === b.guestId);
      if (!guest) continue;
      if (!isForeign(guest.country)) continue;
      map.set(b.id, { ...b, guest });
    }
    return Array.from(map.values()).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [bookings, guests]);

  // Создать черновики отчётов для иностранцев без отчёта
  const allItems = useMemo(() => {
    return foreignBookings.map((fb) => {
      const existing = reports.find((r) => r.bookingId === fb.id);
      const property = properties.find((p) => p.id === fb.propertyId);
      const room = rooms.find((r) => r.id === fb.roomId);
      return {
        booking: fb,
        guest: fb.guest,
        report: existing,
        property,
        room,
        deadline: new Date(new Date(fb.checkIn).getTime() + 24 * 3600 * 1000).toISOString(),
      };
    });
  }, [foreignBookings, reports]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allItems;
    if (filter === 'no-report') return allItems.filter((x) => !x.report);
    return allItems.filter((x) => x.report?.status === filter);
  }, [allItems, filter]);

  // Сброс страницы при смене фильтра
  useEffect(() => { setPage(1); }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE),
    [filtered, clampedPage]
  );

  const stats = {
    total: allItems.length,
    noReport: allItems.filter((x) => !x.report).length,
    overdue: allItems.filter((x) => !x.report && hoursUntil(x.deadline) < 0).length,
    accepted: reports.filter((r) => r.status === 'accepted').length,
    submitted: reports.filter((r) => r.status === 'submitted').length,
  };

  const createDraft = (it: typeof allItems[number]) => {
    const property = it.property;
    const draft: MvdReport = {
      id: `mvd-${it.booking.id}`,
      guestId: it.guest.id,
      guestFullName: `${it.guest.lastName} ${it.guest.firstName}`,
      bookingId: it.booking.id,
      propertyId: it.booking.propertyId,
      formType: 'arrival',
      arrivalDate: it.booking.checkIn,
      departureDate: it.booking.checkOut,
      citizenship: it.guest.country,
      passportSeries: it.guest.passport?.series,
      passportNumber: it.guest.passport?.number || '00000000',
      registrationAddress: property ? `${property.city}, ${property.address}` : '—',
      status: 'draft',
      deadline: it.deadline,
      createdAt: new Date().toISOString(),
    };
    upsertReport(draft);
    push({ tone: 'success', title: 'Черновик создан' });
    setPreview(draft);
  };

  const submit = (r: MvdReport) => {
    setStatus(r.id, 'submitted', { externalId: `RU-${Math.random().toString(36).slice(2, 10).toUpperCase()}` });
    push({ tone: 'success', title: 'Отчёт отправлен в МВД', description: 'Ожидание подтверждения' });
    // Имитация ответа через 1.5 сек
    setTimeout(() => {
      setStatus(r.id, 'accepted');
      push({ tone: 'success', title: 'МВД подтвердил приём' });
    }, 1500);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Отчёты в МВД для иностранцев"
        subtitle="eFMS: уведомление о прибытии и убытии. Срок — 24 часа с момента заезда. Форма №7."
        action={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Bulk-экспорт</Button>
            <Button leftIcon={<ShieldCheck className="h-4 w-4" />}>Настроить ЭЦП</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Иностранцев</p>
          <p className="font-display text-2xl text-text mt-1">{stats.total}</p>
          <Globe2 className="h-4 w-4 text-text-muted mt-1" />
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Без отчёта</p>
          <p className="font-display text-2xl text-warning mt-1">{stats.noReport}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Просрочено</p>
          <p className="font-display text-2xl text-error mt-1">{stats.overdue}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Отправлено</p>
          <p className="font-display text-2xl text-info mt-1">{stats.submitted}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Принято МВД</p>
          <p className="font-display text-2xl text-success mt-1">{stats.accepted}</p>
        </Card>
      </div>

      <Card padding="md">
        <CardHeader
          title="Иностранные гости"
          subtitle="Дедлайн рассчитывается от даты заезда (24 часа)"
          action={
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'Все' },
                { value: 'no-report', label: 'Без отчёта' },
                { value: 'draft', label: 'Черновики' },
                { value: 'submitted', label: 'Отправлены' },
                { value: 'accepted', label: 'Приняты' },
                { value: 'rejected', label: 'Отклонены' },
              ]}
              className="!h-9 w-44"
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-bold text-text-muted border-b border-border">
                <th className="py-2.5 pr-3">Гость</th>
                <th className="py-2.5 pr-3">Гражданство</th>
                <th className="py-2.5 pr-3">Заезд</th>
                <th className="py-2.5 pr-3">Дедлайн</th>
                <th className="py-2.5 pr-3">Объект</th>
                <th className="py-2.5 pr-3">Статус</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((it) => {
                const hLeft = hoursUntil(it.deadline);
                const overdue = !it.report && hLeft < 0;
                return (
                  <tr key={it.booking.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3">
                      <p className="font-bold text-text">{it.guest.lastName} {it.guest.firstName}</p>
                      <p className="text-[11px] text-text-muted">Паспорт: {it.guest.passport?.number ?? 'не указан'}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-text-muted">{it.guest.country}</td>
                    <td className="py-2.5 pr-3 text-text-muted">{fmtDate(it.booking.checkIn)}</td>
                    <td className="py-2.5 pr-3">
                      {!it.report ? (
                        overdue ? (
                          <Badge tone="error"><AlertTriangle className="h-3 w-3 inline" /> просрочено {Math.abs(hLeft).toFixed(0)} ч</Badge>
                        ) : (
                          <Badge tone={hLeft < 6 ? 'warning' : 'neutral'}>
                            <Clock className="h-3 w-3 inline" /> {hLeft.toFixed(0)} ч
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-text-muted text-xs">{it.property?.name}</td>
                    <td className="py-2.5 pr-3">
                      {it.report
                        ? <Badge tone={STATUS_TONE[it.report.status]}>{MVD_STATUS_LABEL[it.report.status]}</Badge>
                        : <Badge tone="neutral">Нет отчёта</Badge>}
                    </td>
                    <td className="py-2.5 text-right">
                      {!it.report && <Button size="sm" variant="outline" leftIcon={<FileText className="h-3.5 w-3.5" />} onClick={() => createDraft(it)}>Создать</Button>}
                      {it.report?.status === 'draft' && (
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setPreview(it.report!)}>Превью</Button>
                          <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />} onClick={() => submit(it.report!)}>Отправить</Button>
                        </div>
                      )}
                      {it.report && it.report.status !== 'draft' && (
                        <Button size="sm" variant="ghost" onClick={() => setPreview(it.report!)}>Просмотр</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-text-muted">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  Нет иностранных гостей по выбранному фильтру.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Пагинация */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border text-xs">
            <span className="text-text-muted">
              Показано {(clampedPage - 1) * PAGE_SIZE + 1}–{Math.min(clampedPage * PAGE_SIZE, filtered.length)} из {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setPage(1)} disabled={clampedPage === 1}>«</Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={clampedPage === 1}>‹ Назад</Button>
              <span className="px-2 font-bold text-text">{clampedPage} / {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={clampedPage === totalPages}>Вперёд ›</Button>
              <Button size="sm" variant="ghost" onClick={() => setPage(totalPages)} disabled={clampedPage === totalPages}>»</Button>
            </div>
          </div>
        )}
      </Card>

      <ReportPreviewModal report={preview} onClose={() => setPreview(null)} onRemove={removeReport} />
    </PageTransition>
  );
}

function ReportPreviewModal({ report, onClose, onRemove }: { report: MvdReport | null; onClose: () => void; onRemove: (id: string) => void }) {
  if (!report) return null;
  return (
    <Modal open={!!report} onClose={onClose} title="Уведомление о прибытии иностранного гражданина" subtitle="Форма №7" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onRemove(report.id); onClose(); }}>Удалить</Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Скачать PDF</Button>
          <Button onClick={onClose}>Закрыть</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-card border border-border bg-surface-2/40 p-4">
          <p className="text-center font-bold text-text mb-1">УВЕДОМЛЕНИЕ</p>
          <p className="text-center text-[11px] text-text-muted">о прибытии иностранного гражданина или лица без гражданства в место пребывания</p>
        </div>
        <KV label="ФИО иностранного гражданина" value={report.guestFullName} />
        <KV label="Гражданство" value={report.citizenship} />
        <KV label="Паспорт" value={`${report.passportSeries ?? ''} ${report.passportNumber}`} />
        <KV label="Тип формы" value={report.formType === 'arrival' ? 'Прибытие' : 'Убытие'} />
        <KV label="Дата прибытия" value={fmtDate(report.arrivalDate)} />
        <KV label="Дата убытия" value={fmtDate(report.departureDate)} />
        <KV label="Место пребывания" value={report.registrationAddress} />
        <KV label="Статус" value={MVD_STATUS_LABEL[report.status]} highlight />
        {report.externalId && <KV label="ID в Госуслугах" value={report.externalId} />}
        {report.submittedAt && <KV label="Отправлено" value={fmtDateLong(report.submittedAt)} />}
        {report.acceptedAt && <KV label="Принято МВД" value={fmtDateLong(report.acceptedAt)} />}
        {report.rejectionReason && (
          <div className="rounded-card border border-error/40 bg-error/5 p-3 text-error text-xs">
            <X className="h-4 w-4 inline mr-1" /> Причина отклонения: {report.rejectionReason}
          </div>
        )}
        <p className="text-[10px] text-text-muted pt-2 border-t border-border">
          Документ подписывается ЭЦП и автоматически отправляется в подразделение МВД по адресу регистрации. Срок ответа — до 24 часов.
        </p>
      </div>
    </Modal>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
      <span className="text-text-muted text-xs">{label}</span>
      <span className={cn('font-bold text-right', highlight ? 'text-primary' : 'text-text')}>{value}</span>
    </div>
  );
}
