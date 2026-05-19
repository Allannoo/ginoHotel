// Детектор конфликтов броней (overbooking) для Channel Manager 2.0
import type { Booking, BookingConflict, Room } from '@/types';

/** Пересекаются ли два периода (исключая встык: 12.10 выезд / 12.10 заезд OK). */
export function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && bIn < aOut;
}

/**
 * Найти overbooking-конфликты: две и более активные брони
 * на один номер с пересекающимися датами.
 */
export function detectOverbookings(bookings: Booking[]): BookingConflict[] {
  const active = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'blocked' && b.status !== 'checkout'
  );
  const byRoom = new Map<string, Booking[]>();
  for (const b of active) {
    const list = byRoom.get(b.roomId) ?? [];
    list.push(b);
    byRoom.set(b.roomId, list);
  }

  const conflicts: BookingConflict[] = [];
  for (const [roomId, list] of byRoom) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (rangesOverlap(a.checkIn, a.checkOut, b.checkIn, b.checkOut)) {
          const severity: BookingConflict['severity'] =
            a.channel !== b.channel ? 'high' : 'medium';
          conflicts.push({
            id: `conf-${a.id}-${b.id}`,
            type: 'overbooking',
            roomId,
            propertyId: a.propertyId,
            bookingIds: [a.id, b.id],
            detectedAt: new Date().toISOString(),
            severity,
            description: `Двойная бронь номера через каналы ${a.channel} и ${b.channel}`,
            resolved: false,
          });
        }
      }
    }
  }
  return conflicts;
}

/**
 * Найти альтернативные свободные номера той же категории в том же объекте
 * на даты конфликтной брони.
 */
export function findAlternativeRooms(
  rooms: Room[],
  bookings: Booking[],
  conflict: BookingConflict,
  targetBookingId: string
): Room[] {
  const target = bookings.find((b) => b.id === targetBookingId);
  if (!target) return [];
  const conflictRoom = rooms.find((r) => r.id === conflict.roomId);
  if (!conflictRoom) return [];

  return rooms.filter((r) => {
    if (r.id === conflict.roomId) return false;
    if (r.propertyId !== conflict.propertyId) return false;
    if (r.category !== conflictRoom.category) return false;
    if (r.status === 'maintenance') return false;
    // нет других активных броней с пересечением
    const busy = bookings.some(
      (b) =>
        b.roomId === r.id &&
        b.status !== 'cancelled' &&
        b.status !== 'checkout' &&
        rangesOverlap(target.checkIn, target.checkOut, b.checkIn, b.checkOut)
    );
    return !busy;
  });
}

/** Найти доступные апгрейды (более дорогая категория). */
export function findUpgradeRooms(
  rooms: Room[],
  bookings: Booking[],
  conflict: BookingConflict,
  targetBookingId: string
): Room[] {
  const target = bookings.find((b) => b.id === targetBookingId);
  if (!target) return [];
  const conflictRoom = rooms.find((r) => r.id === conflict.roomId);
  if (!conflictRoom) return [];

  const order: Record<Room['category'], number> = {
    Standard: 1, Studio: 2, Family: 3, Deluxe: 4, Suite: 5,
  };
  const targetRank = order[conflictRoom.category];

  return rooms.filter((r) => {
    if (r.propertyId !== conflict.propertyId) return false;
    if (order[r.category] <= targetRank) return false;
    if (r.status === 'maintenance') return false;
    const busy = bookings.some(
      (b) =>
        b.roomId === r.id &&
        b.status !== 'cancelled' &&
        b.status !== 'checkout' &&
        rangesOverlap(target.checkIn, target.checkOut, b.checkIn, b.checkOut)
    );
    return !busy;
  });
}
