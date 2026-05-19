// Календарь броней: timeline номера × дни + drag&drop (с persist)
import { useMemo, useState, useEffect, useRef, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, FileText, Upload, BadgeCheck, CalendarDays, Undo2, Check, X, Coffee, Ban, Sparkles, Mail, Download, Info as InfoIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { rooms, properties } from '@/mock/data';
import { useBookings } from '@/store/bookings';
import type { Booking, BookingStatus, Guest, PassportData, Channel, BookingPayment, BookingTariff } from '@/types';
import { fmtMoney, fmtDateShort, daysBetween, cn } from '@/utils/format';
import { fmtDateLong, MONTHS_NOM, MONTHS_GENITIVE } from '@/utils/i18n';
import { ROOM_CATEGORY_LABEL, BOOKING_STATUS_LABEL, CHANNEL_LABEL } from '@/utils/i18n';
import { useToast } from '@/components/ui/Toast';

// Режимы отображения сетки
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

// Ширина ячейки по режиму (День = 1 день крупно, Неделя = 7 дней, Месяц = весь месяц)
const ZOOM_CELL: Record<Zoom, number> = { day: 220, week: 110, month: 42 };

// Сколько дней рендерим в режиме (с запасом для горизонтального скролла)
const ZOOM_DAYS: Record<Zoom, number> = { day: 30, week: 63, month: 120 };

// Цветовая легенда тарифов (Завтрак / Без завтрака / Невозвратный / Всё включено)
const TARIFF_META: Record<BookingTariff, { color: string; label: string; icon: typeof Coffee }> = {
  breakfast:        { color: '#10b981', label: 'Завтрак',        icon: Coffee },
  'no-breakfast':   { color: '#64748b', label: 'Без завтрака',   icon: Ban },
  'non-refundable': { color: '#ef4444', label: 'Невозвратный',   icon: Sparkles },
  'all-inclusive':  { color: '#a855f7', label: 'Всё включено',   icon: BadgeCheck },
};

// Обнулить время
function atMidnight(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
// ISO YYYY-MM-DD локальной даты (без сдвига UTC)
function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
// Кол-во дней в месяце с учётом високосных (зарезервировано)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function daysInMonth(year: number, monthIdx: number) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

// ---------- Ячейка-дроп ----------
function GridCell({
  roomId, dateIso, cellW, rowH, onClick,
}: { roomId: string; dateIso: string; cellW: number; rowH: number; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${roomId}:${dateIso}` });
  const isWeekend = [0, 6].includes(new Date(dateIso).getDay());
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{ width: cellW, height: rowH }}
      className={cn(
        'border-r border-b border-border shrink-0 cursor-pointer transition-colors',
        isWeekend && 'bg-surface-2/50',
        isOver && 'bg-primary/20',
      )}
    />
  );
}

// ---------- Бронь (draggable) ----------
const BookingBlock = memo(function BookingBlock({
  booking, startIdx, length, cellW, onClick, zoom, selected, blockH, blockTop,
}: { booking: Booking; startIdx: number; length: number; cellW: number; onClick: (e: React.MouseEvent) => void; zoom: Zoom; selected?: boolean; blockH: number; blockTop: number; }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `book:${booking.id}`,
    data: { booking },
  });
  const style = STATUS_STYLE[booking.status];
  const tariff = booking.tariff ? TARIFF_META[booking.tariff] : null;
  const left = startIdx * cellW;
  const width = length * cellW - 4;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      style={{
        position: 'absolute',
        left: left + 2,
        width,
        top: blockTop,
        height: blockH,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.02 : 1})` : undefined,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 50 : 1,
        boxShadow: selected ? '0 0 0 2px #f5c451, 0 4px 12px rgba(0,0,0,0.25)' : undefined,
        willChange: isDragging ? 'transform' : undefined,
      }}
      className={cn(
        'rounded-btn pl-2.5 pr-2 flex items-center text-xs font-semibold shadow-soft cursor-grab active:cursor-grabbing overflow-hidden relative',
        style.bg,
      )}
      title={`${booking.guestName}\n${booking.checkIn} → ${booking.checkOut}\n${fmtMoney(booking.amount)}${tariff ? `\nТариф: ${tariff.label}` : ''}`}
    >
      {tariff && (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ background: tariff.color }}
        />
      )}
      <span className={cn('truncate', tariff && 'ml-1')}>
        {zoom === 'month' ? booking.guestName.split(' ')[0] : booking.guestName}
      </span>
    </div>
  );
});

