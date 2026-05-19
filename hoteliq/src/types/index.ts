// ============================================================
// Типы доменной модели GinoHotel
// ============================================================

export type PropertyType = 'hotel' | 'apartment' | 'house';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  city: string;
  address: string;
  description: string;
  rating: number;
  cover: string; // ключ обложки (см. PropertyCover)
  rooms: number;
  occupancy: number; // %
  revenueMonth: number;
  amenities: string[];
}

export type RoomCategory = 'Standard' | 'Deluxe' | 'Suite' | 'Family' | 'Studio';
export type RoomStatus = 'clean' | 'dirty' | 'occupied' | 'inspection' | 'maintenance';

export interface Room {
  id: string;
  propertyId: string;
  number: string;
  category: RoomCategory;
  capacity: number;
  basePrice: number;
  status: RoomStatus;
  floor: number;
}

export type BookingStatus =
  | 'confirmed'
  | 'pending'
  | 'checkin'
  | 'checkout'
  | 'blocked'
  | 'cancelled';

export type Channel =
  | 'ostrovok'
  | 'yandex'
  | 'sutochno'
  | 'otello'
  | '101hotels'
  | 'avito'
  | 'direct';

export interface BookingPayment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'online';
  at: string; // ISO datetime
  refund?: boolean;
  note?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  propertyId: string;
  guestId: string;
  guestName: string;
  channel: Channel;
  status: BookingStatus;
  checkIn: string;  // ISO date
  checkOut: string; // ISO date
  guests: number;
  amount: number;
  notes?: string;
  // Расширенные поля (необязательные)
  checkInTime?: string;       // HH:mm
  checkOutTime?: string;      // HH:mm
  pricePerNight?: number;
  commission?: number;        // комиссия площадки в ₽
  deposit?: number;           // залог
  payments?: BookingPayment[];
  additionalPhone?: string;
  attachments?: string[];     // dataURL или имена файлов
  sendEmailConfirmation?: boolean;
  onlineContractUrl?: string;
  tariff?: BookingTariff;
}

export type BookingTariff = 'breakfast' | 'no-breakfast' | 'non-refundable' | 'all-inclusive';

export type GuestTag = 'VIP' | 'Постоянный' | 'Новый' | 'ЧС' | 'Корпоративный';
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface PassportData {
  series: string;
  number: string;
  issuedBy: string;
  issuedAt: string; // ISO date
  birthDate: string; // ISO date
  scanDataUrl?: string; // data URL загруженного скана (мок)
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  avatar: string; // зарезервировано, инициалы рендерятся через Avatar
  staysCount: number;
  totalSpent: number;
  tags: GuestTag[];
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  blacklisted: boolean;
  notes: string;
  registeredAt: string;
  passport?: PassportData;
}

export interface ChannelConnection {
  id: string;
  channel: Channel;
  name: string;
  icon: string;
  connected: boolean;
  hasError: boolean;
  lastSync: string;
  activeBookings: number;
  apiKey?: string;
  markup: number; // %
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'cleaning' | 'repair' | 'inspection' | 'checkin' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  roomId?: string;
  dueDate: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatar: string;
  schedule: ('off' | 'morning' | 'evening' | 'night')[]; // 7 дней
}

