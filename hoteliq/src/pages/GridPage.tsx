// Календарь броней: timeline номера × дни + drag&drop
import { useMemo, useState } from 'react';
import {
  DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, FileText } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import {
  bookings as initialBookings, rooms, properties, guests,
} from '@/mock/data';
import type { Booking, BookingStatus } from '@/types';
import { fmtMoney, fmtDateShort, daysBetween, cn } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

type Zoom = 'day' | 'week' | 'month';

// Цвета статусов
const STATUS_STYLE: Record<BookingStatus, { bg: string; label: string }> = {
  confirmed: { bg: 'bg-primary text-white', label: 'Подтверждено' },
  pending: { bg: 'bg-warning text-white', label: 'Ожидание' },
  checkin: { bg: 'bg-success text-white', label: 'Заезд' },
  checkout: { bg: 'bg-info text-white', label: 'Выезд' },
  blocked: { bg: 'bg-text-muted text-white', label: 'Блок' },
  cancelled: { bg: 'bg-error text-white', label: 'Отмена' },
};

// Размер ячейки в пикселях в зависимости от зума
const ZOOM_CELL: Record<Zoom, number> = { day: 80, week: 36, month: 22 };
const ZOOM_DAYS: Record<Zoom, number> = { day: 14, week: 30, month: 60 };

// ---------- Ячейка-дроп ----------
function GridCell({
  roomId, dateIso, cellW, onClick,
}: { roomId: string; dateIso: string; cellW: number; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${roomId}:${dateIso}` });
  const isWeekend = [0, 6].includes(new Date(dateIso).getDay());
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{ width: cellW }}
      className={cn(
        'h-12 border-r border-b border-border shrink-0 cursor-pointer transition-colors',
        isWeekend && 'bg-surface-2/50',
        isOver && 'bg-primary/20',
      )}
    />
  );
}

// ---------- Бронь (draggable) ----------
function BookingBlock({
  booking, startIdx, length, cellW, onClick, zoom,
}: { booking: Booking; startIdx: number; length: number; cellW: number; onClick: () => void; zoom: Zoom; }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `book:${booking.id}`,
    data: { booking },
  });
  const style = STATUS_STYLE[booking.status];
  const left = startIdx * cellW;
  const width = length * cellW - 4;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute',
        left: left + 2,
        width,
        top: 4,
        height: 40,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.02 : 1})` : undefined,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 50 : 1,
      }}
      className={cn(
        'rounded-btn px-2 flex items-center text-xs font-semibold shadow-soft cursor-grab active:cursor-grabbing transition-shadow',
        style.bg,
      )}
      title={`${booking.guestName}\n${booking.checkIn} → ${booking.checkOut}\n${fmtMoney(booking.amount)}`}
    >
      <span className="truncate">
        {zoom === 'month' ? booking.guestName.split(' ')[0] : booking.guestName}
      </span>
    </div>
  );
}

