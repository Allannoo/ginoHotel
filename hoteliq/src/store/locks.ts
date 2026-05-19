// Стор: электронные замки и виртуальные ключи
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SmartLock, VirtualKey, LockEvent, VirtualKeyStatus, LockStatus, LockProvider } from '@/types';
import { rooms as seedRooms } from '@/mock/data';

// Сид: ставим замки на первые 12 отельных номеров
function makeSeedLocks(): SmartLock[] {
  const hotelRooms = seedRooms.filter((r) => r.propertyId.startsWith('prop_h')).slice(0, 12);
  const providers: LockProvider[] = ['TTLock', 'Igloohome', 'Salto', 'YGG', 'Hikvision'];
  const statuses: LockStatus[] = ['online', 'online', 'online', 'online', 'offline', 'low-battery'];
  return hotelRooms.map((r, i) => ({
    id: `lock-${i + 1}`,
    roomId: r.id,
    propertyId: r.propertyId,
    provider: providers[i % providers.length],
    serialNumber: `SN-${(2024_0000 + i * 13).toString()}`,
    status: statuses[i % statuses.length],
    batteryLevel: 100 - ((i * 7) % 60) - (statuses[i % statuses.length] === 'low-battery' ? 80 : 0),
    firmwareVersion: `1.${4 + (i % 3)}.${i % 9}`,
    lastSeen: new Date(Date.now() - i * 17 * 60 * 1000).toISOString(),
    installedAt: '2024-06-01',
  }));
}

const seedLocks = makeSeedLocks();

// Сид: ключи для активных броней (первые 5)
const seedKeys: VirtualKey[] = seedLocks.slice(0, 5).map((lock, i) => {
  const codes = ['487291', '301552', '774013', '226908', '550334'];
  return {
    id: `key-${i + 1}`,
    lockId: lock.id,
    bookingId: `bk-${i + 1}`,
    guestName: ['Алан Дзагоев', 'Мария Иванова', 'Игорь Петров', 'Анна Хетагурова', 'Олег Кудзаев'][i],
    pinCode: codes[i],
    validFrom: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    validTo: new Date(Date.now() + (3 - i) * 24 * 60 * 60 * 1000).toISOString(),
    status: (i === 0 ? 'active' : i === 1 ? 'scheduled' : i === 2 ? 'used' : i === 3 ? 'active' : 'scheduled') as VirtualKeyStatus,
    sentVia: i % 2 === 0 ? ['sms', 'telegram'] : ['email', 'whatsapp'],
    sentAt: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - (i + 1) * 60 * 60 * 1000).toISOString(),
  };
});

// Сид-события
const seedEvents: LockEvent[] = seedLocks.slice(0, 8).map((lock, i) => ({
  id: `ev-${i + 1}`,
  lockId: lock.id,
  time: new Date(Date.now() - i * 11 * 60 * 1000).toISOString(),
  type: (['unlock', 'lock', 'unlock', 'denied', 'unlock', 'low-battery', 'unlock', 'manual-open'] as const)[i],
  source: (['pin', 'pin', 'app', 'pin', 'card', 'system', 'pin', 'physical-key'] as const)[i],
  actor: ['Алан Дзагоев', 'Мария Иванова', 'Сотрудник: Зарема', 'Неизвестно', 'Игорь Петров', '—', 'Анна Хетагурова', 'Старший администратор'][i],
}));

interface LocksState {
  locks: SmartLock[];
  keys: VirtualKey[];
  events: LockEvent[];
  hydrated: boolean;
  issueKey: (k: VirtualKey) => void;
  revokeKey: (id: string) => void;
  markUsed: (id: string) => void;
}

export const useLocks = create<LocksState>()(
  persist(
    (set) => ({
      locks: seedLocks,
      keys: seedKeys,
      events: seedEvents,
      hydrated: false,
      issueKey: (k) => set((s) => ({ keys: [k, ...s.keys] })),
      revokeKey: (id) =>
        set((s) => ({ keys: s.keys.map((x) => (x.id === id ? { ...x, status: 'revoked' as const } : x)) })),
      markUsed: (id) =>
        set((s) => ({ keys: s.keys.map((x) => (x.id === id ? { ...x, status: 'used' as const, usedAt: new Date().toISOString() } : x)) })),
    }),
    {
      name: 'ginohotel-locks',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);
