// Мастер разрешения конфликта overbooking
import { useState, useMemo } from 'react';
import { ArrowRight, Sparkles, ArrowLeftRight, Building2, Ban } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import type { Booking, BookingConflict, ConflictResolution, Room } from '@/types';
import { useBookings } from '@/store/bookings';
import { useToast } from '@/components/ui/Toast';
import { findAlternativeRooms, findUpgradeRooms } from '@/utils/overbooking';
import { fmtDate, fmtMoney, cn } from '@/utils/format';
import { rooms as allRooms } from '@/mock/data';

const PARTNER_HOTELS = [
  { id: 'p-1', name: 'Гостиница «Кадгарон»', city: 'Владикавказ', distance: '1.2 км', commission: '15%' },
  { id: 'p-2', name: 'Гранд-Кавказ', city: 'Владикавказ', distance: '2.8 км', commission: '12%' },
  { id: 'p-3', name: 'Отель «Иристон»', city: 'Владикавказ', distance: '3.5 км', commission: '18%' },
];

interface Props {
  open: boolean;
  conflict: BookingConflict | null;
  onClose: () => void;
  onResolved: (conflictId: string, resolution: ConflictResolution, note: string) => void;
}

export function ConflictResolutionModal({ open, conflict, onClose, onResolved }: Props) {
  const { bookings, updateBooking, cancelBooking } = useBookings();
  const { push } = useToast();
  const [strategy, setStrategy] = useState<ConflictResolution | null>(null);
  const [targetBookingId, setTargetBookingId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [note, setNote] = useState('');

  const conflictBookings: Booking[] = useMemo(() => {
    if (!conflict) return [];
    return bookings.filter((b) => conflict.bookingIds.includes(b.id));
  }, [conflict, bookings]);

  const upgradeOptions: Room[] = useMemo(() => {
    if (!conflict || !targetBookingId) return [];
    return findUpgradeRooms(allRooms, bookings, conflict, targetBookingId);
  }, [conflict, bookings, targetBookingId]);

  const alternativeOptions: Room[] = useMemo(() => {
    if (!conflict || !targetBookingId) return [];
    return findAlternativeRooms(allRooms, bookings, conflict, targetBookingId);
  }, [conflict, bookings, targetBookingId]);

  if (!conflict) return null;

  const reset = () => {
    setStrategy(null);
    setTargetBookingId('');
    setSelectedRoomId('');
    setSelectedPartnerId('');
    setNote('');
  };
  const handleClose = () => { reset(); onClose(); };

  const handleApply = () => {
    if (!strategy) return;
    if ((strategy === 'upgrade' || strategy === 'relocate-room') && (!targetBookingId || !selectedRoomId)) {
      push({ tone: 'warning', title: 'Выберите бронь и номер' });
      return;
    }
    if (strategy === 'relocate-partner' && (!targetBookingId || !selectedPartnerId)) {
      push({ tone: 'warning', title: 'Выберите бронь и партнёра' });
      return;
    }
    if (strategy === 'compensate-cancel' && !targetBookingId) {
      push({ tone: 'warning', title: 'Выберите какую бронь отменить' });
      return;
    }

    // Применить
    if (strategy === 'upgrade' || strategy === 'relocate-room') {
      updateBooking(targetBookingId, { roomId: selectedRoomId });
      push({ tone: 'success', title: strategy === 'upgrade' ? 'Гость переведён на апгрейд' : 'Гость перемещён', description: `Номер изменён` });
    } else if (strategy === 'relocate-partner') {
      const partner = PARTNER_HOTELS.find((p) => p.id === selectedPartnerId);
      cancelBooking(targetBookingId);
      push({ tone: 'success', title: 'Бронь передана партнёру', description: partner?.name });
    } else if (strategy === 'compensate-cancel') {
      cancelBooking(targetBookingId);
      push({ tone: 'success', title: 'Бронь отменена с возвратом средств' });
    } else {
      push({ tone: 'info', title: 'Решение записано' });
    }
    onResolved(conflict.id, strategy, note);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Разрешение конфликта"
      subtitle={conflict.description}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Отмена</Button>
          <Button onClick={handleApply} disabled={!strategy}>Применить решение</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Сводка по конфликтным броням */}
        <div>
          <p className="text-xs uppercase font-bold text-text-muted mb-2">Конфликтующие брони</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conflictBookings.map((b) => (
              <Card
                key={b.id}
                padding="sm"
                className={cn('cursor-pointer transition', targetBookingId === b.id && 'ring-2 ring-primary')}
                onClick={() => setTargetBookingId(b.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-display text-text">{b.guestName}</p>
                    <p className="text-[11px] text-text-muted">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</p>
                  </div>
                  <Badge tone="info">{b.channel}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{b.guests} гост.</span>
                  <span className="font-bold text-text">{fmtMoney(b.amount)}</span>
                </div>
              </Card>
            ))}
          </div>
          {targetBookingId && (
            <p className="text-[11px] text-text-muted mt-2">Выбрана бронь для перемещения. Вторая остаётся на этом номере.</p>
          )}
        </div>

        {/* Стратегии */}
        <div>
          <p className="text-xs uppercase font-bold text-text-muted mb-2">Стратегия решения</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <StrategyCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Апгрейд гостя"
              hint="Более дорогая категория за наш счёт"
              active={strategy === 'upgrade'}
              onClick={() => setStrategy('upgrade')}
            />
            <StrategyCard
              icon={<ArrowLeftRight className="h-4 w-4" />}
              label="Перевод в свободный номер"
              hint="Такая же категория в этом же объекте"
              active={strategy === 'relocate-room'}
              onClick={() => setStrategy('relocate-room')}
            />
            <StrategyCard
              icon={<Building2 className="h-4 w-4" />}
              label="Партнёрский отель"
              hint="Передать бронь в партнёрский объект"
              active={strategy === 'relocate-partner'}
              onClick={() => setStrategy('relocate-partner')}
            />
            <StrategyCard
              icon={<Ban className="h-4 w-4" />}
              label="Отмена с возвратом"
              hint="Полный refund + компенсация"
              active={strategy === 'compensate-cancel'}
              onClick={() => setStrategy('compensate-cancel')}
            />
          </div>
        </div>

        {/* Динамический выбор зависит от стратегии */}
        {strategy === 'upgrade' && (
          <RoomPicker
            title={`Свободные номера выше категорией (${upgradeOptions.length})`}
            rooms={upgradeOptions}
            selected={selectedRoomId}
            onSelect={setSelectedRoomId}
            empty="Нет доступных апгрейдов на эти даты"
          />
        )}
        {strategy === 'relocate-room' && (
          <RoomPicker
            title={`Свободные номера той же категории (${alternativeOptions.length})`}
            rooms={alternativeOptions}
            selected={selectedRoomId}
            onSelect={setSelectedRoomId}
            empty="Нет свободных номеров той же категории"
          />
        )}
        {strategy === 'relocate-partner' && (
          <div>
            <p className="text-xs uppercase font-bold text-text-muted mb-2">Партнёрский отель</p>
            <div className="space-y-2">
              {PARTNER_HOTELS.map((p) => (
                <Card
                  key={p.id}
                  padding="sm"
                  className={cn('cursor-pointer transition flex items-center justify-between', selectedPartnerId === p.id && 'ring-2 ring-primary')}
                  onClick={() => setSelectedPartnerId(p.id)}
                >
                  <div>
                    <p className="font-bold text-text">{p.name}</p>
                    <p className="text-[11px] text-text-muted">{p.city} · {p.distance} от вашего отеля</p>
                  </div>
                  <Badge tone="gold">Комиссия {p.commission}</Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Textarea
          label="Комментарий для журнала"
          placeholder="Например: гость уведомлен по WhatsApp, согласен на апгрейд"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function StrategyCard({
  icon, label, hint, active, onClick,
}: { icon: React.ReactNode; label: string; hint: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left rounded-card border p-3 transition flex items-start gap-3 w-full',
        active ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface-2'
      )}
    >
      <span className={cn('h-9 w-9 rounded-btn flex items-center justify-center shrink-0', active ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted')}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-text">{label}</span>
        <span className="block text-[11px] text-text-muted mt-0.5">{hint}</span>
      </span>
      <ArrowRight className={cn('h-4 w-4 shrink-0 mt-1', active ? 'text-primary' : 'text-text-muted/40')} />
    </button>
  );
}

function RoomPicker({
  title, rooms, selected, onSelect, empty,
}: { title: string; rooms: Room[]; selected: string; onSelect: (id: string) => void; empty: string }) {
  return (
    <div>
      <p className="text-xs uppercase font-bold text-text-muted mb-2">{title}</p>
      {rooms.length === 0 ? (
        <Card padding="sm" className="text-center text-sm text-text-muted">{empty}</Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {rooms.slice(0, 9).map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                'rounded-card border p-2.5 text-left transition',
                selected === r.id ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <p className="text-sm font-bold text-text">№ {r.number}</p>
              <p className="text-[11px] text-text-muted">{r.category} · {fmtMoney(r.basePrice)}/ночь</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