// ---------- Главная страница ----------
export default function GridPage() {
  const [zoom, setZoom] = useState<Zoom>('day');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() - 2); d.setHours(0, 0, 0, 0); return d;
  });
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bookingList, setBookingList] = useState<Booking[]>(initialBookings);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [createCtx, setCreateCtx] = useState<{ roomId: string; date: string } | null>(null);
  const { push } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const cellW = ZOOM_CELL[zoom];
  const daysCount = ZOOM_DAYS[zoom];

  // Список дат в видимом окне
  const dates = useMemo(() => {
    const arr: { iso: string; d: Date }[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate); d.setDate(d.getDate() + i);
      arr.push({ iso: d.toISOString().slice(0, 10), d });
    }
    return arr;
  }, [startDate, daysCount]);

  // Отфильтрованные номера
  const visibleRooms = useMemo(() => {
    return rooms
      .filter((r) => propertyFilter === 'all' || r.propertyId === propertyFilter)
      .slice(0, 30);
  }, [propertyFilter]);

  // Бронирования, попадающие в видимое окно
  const visibleBookings = useMemo(() => {
    const minIso = dates[0].iso;
    const maxIso = dates[dates.length - 1].iso;
    return bookingList.filter((b) => {
      if (b.checkOut < minIso || b.checkIn > maxIso) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (propertyFilter !== 'all' && b.propertyId !== propertyFilter) return false;
      return true;
    });
  }, [bookingList, dates, statusFilter, propertyFilter]);

  // Группировка по roomId для отрисовки
  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, Booking[]>();
    visibleBookings.forEach((b) => {
      if (!map.has(b.roomId)) map.set(b.roomId, []);
      map.get(b.roomId)!.push(b);
    });
    return map;
  }, [visibleBookings]);

  // Drag end: смещение брони на дни/комнату
  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const bookId = String(e.active.id).replace('book:', '');
    const overId = String(e.over.id);
    if (!overId.startsWith('cell:')) return;
    const [, newRoomId, newDate] = overId.split(':');
    setBookingList((arr) => arr.map((b) => {
      if (b.id !== bookId) return b;
      const duration = daysBetween(b.checkIn, b.checkOut);
      const newOut = new Date(newDate); newOut.setDate(newOut.getDate() + duration);
      return {
        ...b,
        roomId: newRoomId,
        checkIn: newDate,
        checkOut: newOut.toISOString().slice(0, 10),
      };
    }));
    push({ tone: 'success', title: 'Бронь перемещена', description: `Новая дата: ${fmtDateShort(newDate)}` });
  };

  const shiftStart = (days: number) => {
    const d = new Date(startDate); d.setDate(d.getDate() + days); setStartDate(d);
  };

  return (
    <PageTransition>
      {/* Шапка с фильтрами и легендой на уровне заголовка */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-5">
        <div className="shrink-0">
          <h1 className="font-display text-3xl text-text leading-none">Календарь броней</h1>
          <p className="text-sm text-text-muted mt-2">{visibleRooms.length} номеров · {visibleBookings.length} броней в выбранном диапазоне</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Select
              label="Объект"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              options={[{ value: 'all', label: 'Все объекты' }, ...properties.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
          <div className="w-44">
            <Select
              label="Статус"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'confirmed', label: 'Подтверждено' },
                { value: 'pending', label: 'Ожидание' },
                { value: 'checkin', label: 'Заезд' },
                { value: 'checkout', label: 'Выезд' },
                { value: 'blocked', label: 'Блок' },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 rounded-btn bg-surface border border-border h-10">
            {Object.entries(STATUS_STYLE).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[11px]">
                <span className={cn('h-2.5 w-2.5 rounded-full', v.bg)} />
                <span className="text-text-muted whitespace-nowrap">{v.label}</span>
              </span>
            ))}
          </div>
          <Button size="md" leftIcon={<Plus className="h-4 w-4" />}>Новая бронь</Button>
        </div>
      </div>

      {/* Календарь на всю ширину */}
      <Card className="w-full overflow-hidden" padding="none">
          {/* Тулбар */}
          <div className="flex items-center justify-between p-3 border-b border-border gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => shiftStart(-7)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setStartDate(() => { const d = new Date(); d.setDate(d.getDate() - 2); d.setHours(0,0,0,0); return d; })}>Сегодня</Button>
              <Button variant="ghost" size="icon" onClick={() => shiftStart(7)}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            <div className="flex items-center gap-1 bg-surface-2 rounded-btn p-1">
              {(['day', 'week', 'month'] as Zoom[]).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={cn(
                    'px-3 h-7 rounded-md text-xs font-semibold transition-colors',
                    zoom === z ? 'bg-bg text-text shadow-soft' : 'text-text-muted hover:text-text',
                  )}
                >
                  {z === 'day' ? 'День' : z === 'week' ? 'Неделя' : 'Месяц'}
                </button>
              ))}
            </div>
          </div>

          {/* Сетка */}
          <div className="overflow-auto max-h-[calc(100vh-230px)]">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex">
                {/* Левая колонка — номера */}
                <div className="sticky left-0 z-20 bg-surface border-r border-border">
                  <div className="h-12 border-b border-border flex items-center px-4 font-bold text-xs uppercase text-text-muted">
                    Номер
                  </div>
                  {visibleRooms.map((r) => {
                    const prop = properties.find((p) => p.id === r.propertyId);
                    return (
                      <div key={r.id} className="h-12 border-b border-border px-4 flex flex-col justify-center" style={{ width: 200 }}>
                        <p className="text-sm font-bold text-text leading-none">№ {r.number} · {r.category}</p>
                        <p className="text-[10px] text-text-muted truncate mt-0.5">{prop?.name}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Правая часть — даты и брони */}
                <div className="flex-1 min-w-0">
                  {/* Шапка с датами */}
                  <div className="flex sticky top-0 z-10 bg-surface border-b border-border">
                    {dates.map(({ iso, d }) => {
                      const isToday = iso === new Date().toISOString().slice(0, 10);
                      const isWeekend = [0, 6].includes(d.getDay());
                      return (
                        <div
                          key={iso}
                          style={{ width: cellW }}
                          className={cn(
                            'h-12 border-r border-border flex flex-col items-center justify-center shrink-0',
                            isWeekend && 'bg-surface-2/60',
                            isToday && 'bg-primary/10',
                          )}
                        >
                          <p className={cn('text-xs font-bold leading-none', isToday ? 'text-primary' : 'text-text')}>{d.getDate()}</p>
                          {zoom !== 'month' && (
                            <p className="text-[9px] text-text-muted mt-0.5 uppercase">
                              {['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Строки по номерам */}
                  {visibleRooms.map((r) => (
                    <div key={r.id} className="relative flex">
                      {/* Пустые ячейки */}
                      {dates.map(({ iso }) => (
                        <GridCell
                          key={iso}
                          roomId={r.id}
                          dateIso={iso}
                          cellW={cellW}
                          onClick={() => setCreateCtx({ roomId: r.id, date: iso })}
                        />
                      ))}
                      {/* Брони */}
                      {(bookingsByRoom.get(r.id) || []).map((b) => {
                        const startIdx = dates.findIndex((d) => d.iso === b.checkIn);
                        if (startIdx < 0) {
                          // Бронь начинается раньше видимого окна — рисуем от 0
                          const visibleStart = Math.max(0, dates.findIndex((d) => d.iso >= b.checkIn));
                          const visibleEnd = Math.min(dates.length, dates.findIndex((d) => d.iso >= b.checkOut));
                          if (visibleEnd <= visibleStart) return null;
                          return (
                            <BookingBlock
                              key={b.id} booking={b} zoom={zoom}
                              startIdx={visibleStart}
                              length={visibleEnd - visibleStart}
                              cellW={cellW}
                              onClick={() => setSelected(b)}
                            />
                          );
                        }
                        const length = daysBetween(b.checkIn, b.checkOut);
                        return (
                          <BookingBlock
                            key={b.id} booking={b} zoom={zoom}
                            startIdx={startIdx} length={length} cellW={cellW}
                            onClick={() => setSelected(b)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </DndContext>
          </div>
        </Card>

      {/* Модалка деталей */}
      <BookingModal booking={selected} onClose={() => setSelected(null)} onChange={(updated) => {
        setBookingList((arr) => arr.map((b) => b.id === updated.id ? updated : b));
        setSelected(null);
        push({ tone: 'success', title: 'Изменения сохранены' });
      }} />

      {/* Быстрое создание */}
      <CreateBookingModal ctx={createCtx} onClose={() => setCreateCtx(null)} onCreate={(b) => {
        setBookingList((arr) => [b, ...arr]);
        setCreateCtx(null);
        push({ tone: 'success', title: 'Бронь создана', description: `${b.guestName}` });
      }} />
    </PageTransition>
  );
}

// ---------- Модалка деталей ----------
function BookingModal({ booking, onClose, onChange }: {
  booking: Booking | null; onClose: () => void; onChange: (b: Booking) => void;
}) {
  if (!booking) return null;
  const guest = guests.find((g) => g.id === booking.guestId);
  const room = rooms.find((r) => r.id === booking.roomId);
  const prop = properties.find((p) => p.id === booking.propertyId);
  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title={`Бронь ${booking.guestName}`}
      subtitle={`${prop?.name} · Номер ${room?.number}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Закрыть</Button>
          <Button variant="danger">Отменить бронь</Button>
          <Button onClick={() => onChange({ ...booking, status: 'confirmed' })}>Подтвердить</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Info label="Заезд" value={fmtDateShort(booking.checkIn)} />
        <Info label="Выезд" value={fmtDateShort(booking.checkOut)} />
        <Info label="Гостей" value={`${booking.guests}`} />
        <Info label="Источник" value={booking.channel} />
        <Info label="Статус" value={<Badge tone={booking.status === 'confirmed' ? 'success' : 'warning'}>{STATUS_STYLE[booking.status].label}</Badge>} />
        <Info label="Сумма" value={<span className="font-bold text-primary">{fmtMoney(booking.amount)}</span>} />
        {guest && <Info label="Email" value={guest.email} />}
        {guest && <Info label="Телефон" value={guest.phone} />}
      </div>
      {booking.notes && (
        <div className="mt-4 p-3 rounded-btn bg-surface-2 text-sm text-text-muted flex items-start gap-2">
          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{booking.notes}</span>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase font-bold text-text-muted">{label}</p>
      <div className="text-sm text-text mt-1">{value}</div>
    </div>
  );
}

// ---------- Быстрое создание ----------
function CreateBookingModal({ ctx, onClose, onCreate }: {
  ctx: { roomId: string; date: string } | null;
  onClose: () => void;
  onCreate: (b: Booking) => void;
}) {
  const [name, setName] = useState('');
  const [nights, setNights] = useState(2);
  if (!ctx) return null;
  const room = rooms.find((r) => r.id === ctx.roomId);
  const prop = properties.find((p) => p.id === room?.propertyId);

  const handleCreate = () => {
    if (!name.trim() || !room) return;
    const checkIn = ctx.date;
    const out = new Date(ctx.date); out.setDate(out.getDate() + nights);
    onCreate({
      id: `book_new_${Date.now()}`,
      roomId: room.id,
      propertyId: room.propertyId,
      guestId: 'guest_1',
      guestName: name,
      channel: 'direct',
      status: 'confirmed',
      checkIn,
      checkOut: out.toISOString().slice(0, 10),
      guests: 1,
      amount: room.basePrice * nights,
    });
    setName(''); setNights(2);
  };

  return (
    <Modal
      open={!!ctx}
      onClose={onClose}
      title="Новая бронь"
      subtitle={`${prop?.name} · Номер ${room?.number} · ${fmtDateShort(ctx.date)}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Создать</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Имя гостя" placeholder="Иван Иванов" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Кол-во ночей" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(+e.target.value || 1)} />
        <div className="text-sm text-text-muted">
          Сумма: <span className="font-bold text-primary">{room && fmtMoney(room.basePrice * nights)}</span>
        </div>
      </div>
    </Modal>
  );
}
