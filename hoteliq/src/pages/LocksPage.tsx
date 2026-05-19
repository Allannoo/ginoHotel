// Страница: Электронные замки (TTLock / Igloohome / Salto и др.)
// + виртуальные ключи (PIN-коды), отправка гостю по SMS/Email/Telegram
import { useMemo, useState } from 'react';
import {
  KeyRound, Wifi, WifiOff, BatteryLow, Send, RotateCcw, Smartphone,
  ShieldAlert, CheckCircle2, AlertCircle, MessageSquare, Mail,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { useLocks } from '@/store/locks';
import { useBookings } from '@/store/bookings';
import { rooms, properties } from '@/mock/data';
import { fmtDate, cn, fmtDateLong } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import type { LockStatus, VirtualKey, VirtualKeyStatus } from '@/types';

const LOCK_STATUS_TONE: Record<LockStatus, 'success' | 'neutral' | 'warning' | 'error'> = {
  online: 'success', offline: 'neutral', 'low-battery': 'warning', tamper: 'error',
};
const LOCK_STATUS_LABEL: Record<LockStatus, string> = {
  online: 'Онлайн', offline: 'Офлайн', 'low-battery': 'Низкий заряд', tamper: 'Тревога',
};
const KEY_STATUS_TONE: Record<VirtualKeyStatus, 'info' | 'success' | 'neutral' | 'warning' | 'error'> = {
  scheduled: 'info', active: 'success', used: 'neutral', expired: 'neutral', revoked: 'error',
};
const KEY_STATUS_LABEL: Record<VirtualKeyStatus, string> = {
  scheduled: 'Запланирован', active: 'Активен', used: 'Использован', expired: 'Истёк', revoked: 'Отозван',
};

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function LocksPage() {
  const { locks, keys, events, issueKey, revokeKey } = useLocks();
  const bookings = useBookings((s) => s.bookings);
  const { push } = useToast();
  const [propFilter, setPropFilter] = useState<string>('all');
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const filteredLocks = useMemo(
    () => locks.filter((l) => propFilter === 'all' || l.propertyId === propFilter),
    [locks, propFilter]
  );

  const stats = useMemo(() => ({
    total: locks.length,
    online: locks.filter((l) => l.status === 'online').length,
    offline: locks.filter((l) => l.status === 'offline').length,
    lowBattery: locks.filter((l) => l.batteryLevel < 25 || l.status === 'low-battery').length,
    activeKeys: keys.filter((k) => k.status === 'active').length,
  }), [locks, keys]);

  return (
    <PageTransition>
      <PageHeader
        title="Электронные замки и виртуальные ключи"
        subtitle="TTLock / Igloohome / Salto. Виртуальный ключ автоматически уходит гостю после оплаты — SMS, Email, Telegram."
        action={
          <>
            <Select
              value={propFilter}
              onChange={(e) => setPropFilter(e.target.value)}
              options={[{ value: 'all', label: 'Все объекты' }, ...properties.filter((p) => p.type === 'hotel').map((p) => ({ value: p.id, label: p.name }))]}
              className="!h-10 w-56"
            />
            <Button leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => setIssueModalOpen(true)}>
              Выдать ключ
            </Button>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Замков всего</p>
          <p className="font-display text-2xl text-text mt-1">{stats.total}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Онлайн</p>
          <p className="font-display text-2xl text-success mt-1">{stats.online}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Офлайн</p>
          <p className="font-display text-2xl text-text-muted mt-1">{stats.offline}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Низкий заряд</p>
          <p className="font-display text-2xl text-warning mt-1">{stats.lowBattery}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase font-bold text-text-muted">Активных ключей</p>
          <p className="font-display text-2xl text-primary mt-1">{stats.activeKeys}</p>
        </Card>
      </div>

      {/* Замки */}
      <Card padding="md" className="mb-5">
        <CardHeader title="Замки" subtitle="Состояние оборудования по номерам" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLocks.map((l) => {
            const room = rooms.find((r) => r.id === l.roomId);
            const prop = properties.find((p) => p.id === l.propertyId);
            return (
              <div key={l.id} className="rounded-card border border-border bg-surface p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-9 w-9 rounded-btn bg-primary/10 text-primary flex items-center justify-center">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text">№ {room?.number ?? '?'} <span className="text-text-muted text-xs">· {room?.category}</span></p>
                    <p className="text-[11px] text-text-muted truncate">{prop?.name}</p>
                  </div>
                  <Badge tone={LOCK_STATUS_TONE[l.status]} dot>{LOCK_STATUS_LABEL[l.status]}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-text-muted">
                  <div>
                    <p>Провайдер</p>
                    <p className="font-bold text-text mt-0.5">{l.provider}</p>
                  </div>
                  <div>
                    <p>Прошивка</p>
                    <p className="font-bold text-text mt-0.5">v{l.firmwareVersion}</p>
                  </div>
                  <div>
                    <p>Батарея</p>
                    <p className={cn('font-bold mt-0.5', l.batteryLevel < 25 ? 'text-warning' : 'text-text')}>{l.batteryLevel}%</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    {l.status === 'online' ? <Wifi className="h-3 w-3" /> : l.status === 'low-battery' ? <BatteryLow className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    SN: {l.serialNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Виртуальные ключи */}
      <Card padding="md" className="mb-5">
        <CardHeader title="Виртуальные ключи" subtitle="Активные PIN-коды для гостей" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-bold text-text-muted border-b border-border">
                <th className="py-2.5 pr-3">Гость</th>
                <th className="py-2.5 pr-3">Номер</th>
                <th className="py-2.5 pr-3">PIN</th>
                <th className="py-2.5 pr-3">Действует</th>
                <th className="py-2.5 pr-3">Каналы</th>
                <th className="py-2.5 pr-3">Статус</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const lock = locks.find((l) => l.id === k.lockId);
                const room = rooms.find((r) => r.id === lock?.roomId);
                return (
                  <tr key={k.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                    <td className="py-2.5 pr-3 font-bold text-text">{k.guestName}</td>
                    <td className="py-2.5 pr-3 text-text-muted">№ {room?.number ?? '?'}</td>
                    <td className="py-2.5 pr-3"><code className="font-mono text-lg tracking-widest text-primary font-bold">{k.pinCode}</code></td>
                    <td className="py-2.5 pr-3 text-text-muted text-xs">{fmtDate(k.validFrom)} — {fmtDate(k.validTo)}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex gap-1">
                        {k.sentVia.includes('sms') && <Badge tone="info" className="!text-[10px]"><MessageSquare className="h-2.5 w-2.5" /></Badge>}
                        {k.sentVia.includes('email') && <Badge tone="primary" className="!text-[10px]"><Mail className="h-2.5 w-2.5" /></Badge>}
                        {k.sentVia.includes('telegram') && <Badge tone="info" className="!text-[10px]">TG</Badge>}
                        {k.sentVia.includes('whatsapp') && <Badge tone="success" className="!text-[10px]">WA</Badge>}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><Badge tone={KEY_STATUS_TONE[k.status]}>{KEY_STATUS_LABEL[k.status]}</Badge></td>
                    <td className="py-2.5 text-right">
                      {k.status === 'active' && (
                        <Button size="sm" variant="ghost" onClick={() => { revokeKey(k.id); push({ tone: 'warning', title: 'Ключ отозван' }); }}>
                          <RotateCcw className="h-3.5 w-3.5 text-error" /> Отозвать
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {keys.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-text-muted">Ключей пока нет</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Журнал событий */}
      <Card padding="md">
        <CardHeader title="Журнал доступа" subtitle="Последние события всех замков" />
        <div className="space-y-1">
          {events.map((ev) => {
            const lock = locks.find((l) => l.id === ev.lockId);
            const room = rooms.find((r) => r.id === lock?.roomId);
            const icon =
              ev.type === 'unlock' ? <CheckCircle2 className="h-4 w-4 text-success" /> :
              ev.type === 'denied' ? <ShieldAlert className="h-4 w-4 text-error" /> :
              ev.type === 'low-battery' ? <BatteryLow className="h-4 w-4 text-warning" /> :
              ev.type === 'tamper' ? <AlertCircle className="h-4 w-4 text-error" /> :
              <KeyRound className="h-4 w-4 text-text-muted" />;
            return (
              <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                {icon}
                <span className="font-bold text-text w-16">№ {room?.number ?? '?'}</span>
                <span className="text-text-muted text-xs flex-1">{ev.actor ?? '—'}</span>
                <Badge tone="neutral" className="!text-[10px]">{ev.source}</Badge>
                <span className="text-[11px] text-text-muted font-mono">{fmtDateLong(ev.time)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <IssueKeyModal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onIssue={(k) => { issueKey(k); push({ tone: 'success', title: 'Ключ выпущен и отправлен гостю' }); }}
      />
    </PageTransition>
  );
}

function IssueKeyModal({ open, onClose, onIssue }: { open: boolean; onClose: () => void; onIssue: (k: VirtualKey) => void }) {
  const { locks } = useLocks();
  const bookings = useBookings((s) => s.bookings);
  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checkin');
  const [bookingId, setBookingId] = useState(activeBookings[0]?.id ?? '');
  const [channels, setChannels] = useState<{ sms: boolean; email: boolean; telegram: boolean; whatsapp: boolean }>({ sms: true, email: false, telegram: true, whatsapp: false });

  const booking = bookings.find((b) => b.id === bookingId);
  const lock = booking ? locks.find((l) => l.roomId === booking.roomId) : undefined;

  const handleIssue = () => {
    if (!booking || !lock) return;
    const sentVia: VirtualKey['sentVia'] = [];
    if (channels.sms) sentVia.push('sms');
    if (channels.email) sentVia.push('email');
    if (channels.telegram) sentVia.push('telegram');
    if (channels.whatsapp) sentVia.push('whatsapp');
    onIssue({
      id: `key-${Date.now()}`,
      lockId: lock.id,
      bookingId: booking.id,
      guestName: booking.guestName,
      pinCode: generatePin(),
      validFrom: booking.checkIn,
      validTo: booking.checkOut,
      status: 'scheduled',
      sentVia,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title="Выпустить виртуальный ключ" subtitle="Гостю придёт PIN-код по выбранным каналам"
      size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Отмена</Button><Button leftIcon={<Send className="h-4 w-4" />} onClick={handleIssue} disabled={!booking || !lock}>Выпустить и отправить</Button></>}
    >
      <div className="space-y-4">
        <Select
          label="Бронь"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          options={activeBookings.map((b) => ({ value: b.id, label: `${b.guestName} · ${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)}` }))}
        />
        {!lock && booking && (
          <p className="text-sm text-warning">На этот номер не установлен электронный замок.</p>
        )}
        {lock && (
          <Card padding="sm" className="bg-surface-2">
            <div className="text-xs space-y-1">
              <p><span className="text-text-muted">Замок:</span> <span className="font-bold text-text">{lock.provider} {lock.serialNumber}</span></p>
              <p><span className="text-text-muted">Статус:</span> <Badge tone={LOCK_STATUS_TONE[lock.status]}>{LOCK_STATUS_LABEL[lock.status]}</Badge></p>
              <p><span className="text-text-muted">Заряд:</span> <span className="font-bold text-text">{lock.batteryLevel}%</span></p>
            </div>
          </Card>
        )}
        <div>
          <p className="text-xs font-bold text-text-muted mb-2">Каналы отправки</p>
          <div className="grid grid-cols-2 gap-2">
            {(['sms', 'email', 'telegram', 'whatsapp'] as const).map((ch) => (
              <label key={ch} className="flex items-center gap-2 p-2 rounded-card border border-border cursor-pointer hover:bg-surface-2">
                <input type="checkbox" checked={channels[ch]} onChange={(e) => setChannels({ ...channels, [ch]: e.target.checked })} className="accent-primary" />
                <span className="text-sm capitalize">{ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : ch === 'telegram' ? 'Telegram' : 'WhatsApp'}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-text-muted inline-flex items-center gap-1"><Smartphone className="h-3 w-3" /> PIN сгенерируется автоматически и активируется в момент заезда.</p>
      </div>
    </Modal>
  );
}