export interface SyncLogEntry {
  id: string;
  channel: Channel;
  time: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export type UserRole = 'admin' | 'manager' | 'reception' | 'cleaner';

// Ключи разделов, к которым может быть предоставлен доступ
export type PermissionKey =
  | 'dashboard'
  | 'grid'
  | 'properties'
  | 'channels'
  | 'guests'
  | 'finance'
  | 'tasks'
  | 'settings'
  | 'team'
  | 'pricing'
  | 'expenses'
  | 'roomservice'
  | 'locks'
  | 'mvd'
  | 'reports';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  password?: string; // мок (в реальной системе — хеш на бэке)
  ownerId?: string; // кто добавил пользователя
  permissions: PermissionKey[];
  createdAt?: string;
  avatar?: string;  // data-URL загруженного аватара
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

// ============================================================
// Конфликты и overbooking (Channel Manager 2.0)
// ============================================================
export type ConflictResolution =
  | 'upgrade'         // апгрейд гостя в более дорогой свободный номер
  | 'relocate-room'   // перевод в другой свободный номер той же категории
  | 'relocate-partner'// передача в партнёрский отель
  | 'compensate-cancel' // отмена с возвратом + компенсацией
  | 'manual';         // ручное решение

export interface BookingConflict {
  id: string;
  type: 'overbooking' | 'rate-mismatch' | 'channel-error';
  roomId: string;
  propertyId: string;
  bookingIds: string[]; // как правило 2
  detectedAt: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  resolved: boolean;
  resolution?: ConflictResolution;
  resolutionNote?: string;
  resolvedAt?: string;
}

// ============================================================
// OPEX / Расходы
// ============================================================
export type ExpenseCategory =
  | 'salary'        // ФОТ
  | 'utilities'     // коммуналка
  | 'laundry'       // прачечная
  | 'cleaning'      // уборка / расходники
  | 'maintenance'   // ремонт
  | 'supplies'      // расходники гостям
  | 'marketing'     // реклама
  | 'taxes'         // налоги, сборы
  | 'insurance'     // страховка
  | 'rent'          // аренда
  | 'food'          // продукты для завтраков
  | 'commission'    // комиссии каналов
  | 'depreciation'  // амортизация
  | 'other';

export interface Expense {
  id: string;
  date: string;          // ISO дата
  category: ExpenseCategory;
  description: string;
  amount: number;        // ₽
  propertyId: string | 'shared'; // shared = распределить по всем по доле выручки
  attachmentName?: string; // имя прикреплённого чека/файла
  attachmentDataUrl?: string; // мок-данные файла
  vendor?: string;       // подрядчик
  createdBy?: string;    // userId
  createdAt: string;
}

// ============================================================
// Room Service / Доставка еды
// ============================================================
export type CuisineType =
  | 'Осетинская'
  | 'Кавказская'
  | 'Грузинская'
  | 'Европейская'
  | 'Японская'
  | 'Итальянская'
  | 'Фастфуд'
  | 'Десерты';

export interface RestaurantMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'starter' | 'main' | 'soup' | 'dessert' | 'drink' | 'pie'; // pie — осетинский пирог
  emoji?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  city: string;            // обычно Владикавказ
  cuisine: CuisineType[];
  rating: number;          // 0..5
  reviewsCount: number;
  deliveryFee: number;     // ₽
  deliveryMinutes: number; // средний срок
  minOrder: number;        // ₽
  workingHours: string;    // "10:00–23:00"
  phone: string;
  address: string;
  cover: string;           // emoji/icon-key
  verified: boolean;       // проверен Gino-командой
  description: string;
  menu: RestaurantMenuItem[];
}

export type RoomOrderStatus =
  | 'new'         // создан гостем
  | 'accepted'    // принят рестораном
  | 'cooking'     // готовится
  | 'delivering'  // в пути
  | 'delivered'   // доставлен в номер
  | 'completed'   // оплачен / закрыт
  | 'cancelled';

export interface RoomOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface RoomOrder {
  id: string;
  bookingId: string;
  guestName: string;
  roomNumber: string;
  propertyId: string;
  restaurantId: string;
  restaurantName: string;
  items: RoomOrderItem[];
  subtotal: number;
  deliveryFee: number;
  hotelCommission: number; // 10% от subtotal
  total: number;           // subtotal + delivery (commission удерживает Gino)
  status: RoomOrderStatus;
  createdAt: string;
  deliveredAt?: string;
  note?: string;
  paymentMethod: 'to-bill' | 'card' | 'cash';
}