// ---------- Главная страница ----------
export default function GridPage() {
  // Режим отображения и фокусная дата — оба определяют видимый диапазон.
  const [zoom, setZoom] = useState<Zoom>('week');
  // Множитель масштаба (лупа +/-). Сохраняется в localStorage.
  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const v = parseFloat(window.localStorage.getItem('grid:zoomScale') || '1');
    return Number.isFinite(v) && v >= 0.6 && v <= 2 ? v : 1;
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('grid:zoomScale', String(zoomScale));
    }
  }, [zoomScale]);
  const zoomIn = useCallback(() => setZoomScale((s) => Math.min(2, +(s + 0.1).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoomScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2))), []);
  const zoomReset = useCallback(() => setZoomScale(1), []);
  const [focusDate, setFocusDate] = useState<Date>(() => atMidnight(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Брони и гости хранятся в persistent store — drag&drop сохраняется при перезагрузке.
  const bookingList = useBookings((s) => s.bookings);
  const guestList = useBookings((s) => s.guests);
  const updateBooking = useBookings((s) => s.updateBooking);
  const addBooking = useBookings((s) => s.addBooking);
  const cancelBooking = useBookings((s) => s.cancelBooking);
  const addGuest = useBookings((s) => s.addGuest);

  const [selected, setSelected] = useState<Booking | null>(null);
  const [createCtx, setCreateCtx] = useState<{ roomId: string; date: string } | null>(null);
  // Множественное выделение броней (Shift+клик)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  // Undo стек последних перемещений drag&drop (Ctrl+Z)
  const undoStackRef = useRef<{ id: string; prev: Pick<Booking, 'roomId' | 'checkIn' | 'checkOut'> }[]>([]);
  const { push } = useToast();

  // Реакция на ?new=1 в URL — открыть форму "Новая бронь" с дефолтным номером и сегодняшней датой
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const firstRoom = rooms[0];
      if (firstRoom) setCreateCtx({ roomId: firstRoom.id, date: toIso(new Date()) });
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const cellW = Math.round(ZOOM_CELL[zoom] * zoomScale);
  const rowH = Math.round(48 * zoomScale);
  const leftColW = Math.round(200 * zoomScale);
  const bookingH = Math.round(40 * zoomScale);
  const bookingTop = Math.max(2, Math.round(4 * zoomScale));

  // Вычисляем видимый диапазон исходя из режима и фокусной даты.
  // Окно даём с запасом (см. ZOOM_DAYS) — пользователь скроллит горизонтально вперёд.
  const { startDate, daysCount, viewLabel } = useMemo(() => {
    const total = ZOOM_DAYS[zoom];
    if (zoom === 'day') {
      const s = atMidnight(focusDate);
      return { startDate: s, daysCount: total, viewLabel: fmtDateLong(s) };
    }
    if (zoom === 'week') {
      const s = atMidnight(focusDate);
      const dow = s.getDay() === 0 ? 6 : s.getDay() - 1; // 0 = Пн
      s.setDate(s.getDate() - dow);
      const weekEnd = new Date(s); weekEnd.setDate(weekEnd.getDate() + 6);
      return { startDate: s, daysCount: total, viewLabel: `${s.getDate()}–${weekEnd.getDate()} ${MONTHS_GENITIVE[weekEnd.getMonth()]} ${weekEnd.getFullYear()}` };
    }
    // Месяц
    const y = focusDate.getFullYear();
    const m = focusDate.getMonth();
    const s = new Date(y, m, 1);
    return { startDate: s, daysCount: total, viewLabel: `${MONTHS_NOM[m]} ${y}` };
  }, [zoom, focusDate]);

  // Список дат в видимом окне
  const dates = useMemo(() => {
    const arr: { iso: string; d: Date }[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate); d.setDate(d.getDate() + i);
      arr.push({ iso: toIso(d), d });
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

  // Drag end: смещение брони на дни/комнату (с persist) + undo стек
  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const bookId = String(e.active.id).replace('book:', '');
    const overId = String(e.over.id);
    if (!overId.startsWith('cell:')) return;
    const [, newRoomId, newDate] = overId.split(':');
    const b = bookingList.find((x) => x.id === bookId);
    if (!b) return;
    if (b.roomId === newRoomId && b.checkIn === newDate) return; // без изменений
    undoStackRef.current.push({
      id: bookId,
      prev: { roomId: b.roomId, checkIn: b.checkIn, checkOut: b.checkOut },
    });
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    const duration = daysBetween(b.checkIn, b.checkOut);
    const newOut = new Date(newDate); newOut.setDate(newOut.getDate() + duration);
    updateBooking(bookId, {
      roomId: newRoomId,
      checkIn: newDate,
      checkOut: toIso(newOut),
    });
    push({ tone: 'success', title: 'Бронь перемещена', description: `Новая дата: ${fmtDateShort(newDate)} · Ctrl+Z — отменить` });
  };

  // Ctrl+Z — откатить последнее перемещение
  const undoLastMove = useCallback(() => {
    const last = undoStackRef.current.pop();
    if (!last) {
      push({ tone: 'info', title: 'Нечего отменять' });
      return;
    }
    updateBooking(last.id, last.prev);
    push({ tone: 'success', title: 'Перемещение отменено' });
  }, [updateBooking, push]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tgt = ev.target as HTMLElement | null;
      // не перехватываем Z в полях ввода
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'z' || ev.key === 'Z' || ev.key === 'я' || ev.key === 'Я')) {
        ev.preventDefault();
        undoLastMove();
      } else if ((ev.ctrlKey || ev.metaKey) && (ev.key === '=' || ev.key === '+')) {
        ev.preventDefault();
        zoomIn();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key === '-') {
        ev.preventDefault();
        zoomOut();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key === '0') {
        ev.preventDefault();
        zoomReset();
      } else if (ev.key === 'Escape') {
        setSelectedIds(new Set());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undoLastMove, zoomIn, zoomOut, zoomReset]);

  // ПКМ drag-to-scroll по сетке. ЛКМ оставлена для броней (dnd-kit) и кликов.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let moved = false;
    let startX = 0; let startY = 0; let scrollLeft = 0; let scrollTop = 0;
    const onDown = (ev: MouseEvent) => {
      if (ev.button !== 2) return; // только правая кнопка
      ev.preventDefault();
      isDown = true;
      moved = false;
      startX = ev.pageX;
      startY = ev.pageY;
      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
      el.style.cursor = 'grabbing';
    };
    const onMove = (ev: MouseEvent) => {
      if (!isDown) return;
      const dx = ev.pageX - startX;
      const dy = ev.pageY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      el.scrollLeft = scrollLeft - dx;
      el.scrollTop = scrollTop - dy;
    };
    const onUp = () => { isDown = false; el.style.cursor = ''; };
    const onContextMenu = (ev: MouseEvent) => {
      // если пользователь именно тащил — подавляем контекстное меню
      if (moved) { ev.preventDefault(); moved = false; }
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('contextmenu', onContextMenu);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  // Ctrl + колесо мыши — изменение масштаба
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      ev.preventDefault();
      if (ev.deltaY < 0) zoomIn(); else if (ev.deltaY > 0) zoomOut();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomIn, zoomOut]);

  // Клик по брони с учётом Shift — мульти-выбор
  const handleBookingClick = (b: Booking, ev: React.MouseEvent) => {
    if (ev.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        // Если есть «якорный» элемент — выделяем диапазон между ними в visibleBookings
        if (lastSelectedId && next.size > 0) {
          const ids = visibleBookings.map((x) => x.id);
          const a = ids.indexOf(lastSelectedId);
          const c = ids.indexOf(b.id);
          if (a >= 0 && c >= 0) {
            const [lo, hi] = a < c ? [a, c] : [c, a];
            for (let i = lo; i <= hi; i++) next.add(ids[i]);
            return next;
          }
        }
        if (next.has(b.id)) next.delete(b.id); else next.add(b.id);
        return next;
      });
      setLastSelectedId(b.id);
      return;
    }
    if (ev.ctrlKey || ev.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(b.id)) next.delete(b.id); else next.add(b.id);
        return next;
      });
      setLastSelectedId(b.id);
      return;
    }
    if (selectedIds.size > 0) {
      // если есть выделение — обычный клик закрывает выделение и открывает деталь
      setSelectedIds(new Set());
    }
    setSelected(b);
  };

  // Действия над выделенными
  const bulkChangeStatus = (st: BookingStatus) => {
    selectedIds.forEach((id) => updateBooking(id, { status: st }));
    push({ tone: 'success', title: `Статус обновлён (${selectedIds.size})`, description: BOOKING_STATUS_LABEL[st] });
    setSelectedIds(new Set());
  };
  const bulkCancel = () => {
    selectedIds.forEach((id) => cancelBooking(id));
    push({ tone: 'warning', title: `Отменено: ${selectedIds.size}` });
    setSelectedIds(new Set());
  };
  const bulkExportCsv = () => {
    const rows = visibleBookings.filter((b) => selectedIds.has(b.id));
    const header = 'id;guest;room;checkIn;checkOut;status;channel;amount';
    const csv = [header, ...rows.map((b) => [b.id, b.guestName, b.roomId, b.checkIn, b.checkOut, b.status, b.channel, b.amount].join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bookings_${toIso(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
    push({ tone: 'success', title: `Экспортировано: ${rows.length}` });
  };
  const bulkSendEmail = () => {
    push({ tone: 'success', title: `Подтверждение отправлено: ${selectedIds.size}`, description: 'Шаблон «Подтверждение брони»' });
    setSelectedIds(new Set());
  };

  // Навигация: стрелки сдвигают на 1 день/неделю/месяц в зависимости от режима
  const shift = (dir: -1 | 1) => {
    const d = new Date(focusDate);
    if (zoom === 'day') d.setDate(d.getDate() + dir);
    else if (zoom === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setFocusDate(d);
  };
  const goToday = () => setFocusDate(atMidnight(new Date()));

  // Следующие три месяца от текущего месяца focusDate — быстрые переходы
  const nextMonths = useMemo(() => {
    const out: { label: string; year: number; month: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(focusDate.getFullYear(), focusDate.getMonth() + i, 1);
      out.push({ label: MONTHS_NOM[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
    }
    return out;
  }, [focusDate]);

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
                ...(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[])
                  .filter((s) => s !== 'cancelled')
                  .map((s) => ({ value: s, label: BOOKING_STATUS_LABEL[s] })),
              ]}
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="md"
              leftIcon={<InfoIcon className="h-4 w-4" />}
              onClick={() => setLegendOpen((v) => !v)}
              aria-expanded={legendOpen}
            >
              Обозначения
            </Button>
            {legendOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLegendOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] z-40 bg-surface border border-border rounded-card shadow-lift p-3 space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Статусы броней</div>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(STATUS_STYLE).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-2 text-xs">
                          <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', v.bg)} />
                          <span className="text-text">{v.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Тарифы</div>
                    <div className="grid grid-cols-1 gap-1">
                      {(Object.keys(TARIFF_META) as BookingTariff[]).map((k) => {
                        const m = TARIFF_META[k];
                        return (
                          <span key={k} className="flex items-center gap-2 text-xs">
                            <span className="h-3 w-1 rounded-sm shrink-0" style={{ background: m.color }} />
                            <span className="text-text">{m.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => {
            const r = rooms[0];
            if (r) setCreateCtx({ roomId: r.id, date: toIso(new Date()) });
          }}>Новая бронь</Button>
        </div>
      </div>

      {/* Календарь на всю ширину */}
      <Card className="w-full overflow-hidden" padding="none">
          {/* Тулбар */}
          <div className="flex flex-col gap-3 p-3 border-b border-border">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => shift(-1)} title="Назад"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={goToday}>Сегодня</Button>
                <Button variant="ghost" size="icon" onClick={() => shift(1)} title="Вперёд"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setPickerOpen(true)} title="Выбрать месяц">
                  <CalendarDays className="h-4 w-4" />
                </Button>
                <span className="ml-2 font-display text-lg text-text capitalize">{viewLabel}</span>
              </div>

              {/* Переключатели режимов */}
              <div className="flex items-center gap-1 bg-surface-2 rounded-btn p-1 flex-wrap">
                {(['day', 'week', 'month'] as Zoom[]).map((z) => (
                  <button
                    key={z}
                    onClick={() => { setZoom(z); setFocusDate(atMidnight(new Date())); }}
                    className={cn(
                      'px-3 h-7 rounded-md text-xs font-semibold transition-colors',
                      zoom === z ? 'bg-bg text-text shadow-soft' : 'text-text-muted hover:text-text',
                    )}
                  >
                    {z === 'day' ? 'День' : z === 'week' ? 'Неделя' : 'Месяц'}
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-border" />
                {/* Быстрые переходы на следующие 3 месяца */}
                {nextMonths.map((m) => (
                  <button
                    key={`${m.year}-${m.month}`}
                    onClick={() => { setZoom('month'); setFocusDate(new Date(m.year, m.month, 1)); }}
                    className="px-3 h-7 rounded-md text-xs font-semibold text-text-muted hover:text-text hover:bg-bg transition-colors"
                    title={`${m.label} ${m.year}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Лупа: масштаб ячеек и строк (сохраняется в localStorage) */}
              <div className="flex items-center gap-0.5 bg-surface-2 rounded-btn p-1" data-no-pan="true">
                <button
                  onClick={zoomOut}
                  disabled={zoomScale <= 0.6}
                  className="px-1.5 h-7 rounded-md text-text-muted hover:text-text hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Уменьшить (Ctrl+−)"
                  aria-label="Уменьшить масштаб"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={zoomReset}
                  className="px-2 h-7 rounded-md text-[11px] font-bold tabular-nums text-text-muted hover:text-text hover:bg-bg transition-colors min-w-[44px]"
                  title="Сбросить масштаб (Ctrl+0)"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoomScale >= 2}
                  className="px-1.5 h-7 rounded-md text-text-muted hover:text-text hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Увеличить (Ctrl++)"
                  aria-label="Увеличить масштаб"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Панель массовых действий */}
          {selectedIds.size > 0 && (
            <div data-no-pan="true" className="px-3 py-2 border-b border-border flex items-center gap-2 flex-wrap bg-primary/5">
              <span className="text-xs font-bold text-text">Выбрано: {selectedIds.size}</span>
              <span className="text-[11px] text-text-muted">Shift+клик — диапазон · Ctrl+клик — точечно · Esc — снять</span>
              <span className="mx-2 h-4 w-px bg-border" />
              <Button size="sm" variant="ghost" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => bulkChangeStatus('confirmed')}>Подтвердить</Button>
              <Button size="sm" variant="ghost" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => bulkChangeStatus('checkin')}>Заезд</Button>
              <Button size="sm" variant="ghost" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => bulkChangeStatus('checkout')}>Выезд</Button>
              <Button size="sm" variant="ghost" leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={bulkSendEmail}>Email</Button>
              <Button size="sm" variant="ghost" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={bulkExportCsv}>CSV</Button>
              <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} onClick={bulkCancel}>Отменить</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Снять выделение</Button>
            </div>
          )}

          {/* Подсказки + Undo */}
          <div data-no-pan="true" className="px-3 py-1.5 border-b border-border flex items-center justify-between text-[11px] text-text-muted">
            <span>Перетаскивайте сетку ЛКМ · бронь — Shift+клик для выбора нескольких · Ctrl+Z — отменить перемещение</span>
            <Button size="sm" variant="ghost" leftIcon={<Undo2 className="h-3.5 w-3.5" />} onClick={undoLastMove}>Отменить</Button>
          </div>

          {/* Сетка */}
          <div ref={scrollRef} className="overflow-auto max-h-[calc(100vh-230px)] select-none" style={{ cursor: 'grab' }}>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex">
                {/* Левая колонка — номера */}
                <div className="sticky left-0 z-20 bg-surface border-r border-border">
                  <div className="border-b border-border flex items-center px-4 font-bold text-xs uppercase text-text-muted" style={{ height: rowH, width: leftColW }}>
                    Номер
                  </div>
                  {visibleRooms.map((r) => {
                    const prop = properties.find((p) => p.id === r.propertyId);
                    return (
                      <div key={r.id} className="border-b border-border px-4 flex flex-col justify-center" style={{ width: leftColW, height: rowH }}>
                        <p className="text-sm font-bold text-text leading-none">№ {r.number} · {ROOM_CATEGORY_LABEL[r.category]}</p>
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
                      const isToday = iso === toIso(new Date());
                      const isWeekend = [0, 6].includes(d.getDay());
                      return (
                        <div
                          key={iso}
                          style={{ width: cellW, height: rowH }}
                          className={cn(
                            'border-r border-border flex flex-col items-center justify-center shrink-0',
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
                          rowH={rowH}
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
                              blockH={bookingH}
                              blockTop={bookingTop}
                              selected={selectedIds.has(b.id)}
                              onClick={(e) => handleBookingClick(b, e)}
                            />
                          );
                        }
                        const length = daysBetween(b.checkIn, b.checkOut);
                        return (
                          <BookingBlock
                            key={b.id} booking={b} zoom={zoom}
                            startIdx={startIdx} length={length} cellW={cellW}
                            blockH={bookingH}
                            blockTop={bookingTop}
                            selected={selectedIds.has(b.id)}
                            onClick={(e) => handleBookingClick(b, e)}
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
      <BookingModal
        booking={selected}
        guests={guestList}
        onClose={() => setSelected(null)}
        onChange={(updated) => {
          updateBooking(updated.id, updated);
          setSelected(null);
          push({ tone: 'success', title: 'Изменения сохранены' });
        }}
        onCancel={(id) => {
          cancelBooking(id);
          setSelected(null);
          push({ tone: 'warning', title: 'Бронь отменена' });
        }}
      />

      {/* Быстрое создание */}
      <CreateBookingModal
        ctx={createCtx}
        onClose={() => setCreateCtx(null)}
        onCreate={(payload) => {
          // Создаём гостя (опц.) + бронь
          let guestId = 'guest_1';
          let guestName = payload.name;
          if (payload.registerGuest && payload.guest) {
            const g: Guest = {
              id: `guest_new_${Date.now()}`,
              firstName: payload.guest.firstName,
              lastName: payload.guest.lastName,
              email: payload.guest.email,
              phone: payload.guest.phone,
              country: 'RU',
              avatar: '',
              staysCount: 0,
              totalSpent: 0,
              tags: ['Новый'],
              loyaltyTier: 'Bronze',
              loyaltyPoints: 0,
              blacklisted: false,
              notes: '',
              registeredAt: toIso(new Date()),
              passport: payload.guest.passport,
            };
            addGuest(g);
            guestId = g.id;
            guestName = `${g.lastName} ${g.firstName}`.trim();
          }
          const room = rooms.find((r) => r.id === payload.roomId)!;
          const out = new Date(payload.checkIn);
          out.setDate(out.getDate() + payload.nights);
          const newBooking: Booking = {
            id: `book_new_${Date.now()}`,
            roomId: room.id,
            propertyId: room.propertyId,
            guestId,
            guestName,
            channel: payload.channel,
            status: payload.status,
            checkIn: payload.checkIn,
            checkOut: toIso(out),
            guests: payload.guests,
            amount: (payload.pricePerNight || room.basePrice) * payload.nights,
            notes: payload.notes,
            checkInTime: payload.checkInTime,
            checkOutTime: payload.checkOutTime,
            pricePerNight: payload.pricePerNight || undefined,
            commission: payload.commission || undefined,
            deposit: payload.deposit || undefined,
            payments: payload.payments.length ? payload.payments : undefined,
            additionalPhone: payload.additionalPhone,
            attachments: payload.attachments,
            sendEmailConfirmation: payload.sendEmailConfirmation,
          };
          addBooking(newBooking);
          setCreateCtx(null);
          push({
            tone: 'success',
            title: 'Бронь создана',
            description: payload.sendEmailConfirmation && payload.guest?.email
              ? `${guestName} · Подтверждение отправлено на ${payload.guest.email}`
              : guestName,
          });
        }}
      />

      {/* Пикер месяца/года */}
      <MonthPicker
        open={pickerOpen}
        value={focusDate}
        onClose={() => setPickerOpen(false)}
        onPick={(d) => { setFocusDate(d); setZoom('month'); setPickerOpen(false); }}
      />
    </PageTransition>
  );
}

// ---------- Пикер месяца / года ----------
function MonthPicker({ open, value, onClose, onPick }: {
  open: boolean; value: Date; onClose: () => void; onPick: (d: Date) => void;
}) {
  const [year, setYear] = useState(value.getFullYear());
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  return (
    <Modal open={open} onClose={onClose} title="Выбор периода" subtitle="Год и месяц" size="sm">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setYear((y) => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-display text-2xl text-text">{year}</span>
        <Button variant="ghost" size="icon" onClick={() => setYear((y) => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_NOM.map((m, idx) => {
          const isCurrent = year === currentYear && idx === currentMonth;
          const isSelected = year === value.getFullYear() && idx === value.getMonth();
          return (
            <button
              key={m}
              onClick={() => onPick(new Date(year, idx, 1))}
              className={cn(
                'h-12 rounded-btn text-sm font-semibold transition-all border',
                isSelected
                  ? 'bg-primary text-white border-primary'
                  : isCurrent
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-text-muted hover:text-text hover:bg-surface-2',
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-border">
        {[year - 2, year - 1, year, year + 1].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={cn(
              'h-8 rounded-md text-xs font-semibold transition-colors',
              y === year ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text',
            )}
          >
            {y}
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ---------- Модалка деталей ----------
function BookingModal({ booking, guests, onClose, onChange, onCancel }: {
  booking: Booking | null; guests: Guest[]; onClose: () => void; onChange: (b: Booking) => void; onCancel: (id: string) => void;
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
          <Button variant="danger" onClick={() => onCancel(booking.id)}>Отменить бронь</Button>
          <Button onClick={() => onChange({ ...booking, status: 'confirmed' })}>Подтвердить</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Info label="Заезд" value={fmtDateShort(booking.checkIn)} />
        <Info label="Выезд" value={fmtDateShort(booking.checkOut)} />
        <Info label="Гостей" value={`${booking.guests}`} />
        <Info label="Источник" value={CHANNEL_LABEL[booking.channel]} />
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

// ---------- Быстрое создание (с паспортными данными + расширенными полями) ----------
type CreatePayload = {
  roomId: string;
  checkIn: string;
  nights: number;
  guests: number;
  name: string;
  registerGuest: boolean;
  // Расширенные поля
  status: BookingStatus;
  channel: Channel;
  checkInTime: string;
  checkOutTime: string;
  pricePerNight: number;
  commission: number;
  deposit: number;
  payments: BookingPayment[];
  additionalPhone?: string;
  attachments?: string[];
  notes?: string;
  sendEmailConfirmation: boolean;
  guest?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passport?: PassportData;
  };
};

function CreateBookingModal({ ctx, onClose, onCreate }: {
  ctx: { roomId: string; date: string } | null;
  onClose: () => void;
  onCreate: (p: CreatePayload) => void;
}) {
  const { push } = useToast();
  const [tab, setTab] = useState<'main' | 'special'>('main');
  const [name, setName] = useState('');
  const [nights, setNights] = useState(2);
  const [guestsCount, setGuestsCount] = useState(1);
  const [register, setRegister] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [series, setSeries] = useState('');
  const [number, setNumber] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [scan, setScan] = useState<string | undefined>(undefined);
  // Расширенные
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [channel, setChannel] = useState<Channel>('direct');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [pricePerNight, setPricePerNight] = useState<number>(0);
  const [pricePerNightTouched, setPricePerNightTouched] = useState(false);
  const [commission, setCommission] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [sendEmailConfirmation, setSendEmailConfirmation] = useState(true);
  const [showPayModal, setShowPayModal] = useState<null | 'add' | 'refund'>(null);

  const ctxRoomId = ctx?.roomId;
  // Цена за сутки авто из тарифа, пока пользователь не тронул
  useEffect(() => {
    if (!ctxRoomId) return;
    const r = rooms.find((x) => x.id === ctxRoomId);
    if (r && !pricePerNightTouched) setPricePerNight(r.basePrice);
  }, [ctxRoomId, pricePerNightTouched]);

  // OCR-мок: автозаполнение паспорта при загрузке скана
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScan(String(reader.result));
      // OCR-симуляция (МВД): через 1.2с заполняем поля если они пусты
      setTimeout(() => {
        const seed = (Math.floor(Math.random() * 9000) + 1000).toString();
        const num = (Math.floor(Math.random() * 900000) + 100000).toString();
        setSeries((v) => v || seed);
        setNumber((v) => v || num);
        setIssuedBy((v) => v || 'ОУФМС России по г. Владикавказу');
        setIssuedAt((v) => v || '2018-05-15');
        setBirthDate((v) => v || '1990-01-01');
        push({ tone: 'success', title: 'Паспорт распознан', description: 'Точность OCR ≈ 94% · проверьте поля' });
      }, 1200);
    };
    reader.readAsDataURL(f);
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      const r = new FileReader();
      r.onload = () => setAttachments((arr) => [...arr, String(r.result)]);
      r.readAsDataURL(f);
    });
  };

  if (!ctx) return null;
  const room = rooms.find((r) => r.id === ctx.roomId);
  const prop = properties.find((p) => p.id === room?.propertyId);

  const totalRooms = (pricePerNight || 0) * nights;
  const paid = payments.reduce((acc, p) => acc + (p.refund ? -p.amount : p.amount), 0);
  const balance = totalRooms - paid;

  const reset = () => {
    setTab('main');
    setName(''); setNights(2); setGuestsCount(1); setRegister(true);
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setAdditionalPhone('');
    setSeries(''); setNumber(''); setIssuedBy(''); setIssuedAt(''); setBirthDate(''); setScan(undefined);
    setStatus('confirmed'); setChannel('direct');
    setCheckInTime('14:00'); setCheckOutTime('12:00');
    setPricePerNight(0); setPricePerNightTouched(false);
    setCommission(0); setDeposit(0); setPayments([]); setAttachments([]); setNotes('');
    setSendEmailConfirmation(true);
  };

  const fullName = register ? `${lastName} ${firstName}`.trim() : name.trim();
  const canSubmit = !!room && fullName.length > 0 && (!register || (firstName && lastName && phone));

  const handleCreate = () => {
    if (!canSubmit || !room) return;
    const passport: PassportData | undefined = (series || number || issuedBy || issuedAt || birthDate || scan)
      ? { series, number, issuedBy, issuedAt, birthDate, scanDataUrl: scan }
      : undefined;
    onCreate({
      roomId: room.id,
      checkIn: ctx.date,
      nights,
      guests: guestsCount,
      name: fullName,
      registerGuest: register,
      status, channel, checkInTime, checkOutTime,
      pricePerNight, commission, deposit, payments,
      additionalPhone: additionalPhone || undefined,
      attachments: attachments.length ? attachments : undefined,
      notes: notes || undefined,
      sendEmailConfirmation,
      guest: register
        ? { firstName, lastName, email, phone, passport }
        : undefined,
    });
    reset();
  };

  return (
    <Modal
      open={!!ctx}
      onClose={() => { reset(); onClose(); }}
      title="Новая бронь"
      subtitle={`${prop?.name} · Номер ${room?.number} · ${fmtDateLong(new Date(ctx.date))}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Отмена</Button>
          <Button onClick={handleCreate} disabled={!canSubmit}>Создать бронь</Button>
        </>
      }
    >
      {/* Табы */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: 'main' as const, label: 'Создание брони' },
          { id: 'special' as const, label: 'Спец. условия' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <div className="space-y-5">
          {/* Статус + источник */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Статус брони"
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              options={(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => ({ value: s, label: BOOKING_STATUS_LABEL[s] }))}
            />
            <Select
              label="Источник бронирования"
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              options={(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))}
            />
          </div>

          {/* Регистрация */}
          <div className="flex items-center gap-3 p-3 rounded-btn bg-surface-2 border border-border">
            <input
              id="reg-guest"
              type="checkbox"
              checked={register}
              onChange={(e) => setRegister(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="reg-guest" className="text-sm text-text flex items-center gap-2 cursor-pointer">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Зарегистрировать гостя и внести паспортные данные
            </label>
          </div>

          {/* Сроки и гости */}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ночей" type="number" min={1} max={60} value={nights} onChange={(e) => setNights(+e.target.value || 1)} />
            <Input label="Гостей" type="number" min={1} max={10} value={guestsCount} onChange={(e) => setGuestsCount(+e.target.value || 1)} />
            <Input label="Время заезда" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            <Input label="Время выезда" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
          </div>

          {!register && (
            <Input label="Имя гостя" placeholder="Иван Иванов" value={name} onChange={(e) => setName(e.target.value)} />
          )}

          {register && (
            <>
              <div className="flex items-center gap-2 text-xs uppercase font-bold text-text-muted tracking-wide">
                <span className="h-px flex-1 bg-border" />
                <span>Контакты гостя</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Фамилия *" placeholder="Иванов" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <Input label="Имя *" placeholder="Иван" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Телефон *" placeholder="+7 999 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Email" type="email" placeholder="guest@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Доп. телефон" placeholder="+7 999 765 43 21" value={additionalPhone} onChange={(e) => setAdditionalPhone(e.target.value)} />
              </div>

              <div className="flex items-center gap-2 text-xs uppercase font-bold text-text-muted tracking-wide">
                <span className="h-px flex-1 bg-border" />
                <span>Паспортные данные</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Серия" placeholder="4500" value={series} onChange={(e) => setSeries(e.target.value)} />
                <Input label="Номер" placeholder="123456" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <Textarea label="Кем выдан" rows={2} placeholder="ОУФМС России по г. Москве" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Дата выдачи" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
                <Input label="Дата рождения" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>

              {/* Скан паспорта + OCR */}
              <div>
                <p className="text-[11px] uppercase font-bold text-text-muted mb-1.5">Скан / фото паспорта · автораспознавание МВД</p>
                <label className="flex items-center gap-3 p-3 rounded-btn border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-text-muted flex-1">
                    {scan ? 'Файл загружен — нажмите чтобы заменить' : 'Нажмите чтобы выбрать PNG / JPG / PDF (поля заполнятся автоматически)'}
                  </span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
                </label>
                {scan && scan.startsWith('data:image') && (
                  <img src={scan} alt="Скан паспорта" className="mt-2 rounded-btn border border-border max-h-32 object-contain" />
                )}
              </div>
            </>
          )}

          {/* Итоговая сумма */}
          <div className="flex items-center justify-between p-3 rounded-btn bg-primary/5 border border-primary/20">
            <span className="text-sm text-text">Стоимость номеров</span>
            <span className="font-display text-2xl text-primary">{fmtMoney(totalRooms)}</span>
          </div>
        </div>
      )}

      {tab === 'special' && (
        <div className="space-y-4">
          {/* Цены */}
          <Card padding="md">
            <p className="text-xs uppercase font-bold text-text-muted mb-3">Цены</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Цена за сутки, ₽"
                type="number"
                min={0}
                value={pricePerNight}
                onChange={(e) => { setPricePerNight(+e.target.value || 0); setPricePerNightTouched(true); }}
              />
              <Input label="Сумма за период, ₽" value={fmtMoney(totalRooms)} readOnly />
              <Input
                label="Комиссия площадки, ₽"
                type="number"
                min={0}
                value={commission}
                onChange={(e) => setCommission(+e.target.value || 0)}
              />
              <Input
                label="Залог, ₽"
                type="number"
                min={0}
                value={deposit}
                onChange={(e) => setDeposit(+e.target.value || 0)}
              />
            </div>
          </Card>

          {/* Оплаты */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase font-bold text-text-muted">Оплачено</p>
                <p className="text-lg font-display text-text">{fmtMoney(paid)} <span className="text-sm text-text-muted">из {fmtMoney(totalRooms)}</span></p>
                {balance !== 0 && (
                  <p className={cn('text-xs font-bold', balance > 0 ? 'text-warning' : 'text-success')}>
                    {balance > 0 ? `Остаток: ${fmtMoney(balance)}` : `Переплата: ${fmtMoney(-balance)}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowPayModal('add')}>Платёж</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPayModal('refund')} disabled={paid <= 0}>Возврат</Button>
              </div>
            </div>
            {payments.length > 0 && (
              <div className="space-y-1">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border border-border rounded-btn px-3 py-1.5">
                    <span className="text-text-muted">{new Date(p.at).toLocaleString('ru')} · {METHOD_LABEL[p.method]}</span>
                    <span className={cn('font-bold', p.refund ? 'text-error' : 'text-success')}>
                      {p.refund ? '−' : '+'}{fmtMoney(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Онлайн-договор */}
          <Card padding="md">
            <p className="text-xs uppercase font-bold text-text-muted mb-2">Онлайн-договор</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-text-muted">Отправьте гостю ссылку — он подпишет договор СМС-кодом без визита.</p>
              <Button variant="secondary" size="sm" onClick={() => push({ tone: 'info', title: 'Подключите интеграцию', description: 'Контур.Сайн / FrontDesk24 / DocBoom — Настройки → Интеграции' })}>
                Подключить
              </Button>
            </div>
          </Card>

          {/* Файлы */}
          <Card padding="md">
            <p className="text-xs uppercase font-bold text-text-muted mb-2">Файлы и документы</p>
            <label className="flex items-center gap-3 p-3 rounded-btn border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <Upload className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-text-muted flex-1">
                {attachments.length ? `Загружено файлов: ${attachments.length}` : 'Прикрепить квитанции, договоры, фото (можно несколько)'}
              </span>
              <input type="file" multiple className="hidden" onChange={handleAttachment} />
            </label>
            {attachments.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {attachments.map((a, i) => (
                  <div key={i} className="text-[11px] px-2 py-1 rounded-btn bg-surface-2 border border-border flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Файл {i + 1}
                    <button type="button" onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))} className="ml-1 text-text-muted hover:text-error">×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Примечание */}
          <Textarea label="Примечание к брони" rows={3} placeholder="Особые пожелания, аллергии, доп. услуги..." value={notes} onChange={(e) => setNotes(e.target.value)} />

          {/* Email подтверждение */}
          <label className="flex items-center gap-3 p-3 rounded-btn bg-surface-2 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailConfirmation}
              onChange={(e) => setSendEmailConfirmation(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-text">Отправить подтверждение бронирования на email гостя</span>
          </label>
        </div>
      )}

      {/* Подмодалка платежа */}
      <PaymentSubModal
        mode={showPayModal}
        maxRefund={paid}
        onClose={() => setShowPayModal(null)}
        onSave={(amount, method, note) => {
          setPayments((arr) => [...arr, {
            id: `p_${Date.now()}`,
            amount,
            method,
            at: new Date().toISOString(),
            refund: showPayModal === 'refund',
            note,
          }]);
          setShowPayModal(null);
        }}
      />
    </Modal>
  );
}

const METHOD_LABEL: Record<BookingPayment['method'], string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
  online: 'Онлайн-оплата',
};

function PaymentSubModal({ mode, maxRefund, onClose, onSave }: {
  mode: null | 'add' | 'refund';
  maxRefund: number;
  onClose: () => void;
  onSave: (amount: number, method: BookingPayment['method'], note?: string) => void;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<BookingPayment['method']>('cash');
  const [note, setNote] = useState('');
  const isRefund = mode === 'refund';

  useEffect(() => { if (mode) { setAmount(0); setMethod('cash'); setNote(''); } }, [mode]);

  const canSave = amount > 0 && (!isRefund || amount <= maxRefund);

  return (
    <Modal
      open={!!mode}
      onClose={onClose}
      title={isRefund ? 'Возврат платежа' : 'Внести платёж'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSave(amount, method, note || undefined)} disabled={!canSave}>
            {isRefund ? 'Вернуть' : 'Внести'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Сумма, ₽" type="number" min={0} value={amount} onChange={(e) => setAmount(+e.target.value || 0)} autoFocus />
        <Select
          label="Способ"
          value={method}
          onChange={(e) => setMethod(e.target.value as BookingPayment['method'])}
          options={(Object.keys(METHOD_LABEL) as BookingPayment['method'][]).map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
        />
        <Input label="Комментарий" value={note} onChange={(e) => setNote(e.target.value)} placeholder="(необязательно)" />
        {isRefund && (
          <p className="text-xs text-text-muted">Доступно к возврату: <span className="font-bold text-text">{fmtMoney(maxRefund)}</span></p>
        )}
      </div>
    </Modal>
  );
}
