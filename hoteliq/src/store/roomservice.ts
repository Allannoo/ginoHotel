// Стор: доставка в номер (room service) — заказы и настройки
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoomOrder, RoomOrderStatus } from '@/types';

// Сид-заказы (4 шт) для демонстрации канбана
const seedOrders: RoomOrder[] = [
  {
    id: 'ord-1',
    bookingId: 'bk-1',
    guestName: 'Алан Дзагоев',
    roomNumber: '203',
    propertyId: 'prop_h1',
    restaurantId: 'rest-vova',
    restaurantName: 'У Вовы',
    items: [
      { menuItemId: 'm-1', name: 'Уалибах (с сыром)', price: 480, qty: 2 },
      { menuItemId: 'm-5', name: 'Шашлык из баранины', price: 690, qty: 1 },
      { menuItemId: 'm-10', name: 'Айран домашний', price: 180, qty: 2 },
    ],
    subtotal: 480 * 2 + 690 + 180 * 2,
    deliveryFee: 200,
    hotelCommission: Math.round((480 * 2 + 690 + 180 * 2) * 0.1),
    total: 480 * 2 + 690 + 180 * 2 + 200,
    status: 'cooking',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    paymentMethod: 'to-bill',
    note: 'Без лука, пожалуйста.',
  },
  {
    id: 'ord-2',
    bookingId: 'bk-2',
    guestName: 'Мария Иванова',
    roomNumber: '305',
    propertyId: 'prop_h1',
    restaurantId: 'rest-poryvai',
    restaurantName: 'Порываев',
    items: [
      { menuItemId: 'm-43', name: 'Филадельфия (8 шт.)', price: 690, qty: 1 },
      { menuItemId: 'm-46', name: 'Тирамису', price: 320, qty: 1 },
    ],
    subtotal: 690 + 320,
    deliveryFee: 150,
    hotelCommission: Math.round((690 + 320) * 0.1),
    total: 690 + 320 + 150,
    status: 'delivering',
    createdAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    paymentMethod: 'card',
  },
  {
    id: 'ord-3',
    bookingId: 'bk-3',
    guestName: 'Игорь Петров',
    roomNumber: '101',
    propertyId: 'prop_h2',
    restaurantId: 'rest-pizzaiolo',
    restaurantName: 'Пиццайоло',
    items: [
      { menuItemId: 'm-82', name: 'Пицца Пепперони 30 см', price: 640, qty: 1 },
      { menuItemId: 'm-85', name: 'Кола 0.5л', price: 180, qty: 2 },
    ],
    subtotal: 640 + 180 * 2,
    deliveryFee: 100,
    hotelCommission: Math.round((640 + 180 * 2) * 0.1),
    total: 640 + 180 * 2 + 100,
    status: 'delivered',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    paymentMethod: 'to-bill',
  },
  {
    id: 'ord-4',
    bookingId: 'bk-4',
    guestName: 'Анна Хетагурова',
    roomNumber: '207',
    propertyId: 'prop_h1',
    restaurantId: 'rest-iron',
    restaurantName: 'Ирон Хадзар',
    items: [
      { menuItemId: 'm-21', name: 'Три ритуальных пирога', price: 1450, qty: 1 },
      { menuItemId: 'm-25', name: 'Лывжа (тушёная баранина)', price: 720, qty: 1 },
    ],
    subtotal: 1450 + 720,
    deliveryFee: 250,
    hotelCommission: Math.round((1450 + 720) * 0.1),
    total: 1450 + 720 + 250,
    status: 'new',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    paymentMethod: 'to-bill',
  },
];

interface RoomServiceState {
  orders: RoomOrder[];
  /** Каталог ресторанов, разрешённых в конкретном объекте. propertyId → restaurantId[] */
  enabledByProperty: Record<string, string[]>;
  hydrated: boolean;
  addOrder: (o: RoomOrder) => void;
  setStatus: (id: string, status: RoomOrderStatus) => void;
  toggleRestaurant: (propertyId: string, restaurantId: string) => void;
  setEnabled: (propertyId: string, restaurantIds: string[]) => void;
}

export const useRoomService = create<RoomServiceState>()(
  persist(
    (set) => ({
      orders: seedOrders,
      enabledByProperty: {
        prop_h1: ['rest-vova', 'rest-iron', 'rest-poryvai', 'rest-pizzaiolo', 'rest-sweet'],
        prop_h2: ['rest-vova', 'rest-pizzaiolo', 'rest-sweet'],
        prop_h3: ['rest-darin', 'rest-poryvai', 'rest-sweet'],
      },
      hydrated: false,
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      setStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? { ...o, status, deliveredAt: status === 'delivered' ? new Date().toISOString() : o.deliveredAt }
              : o
          ),
        })),
      toggleRestaurant: (propertyId, restaurantId) =>
        set((s) => {
          const cur = s.enabledByProperty[propertyId] ?? [];
          const next = cur.includes(restaurantId)
            ? cur.filter((x) => x !== restaurantId)
            : [...cur, restaurantId];
          return { enabledByProperty: { ...s.enabledByProperty, [propertyId]: next } };
        }),
      setEnabled: (propertyId, restaurantIds) =>
        set((s) => ({ enabledByProperty: { ...s.enabledByProperty, [propertyId]: restaurantIds } })),
    }),
    {
      name: 'horizon-roomservice',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);

export const ORDER_STATUS_LABEL: Record<RoomOrderStatus, string> = {
  new: 'Новый',
  accepted: 'Принят',
  cooking: 'Готовится',
  delivering: 'В пути',
  delivered: 'Доставлен',
  completed: 'Оплачен',
  cancelled: 'Отменён',
};