// ============================================================
// Электронные замки
// ============================================================
export type LockProvider = 'TTLock' | 'Igloohome' | 'Salto' | 'YGG' | 'Hikvision';
export type LockStatus = 'online' | 'offline' | 'low-battery' | 'tamper';

export interface SmartLock {
  id: string;
  roomId: string;
  propertyId: string;
  provider: LockProvider;
  serialNumber: string;
  status: LockStatus;
  batteryLevel: number;       // %
  firmwareVersion: string;
  lastSeen: string;
  installedAt: string;
}

export type VirtualKeyStatus = 'scheduled' | 'active' | 'used' | 'expired' | 'revoked';

export interface VirtualKey {
  id: string;
  lockId: string;
  bookingId: string;
  guestName: string;
  pinCode: string;            // 6 цифр
  validFrom: string;
  validTo: string;
  status: VirtualKeyStatus;
  sentVia: ('sms' | 'email' | 'telegram' | 'whatsapp' | 'push')[];
  sentAt?: string;
  usedAt?: string;
  createdAt: string;
}

export interface LockEvent {
  id: string;
  lockId: string;
  time: string;
  type: 'unlock' | 'lock' | 'denied' | 'low-battery' | 'tamper' | 'manual-open';
  source: 'pin' | 'app' | 'card' | 'physical-key' | 'system';
  actor?: string; // имя гостя/сотрудника
}

// ============================================================
// RMS (Revenue Management System)
// ============================================================
export interface PricingRule {
  id: string;
  propertyId: string | 'all';
  name: string;
  condition:
    | 'occupancy-above'
    | 'occupancy-below'
    | 'days-ahead'        // за N дней до заезда (раннее бронирование)
    | 'last-minute'       // за 1-2 дня до заезда
    | 'weekend'           // пт-сб-вс
    | 'day-of-week'       // конкретные дни недели
    | 'holiday'           // государственные праздники
    | 'event'             // событие в городе
    | 'season'            // высокий сезон
    | 'long-stay'         // от N ночей
    | 'short-stay'        // 1-2 ночи
    | 'channel-specific'  // для конкретного канала
    | 'competitor-cheaper'
    | 'competitor-expensive'
    | 'low-pace'          // отстаём от прошлого года
    | 'high-pace';        // обгоняем прошлый год
  threshold: number;            // %, дни, ночи — зависит от condition
  action: 'increase' | 'decrease' | 'set-fixed';
  amount: number;               // % или ₽
  enabled: boolean;
  priority: number;
  // Доп. параметры для отдельных условий
  daysOfWeek?: number[];        // 0=вс…6=сб (для 'day-of-week')
  channels?: string[];          // для 'channel-specific'
}

export interface PricingForecast {
  date: string;        // ISO
  propertyId: string;
  forecastOccupancy: number; // %
  currentPrice: number;      // ₽
  recommendedPrice: number;  // ₽
  competitorAvg: number;     // ₽
  demandIndex: number;       // 0..100
}

export interface PaceEntry {
  date: string;            // дата заезда
  bookingsOnBook: number;  // сколько броней сейчас
  prevYearOnBook: number;  // на эту же дату год назад
  finalLastYear: number;   // финальное число прошлого года
}

// ============================================================
// eFMS / отчётность в МВД для иностранцев
// ============================================================
export type MvdReportStatus = 'draft' | 'submitted' | 'accepted' | 'rejected';
export type MvdFormType = 'arrival' | 'departure'; // форма прибытия / убытия

export interface MvdReport {
  id: string;
  guestId: string;
  guestFullName: string;
  bookingId: string;
  propertyId: string;
  formType: MvdFormType;
  arrivalDate: string;
  departureDate: string;
  citizenship: string;
  passportSeries?: string;
  passportNumber: string;
  visaNumber?: string;
  migrationCardNumber?: string;
  registrationAddress: string;
  status: MvdReportStatus;
  deadline: string; // 24 часа от заезда
  submittedAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  externalId?: string; // ID на госуслугах
  createdAt: string;
}
