// ============================================================
// Генератор моковых данных (детерминированный, на базе seed)
// ============================================================
import type {
  Property, Room, Booking, Guest, ChannelConnection,
  Task, Staff, SyncLogEntry, User, RoomCategory, RoomStatus,
  BookingStatus, Channel, GuestTag, LoyaltyTier,
} from '@/types';

// Простой seedable PRNG (Mulberry32)
function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const range = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const id = (() => { let n = 0; return (p: string) => `${p}_${++n}`; })();

const addDays = (date: Date, days: number) => {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
};
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// ============================================================
// Объекты (3 отеля + 8 квартир)
// ============================================================
export const properties: Property[] = [
  {
    id: 'prop_h1', name: 'Гранд-Отель «Метрополь»', type: 'hotel',
    city: 'Москва', address: 'Театральный пр., 2',
    description: 'Исторический пятизвёздочный отель в самом центре столицы.',
    rating: 4.8, cover: '🏨', rooms: 24, occupancy: 87, revenueMonth: 8_420_000,
    amenities: ['Wi-Fi', 'Завтрак', 'Спа', 'Паркинг', 'Бизнес-центр'],
  },
  {
    id: 'prop_h2', name: 'Бутик-Отель «Северная Венеция»', type: 'hotel',
    city: 'Санкт-Петербург', address: 'наб. реки Фонтанки, 25',
    description: 'Камерный бутик-отель с видом на канал.',
    rating: 4.7, cover: '🏛️', rooms: 14, occupancy: 78, revenueMonth: 3_120_000,
    amenities: ['Wi-Fi', 'Завтрак', 'Кафе', 'Прачечная'],
  },
  {
    id: 'prop_h3', name: 'Resort «Морская Жемчужина»', type: 'hotel',
    city: 'Сочи', address: 'ул. Приморская, 14',
    description: 'Курортный отель на берегу Чёрного моря.',
    rating: 4.6, cover: '🌴', rooms: 18, occupancy: 92, revenueMonth: 6_800_000,
    amenities: ['Wi-Fi', 'Бассейн', 'Пляж', 'Спа', 'Ресторан'],
  },
  ...Array.from({ length: 8 }).map((_, i) => {
    const cities = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Сочи', 'Краснодар', 'Нижний Новгород', 'Калининград'];
    const streets = ['ул. Тверская', 'Невский пр.', 'ул. Баумана', 'пр. Ленина', 'ул. Орджоникидзе', 'ул. Красная', 'ул. Большая Покровская', 'Ленинский пр.'];
    return {
      id: `prop_a${i + 1}`,
      name: `Студия «${['Уют', 'Лофт', 'Скай', 'Парк', 'Центр', 'Лайт', 'Авеню', 'Резиденция'][i]}»`,
      type: 'apartment' as const,
      city: cities[i],
      address: `${streets[i]}, ${range(1, 120)}`,
      description: 'Современные апартаменты для краткосрочной аренды.',
      rating: 4 + rng(),
      cover: ['🏢', '🏠', '🏘️', '🏚️', '🏬', '🌆', '🏙️', '🌇'][i],
      rooms: range(1, 3),
      occupancy: range(55, 95),
      revenueMonth: range(180_000, 420_000),
      amenities: ['Wi-Fi', 'Кухня', 'Стиральная машина', 'Самозаселение'],
    };
  }),
];

// ============================================================
// Номера: для отелей много, для квартир по одному
// ============================================================
const ROOM_CATEGORIES: RoomCategory[] = ['Standard', 'Deluxe', 'Suite', 'Family', 'Studio'];
const ROOM_STATUSES: RoomStatus[] = ['clean', 'dirty', 'occupied', 'inspection', 'maintenance'];

