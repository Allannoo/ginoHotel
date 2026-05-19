import { describe, it, expect } from 'vitest';
import { rangesOverlap, detectOverbookings } from './overbooking';
import type { Booking } from '@/types';

const mkBooking = (id: string, roomId: string, checkIn: string, checkOut: string, extra: Partial<Booking> = {}): Booking => ({
  id, roomId, propertyId: 'p1', guestId: 'g1', guestName: 'X',
  channel: 'direct', checkIn, checkOut, guests: 1,
  amount: 1000, status: 'confirmed',
  ...extra,
});

describe('rangesOverlap', () => {
  it('пересекающиеся интервалы', () => {
    expect(rangesOverlap('2025-10-01', '2025-10-05', '2025-10-03', '2025-10-07')).toBe(true);
  });
  it('встык не считается пересечением', () => {
    expect(rangesOverlap('2025-10-01', '2025-10-05', '2025-10-05', '2025-10-10')).toBe(false);
  });
  it('не пересекаются', () => {
    expect(rangesOverlap('2025-10-01', '2025-10-03', '2025-10-04', '2025-10-06')).toBe(false);
  });
  it('один внутри другого', () => {
    expect(rangesOverlap('2025-10-01', '2025-10-10', '2025-10-03', '2025-10-05')).toBe(true);
  });
});

describe('detectOverbookings', () => {
  it('находит конфликт двух броней на один номер', () => {
    const result = detectOverbookings([
      mkBooking('a', 'r1', '2025-10-01', '2025-10-05', { channel: 'ostrovok' }),
      mkBooking('b', 'r1', '2025-10-03', '2025-10-07', { channel: 'yandex' }),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe('high'); // разные каналы
    expect(result[0].bookingIds).toEqual(['a', 'b']);
  });

  it('игнорирует отменённые брони', () => {
    const result = detectOverbookings([
      mkBooking('a', 'r1', '2025-10-01', '2025-10-05'),
      mkBooking('b', 'r1', '2025-10-03', '2025-10-07', { status: 'cancelled' }),
    ]);
    expect(result.length).toBe(0);
  });

  it('брони встык — не конфликт', () => {
    const result = detectOverbookings([
      mkBooking('a', 'r1', '2025-10-01', '2025-10-05'),
      mkBooking('b', 'r1', '2025-10-05', '2025-10-10'),
    ]);
    expect(result.length).toBe(0);
  });

  it('разные номера — без конфликтов', () => {
    const result = detectOverbookings([
      mkBooking('a', 'r1', '2025-10-01', '2025-10-05'),
      mkBooking('b', 'r2', '2025-10-01', '2025-10-05'),
    ]);
    expect(result.length).toBe(0);
  });
});
