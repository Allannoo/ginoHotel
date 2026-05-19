// Стор брони и гостей с persist в localStorage.
// Это позволяет сохранять drag&drop изменения и новые брони между перезагрузками.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Booking, Guest, PassportData } from '@/types';
import {
  bookings as seedBookings,
  guests as seedGuests,
} from '@/mock/data';

interface BookingsState {
  bookings: Booking[];
  guests: Guest[];
  hydrated: boolean;

  addBooking: (b: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  cancelBooking: (id: string) => void;

  addGuest: (g: Guest) => void;
  updateGuest: (id: string, patch: Partial<Guest>) => void;
  setGuestPassport: (id: string, passport: PassportData) => void;

  // Полный сброс к моковым данным (для отладки)
  resetToMock: () => void;
}

export const useBookings = create<BookingsState>()(
  persist(
    (set) => ({
      bookings: seedBookings,
      guests: seedGuests,
      hydrated: false,

      addBooking: (b) => set((s) => ({ bookings: [b, ...s.bookings] })),
      updateBooking: (id, patch) => set((s) => ({
        bookings: s.bookings.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
      removeBooking: (id) => set((s) => ({
        bookings: s.bookings.filter((x) => x.id !== id),
      })),
      cancelBooking: (id) => set((s) => ({
        bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const } : x)),
      })),

      addGuest: (g) => set((s) => ({ guests: [g, ...s.guests] })),
      updateGuest: (id, patch) => set((s) => ({
        guests: s.guests.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
      setGuestPassport: (id, passport) => set((s) => ({
        guests: s.guests.map((x) => (x.id === id ? { ...x, passport } : x)),
      })),

      resetToMock: () => set({ bookings: seedBookings, guests: seedGuests }),
    }),
    {
      name: 'ginohotel-bookings',
      // Версия 2: моковые брони перегенерированы без наложений по номеру.
      // Старый localStorage-кэш игнорируется и заменяется свежим seed-набором.
      version: 2,
      migrate: () => ({ bookings: seedBookings, guests: seedGuests }) as Partial<BookingsState>,
      // Не сохраняем `hydrated`, помечаем после восстановления
      partialize: (s) => ({ bookings: s.bookings, guests: s.guests }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