export const rooms: Room[] = properties.flatMap((p) => {
  if (p.type === 'apartment') {
    return [{
      id: id('room'), propertyId: p.id, number: '1', category: 'Studio',
      capacity: range(2, 4), basePrice: range(3500, 8500),
      status: pick(ROOM_STATUSES), floor: 1,
    }];
  }
  return Array.from({ length: p.rooms }).map((_, i) => ({
    id: id('room'),
    propertyId: p.id,
    number: `${Math.floor(i / 6) + 1}${(i % 6 + 1).toString().padStart(2, '0')}`,
    category: ROOM_CATEGORIES[range(0, 3)] as RoomCategory,
    capacity: range(1, 4),
    basePrice: range(5000, 18000),
    status: pick(ROOM_STATUSES),
    floor: Math.floor(i / 6) + 1,
  }));
});

// ============================================================
// Гости (~85)
// ============================================================
const FIRST = ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Сергей', 'Елена', 'Иван', 'Ольга', 'Андрей', 'Татьяна', 'Михаил', 'Наталья', 'Юрий', 'Ирина', 'Владимир'];
const LAST = ['Иванов', 'Петрова', 'Смирнов', 'Кузнецова', 'Попов', 'Соколова', 'Лебедев', 'Козлова', 'Новиков', 'Морозова', 'Волков', 'Соловьёва', 'Васильев', 'Зайцева', 'Павлов'];
const COUNTRIES = ['Россия', 'Россия', 'Россия', 'Россия', 'Беларусь', 'Казахстан', 'Германия', 'Турция', 'Китай', 'Армения'];
const AVATARS = ['👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🧔', '👱‍♀️', '👨‍🦱', '👩‍🦰', '🧓'];
const TAGS_POOL: GuestTag[] = ['VIP', 'Постоянный', 'Новый', 'Корпоративный'];
const TIERS: LoyaltyTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export const guests: Guest[] = Array.from({ length: 85 }).map((_, i) => {
  const fn = pick(FIRST);
  const ln = pick(LAST);
  const stays = range(1, 28);
  const isVip = rng() > 0.85;
  const blacklisted = rng() > 0.96;
  const tags: GuestTag[] = [];
  if (isVip) tags.push('VIP');
  if (stays > 10) tags.push('Постоянный');
  if (stays <= 2) tags.push('Новый');
  if (rng() > 0.88) tags.push('Корпоративный');
  if (blacklisted) tags.push('ЧС');
  return {
    id: `guest_${i + 1}`,
    firstName: fn,
    lastName: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`.replace(/[^\w.@]/g, ''),
    phone: `+7 (9${range(10, 99)}) ${range(100, 999)}-${range(10, 99)}-${range(10, 99)}`,
    country: pick(COUNTRIES),
    avatar: pick(AVATARS),
    staysCount: stays,
    totalSpent: stays * range(8000, 35000),
    tags,
    loyaltyTier: stays > 20 ? 'Platinum' : stays > 12 ? 'Gold' : stays > 5 ? 'Silver' : 'Bronze',
    loyaltyPoints: stays * range(50, 200),
    blacklisted,
    notes: rng() > 0.7 ? 'Предпочитает номера с видом на парк, без курения.' : '',
    registeredAt: isoDate(addDays(new Date(), -range(30, 900))),
  };
});

// ============================================================
// Бронирования (~160) на ±30 дней
// ============================================================
const BOOKING_STATUSES: BookingStatus[] = ['confirmed', 'confirmed', 'confirmed', 'pending', 'checkin', 'checkout', 'blocked'];
const CHANNELS: Channel[] = ['ostrovok', 'yandex', 'sutochno', 'otello', '101hotels', 'avito', 'direct'];

export const bookings: Booking[] = Array.from({ length: 160 }).map((_, i) => {
  const room = pick(rooms);
  const guest = pick(guests);
  const startOffset = range(-15, 45);
  const length = range(1, 7);
  const start = addDays(new Date(), startOffset);
  const end = addDays(start, length);
  const status: BookingStatus = startOffset < -1 ? 'checkout'
    : startOffset === 0 ? 'checkin'
    : pick(BOOKING_STATUSES);
  return {
    id: `book_${i + 1}`,
    roomId: room.id,
    propertyId: room.propertyId,
    guestId: guest.id,
    guestName: `${guest.firstName} ${guest.lastName}`,
    channel: pick(CHANNELS),
    status,
    checkIn: isoDate(start),
    checkOut: isoDate(end),
    guests: range(1, room.capacity),
    amount: room.basePrice * length,
    notes: rng() > 0.85 ? 'Поздний заезд, оставить ключ на ресепшен.' : undefined,
  };
});

// ============================================================
// Каналы продаж
// ============================================================
export const channels: ChannelConnection[] = [
  { id: 'ch_1', channel: 'ostrovok', name: 'Островок', icon: '🏝️', connected: true, hasError: false, lastSync: '2 минуты назад', activeBookings: 34, markup: 0 },
  { id: 'ch_2', channel: 'yandex', name: 'Яндекс.Путешествия', icon: '🟡', connected: true, hasError: false, lastSync: '5 минут назад', activeBookings: 22, markup: 5 },
  { id: 'ch_3', channel: 'sutochno', name: 'Суточно.ру', icon: '🏠', connected: true, hasError: false, lastSync: '12 минут назад', activeBookings: 18, markup: 3 },
  { id: 'ch_4', channel: 'otello', name: 'Отелло', icon: '🎭', connected: true, hasError: false, lastSync: '1 час назад', activeBookings: 9, markup: 0 },
  { id: 'ch_5', channel: '101hotels', name: '101Hotels', icon: '💯', connected: false, hasError: true, lastSync: '6 часов назад', activeBookings: 0, markup: 0 },
  { id: 'ch_6', channel: 'avito', name: 'Авито Недвижимость', icon: '📋', connected: false, hasError: false, lastSync: 'никогда', activeBookings: 0, markup: 0 },
];

export const syncLog: SyncLogEntry[] = Array.from({ length: 18 }).map((_, i) => {
  const s = rng();
  return {
    id: `sl_${i + 1}`,
    channel: pick(CHANNELS),
    time: `${range(1, 23)}:${range(10, 59)} • ${range(1, 28)} мая`,
    status: s > 0.9 ? 'error' : s > 0.75 ? 'warning' : 'success',
    message: s > 0.9 ? 'Ошибка авторизации API' : s > 0.75 ? 'Превышен лимит запросов' : 'Синхронизация завершена успешно',
  };
});

// ============================================================
// Задачи Kanban
// ============================================================
const TASK_TYPES = ['cleaning', 'repair', 'inspection', 'checkin', 'other'] as const;
const ASSIGNEES = ['Мария К.', 'Андрей П.', 'Светлана О.', 'Игорь Н.', 'Юлия С.', 'Дмитрий В.'];

export const tasks: Task[] = Array.from({ length: 32 }).map((_, i) => {
  const r = pick(rooms);
  const statusIdx = range(0, 2);
  return {
    id: `task_${i + 1}`,
    title: pick([
      'Уборка после выезда', 'Замена постельного белья', 'Проверка минибара',
      'Ремонт кондиционера', 'Замена лампочки', 'Подготовка к заезду VIP',
      'Глубокая уборка ковра', 'Проверка сантехники', 'Окна и зеркала',
    ]),
    description: `Номер ${r.number}, ${properties.find((p) => p.id === r.propertyId)?.name}`,
    type: pick([...TASK_TYPES]),
    priority: pick(['low', 'medium', 'high'] as const),
    status: (['todo', 'in_progress', 'done'] as const)[statusIdx],
    assignee: pick(ASSIGNEES),
    roomId: r.id,
    dueDate: isoDate(addDays(new Date(), range(-2, 5))),
  };
});

// ============================================================
// Персонал
// ============================================================
const SHIFTS = ['off', 'morning', 'evening', 'night'] as const;
export const staff: Staff[] = [
  { id: 's_1', name: 'Мария Кузнецова', role: 'Старший администратор', avatar: '👩‍💼', schedule: Array.from({ length: 7 }, () => pick([...SHIFTS])) },
  { id: 's_2', name: 'Андрей Попов', role: 'Администратор', avatar: '👨‍💼', schedule: Array.from({ length: 7 }, () => pick([...SHIFTS])) },
  { id: 's_3', name: 'Светлана Орлова', role: 'Горничная', avatar: '👩', schedule: Array.from({ length: 7 }, () => pick([...SHIFTS])) },
  { id: 's_4', name: 'Игорь Никитин', role: 'Техник', avatar: '👨‍🔧', schedule: Array.from({ length: 7 }, () => pick([...SHIFTS])) },
  { id: 's_5', name: 'Юлия Соколова', role: 'Горничная', avatar: '👩‍🦰', schedule: Array.from({ length: 7 }, () => pick([...SHIFTS])) },
  { id: 's_6', name: 'Дмитрий Волков', role: 'Менеджер', avatar: '🧔', schedule: Array.from({ length: 7 }, () => pick([...SHIFTS])) },
];

// ============================================================
// Пользователи системы
// ============================================================
export const users: User[] = [
  { id: 'u_1', name: 'Алексей Смирнов', email: 'a.smirnov@hoteliq.ru', role: 'admin', active: true },
  { id: 'u_2', name: 'Мария Кузнецова', email: 'm.kuznetsova@hoteliq.ru', role: 'manager', active: true },
  { id: 'u_3', name: 'Андрей Попов', email: 'a.popov@hoteliq.ru', role: 'reception', active: true },
  { id: 'u_4', name: 'Светлана Орлова', email: 's.orlova@hoteliq.ru', role: 'cleaner', active: true },
  { id: 'u_5', name: 'Игорь Никитин', email: 'i.nikitin@hoteliq.ru', role: 'reception', active: false },
];

// ============================================================
// Доп. данные: статистика для дашборда
// ============================================================
export const kpiToday = {
  occupancy: 84,
  revenueToday: 487_650,
  adr: 9_840,
  revpar: 8_265,
  activeBookings: 47,
  guestsToday: 68,
};

// Точки графика — 30 дней назад до сегодня
export const bookingTrend = Array.from({ length: 30 }).map((_, i) => {
  const d = addDays(new Date(), i - 29);
  return {
    date: isoDate(d),
    label: `${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, '0')}`,
    bookings: range(8, 22),
    revenue: range(180_000, 540_000),
  };
});

export const channelDistribution = [
  { name: 'Островок', value: 34, color: '#1E3A5F' },
  { name: 'Яндекс', value: 22, color: '#FCC400' },
  { name: 'Прямые', value: 18, color: '#D4A853' },
  { name: 'Суточно', value: 14, color: '#10B981' },
  { name: 'Отелло', value: 8, color: '#8B5CF6' },
  { name: 'Другие', value: 4, color: '#94A3B8' },
];

export const aiInsights = [
  { id: 'ai_1', icon: '📈', title: 'Повысьте цены на выходные', text: 'Прогноз загрузки на сб/вс — 96%. Рекомендуем поднять тариф Deluxe на 12%.' },
  { id: 'ai_2', icon: '⚠️', title: 'Просадка на канале Суточно.ру', text: 'За 7 дней брони упали на 24%. Проверьте видимость и цены.' },
  { id: 'ai_3', icon: '🎯', title: 'Конверсия Яндекса выросла', text: 'CTR +18%. Увеличьте бюджет на продвижение или квоту номеров.' },
];

export const alerts = [
  { id: 'al_1', level: 'error' as const, title: '3 номера не убраны', text: 'Заезд через 2 часа в Гранд-Отель Метрополь' },
  { id: 'al_2', level: 'warning' as const, title: 'Просроченная задача', text: 'Замена кондиционера в номере 204' },
  { id: 'al_3', level: 'info' as const, title: 'Новый отзыв', text: '5 звёзд от Анны И. — упомяните в социальных сетях' },
];

export const upcomingCheckins = bookings
  .filter((b) => {
    const diff = (new Date(b.checkIn).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 2 && (b.status === 'confirmed' || b.status === 'checkin');
  })
  .slice(0, 6)
  .map((b) => {
    const g = guests.find((x) => x.id === b.guestId)!;
    const p = properties.find((x) => x.id === b.propertyId)!;
    return { booking: b, guest: g, property: p };
  });
