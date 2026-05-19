// Менеджер каналов: подключения, синхронизация, лог
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Plug, RefreshCcw, Settings as Cog, Compass, MapPin, Home, Theater, Hash, Tag, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PageTransition, StaggerList, staggerItem } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { channels as initial, syncLog, properties, rooms as allRooms } from '@/mock/data';
import type { ChannelConnection, BookingConflict, ConflictResolution } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { cn, fmtDate } from '@/utils/format';
import { useBookings } from '@/store/bookings';
import { detectOverbookings } from '@/utils/overbooking';
import { ConflictResolutionModal } from '@/components/ConflictResolutionModal';

const RESOLUTION_LABEL: Record<ConflictResolution, string> = {
  upgrade: 'Апгрейд гостя',
  'relocate-room': 'Перевод в другой номер',
  'relocate-partner': 'Партнёрский отель',
  'compensate-cancel': 'Отмена с возвратом',
  manual: 'Ручное решение',
};

const CHANNEL_VISUAL: Record<string, { Icon: typeof Compass; gradient: string }> = {
  ostrovok:   { Icon: Compass,  gradient: 'from-info to-primary' },
  yandex:     { Icon: MapPin,   gradient: 'from-warning to-gold' },
  sutochno:   { Icon: Home,     gradient: 'from-success to-info' },
  otello:     { Icon: Theater,  gradient: 'from-primary to-info' },
  '101hotels':{ Icon: Hash,     gradient: 'from-error to-warning' },
  avito:      { Icon: Tag,      gradient: 'from-success to-gold' },
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState(initial);
  const [connectFor, setConnectFor] = useState<ChannelConnection | null>(null);
  const { push } = useToast();
  const bookings = useBookings((s) => s.bookings);

  // Детектор overbooking: пробегаем по всем активным броням и ищем пересечения по номеру
  const detectedConflicts = useMemo<BookingConflict[]>(() => detectOverbookings(bookings), [bookings]);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => new Set());
  const [resolutionLog, setResolutionLog] = useState<{ id: string; resolution: ConflictResolution; note: string; at: string }[]>([]);
  const openConflicts = useMemo(
    () => detectedConflicts.filter((c) => !resolvedIds.has(c.id)),
    [detectedConflicts, resolvedIds]
  );
  const [activeConflict, setActiveConflict] = useState<BookingConflict | null>(null);

  const handleConnect = (ch: ChannelConnection) => {
    setChannels((arr) => arr.map((c) => c.id === ch.id ? { ...c, connected: true, hasError: false, lastSync: 'только что' } : c));
    push({ tone: 'success', title: 'Канал подключён', description: ch.name });
    setConnectFor(null);
  };

  const handleSyncAll = () => {
    push({ tone: 'info', title: 'Синхронизация запущена', description: 'Обновление всех каналов...' });
    setTimeout(() => push({ tone: 'success', title: 'Готово', description: 'Все каналы синхронизированы' }), 1200);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Менеджер каналов"
        subtitle="Подключения к OTA-площадкам и синхронизация бронирований"
        action={
          <Button size="md" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={handleSyncAll}>
            Синхронизировать все
          </Button>
        }
      />

      {/* Карточки каналов */}
      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {channels.map((ch) => {
          const cfg = CHANNEL_VISUAL[ch.channel] ?? CHANNEL_VISUAL.ostrovok;
          const { Icon } = cfg;
          return (
          <motion.div key={ch.id} variants={staggerItem}>
            <Card hoverable padding="md">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn('h-12 w-12 rounded-btn flex items-center justify-center shrink-0 bg-gradient-to-br text-white shadow-soft', cfg.gradient)}>
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-text leading-tight">{ch.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">Последняя синхронизация: {ch.lastSync}</p>
                </div>
                {ch.hasError ? (
                  <Badge tone="error" dot>Ошибка</Badge>
                ) : ch.connected ? (
                  <Badge tone="success" dot>Активен</Badge>
                ) : (
                  <Badge tone="neutral" dot>Не подключён</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Активных броней</p>
                  <p className="font-display text-xl text-text mt-0.5">{ch.activeBookings}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Наценка</p>
                  <p className="font-display text-xl text-text mt-0.5">{ch.markup}%</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {ch.connected ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" leftIcon={<RefreshCcw className="h-3.5 w-3.5" />}>
                      Синхронизировать
                    </Button>
                    <Button variant="ghost" size="icon"><Cog className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <Button size="sm" className="w-full" leftIcon={<Plug className="h-3.5 w-3.5" />} onClick={() => setConnectFor(ch)}>
                    Подключить
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
          );
        })}
      </StaggerList>

      {/* === Channel Manager 2.0: конфликты бронирований === */}
      <Card padding="md" className="mb-6">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              Конфликты бронирований
              {openConflicts.length > 0 ? (
                <Badge tone="error">{openConflicts.length}</Badge>
              ) : (
                <Badge tone="success">Нет</Badge>
              )}
            </span>
          }
          subtitle="2-way sync через webhooks. Детектор overbooking запускается каждый раз при получении новой брони от канала."
          action={
            <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted">
              <ShieldCheck className="h-4 w-4 text-success" />
              Webhook-эндпоинт: <span className="font-mono">/api/v1/channel/webhook</span>
            </div>
          }
        />

        {openConflicts.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-2/50 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-sm font-bold text-text">Конфликтов не обнаружено</p>
            <p className="text-xs text-text-muted mt-1">Все брони согласованы между каналами.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openConflicts.map((c) => {
              const room = allRooms.find((r) => r.id === c.roomId);
              const conflictBookings = bookings.filter((b) => c.bookingIds.includes(b.id));
              return (
                <div key={c.id} className="rounded-card border border-error/40 bg-error/5 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="h-10 w-10 rounded-btn bg-error/15 text-error flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text">
                      Номер № {room?.number ?? '—'} ({room?.category}) — двойная бронь
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {conflictBookings.map((b) => (
                        <span key={b.id} className="mr-2">
                          <span className="font-bold text-text">{b.guestName}</span> ({b.channel}, {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)})
                        </span>
                      ))}
                    </p>
                  </div>
                  <Badge tone={c.severity === 'high' ? 'error' : 'warning'}>{c.severity === 'high' ? 'Высокий' : 'Средний'}</Badge>
                  <Button size="sm" onClick={() => setActiveConflict(c)}>Разрешить</Button>
                </div>
              );
            })}
          </div>
        )}

        {resolutionLog.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[11px] uppercase font-bold text-text-muted mb-2">Журнал разрешений</p>
            <div className="space-y-1.5">
              {resolutionLog.slice(0, 5).map((r) => (
                <div key={r.id + r.at} className="flex items-center gap-2 text-xs text-text-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="font-mono">{r.at}</span>
                  <span>·</span>
                  <Badge tone="primary">{RESOLUTION_LABEL[r.resolution]}</Badge>
                  {r.note && <span className="truncate">— {r.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <ConflictResolutionModal
        open={!!activeConflict}
        conflict={activeConflict}
        onClose={() => setActiveConflict(null)}
        onResolved={(id, resolution, note) => {
          setResolvedIds((prev) => new Set([...prev, id]));
          setResolutionLog((prev) => [
            { id, resolution, note, at: new Date().toLocaleTimeString('ru-RU').slice(0, 5) },
            ...prev,
          ]);
        }}
      />

      {/* Лог синхронизации */}
      <Card padding="md">
        <CardHeader title="Лог синхронизации" subtitle="Последние события всех каналов" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-bold text-text-muted border-b border-border">
                <th className="py-2.5 pr-3">Статус</th>
                <th className="py-2.5 pr-3">Канал</th>
                <th className="py-2.5 pr-3">Время</th>
                <th className="py-2.5">Сообщение</th>
              </tr>
            </thead>
            <tbody>
              {syncLog.map((l) => {
                const cfg = {
                  success: { Icon: CheckCircle2, color: 'text-success', tone: 'success' as const, label: 'Успех' },
                  warning: { Icon: AlertCircle, color: 'text-warning', tone: 'warning' as const, label: 'Предупр.' },
                  error: { Icon: XCircle, color: 'text-error', tone: 'error' as const, label: 'Ошибка' },
                }[l.status];
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                    <td className="py-2.5 pr-3"><Badge tone={cfg.tone} dot>{cfg.label}</Badge></td>
                    <td className="py-2.5 pr-3 font-bold text-text">{l.channel}</td>
                    <td className="py-2.5 pr-3 text-text-muted">{l.time}</td>
                    <td className="py-2.5 text-text-muted">{l.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Модалка подключения */}
      <Modal
        open={!!connectFor}
        onClose={() => setConnectFor(null)}
        title={`Подключение: ${connectFor?.name}`}
        subtitle="Настройка API-интеграции"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConnectFor(null)}>Отмена</Button>
            <Button onClick={() => connectFor && handleConnect(connectFor)}>Подключить</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="API Key" placeholder="sk_live_xxxxxxxxxxxx" />
          <Input label="Hotel ID" placeholder="Идентификатор отеля в системе канала" />
          <Select label="Объект для маппинга" options={properties.map((p) => ({ value: p.id, label: p.name }))} />
          <Select label="Стратегия цен" options={[
            { value: 'mirror', label: 'Зеркалить базовые цены' },
            { value: 'markup', label: 'С наценкой' },
            { value: 'custom', label: 'Индивидуально' },
          ]} />
          <Input label="Наценка, %" type="number" defaultValue={0} />
        </div>
      </Modal>
    </PageTransition>
  );
}
