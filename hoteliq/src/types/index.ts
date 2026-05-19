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
}

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
  | 'team';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  password?: string; // мок (в реальной системе — хеш на бэке)
  ownerId?: string; // кто добавил пользователя
  permissions: PermissionKey[];
  createdAt?: string;
}
