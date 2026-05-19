// Глобальное хранилище настроек приложения: уведомления, баланс, контакты,
// каналы продаж, шаблоны писем, автосообщения, webhooks. Персистится в localStorage.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------- Каталог каналов и источников ----------
export interface ChannelDef {
  id: string;
  name: string;
  category: 'OTA' | 'Метапоиск' | 'Прямые' | 'Корпоративные' | 'Аренда' | 'Прочее';
  color: string;
}

// 44+ канала продаж (по скрину пользователя)
export const CHANNELS_CATALOG: ChannelDef[] = [
  { id: 'bookingcom', name: 'Booking.com', category: 'OTA', color: '#003580' },
  { id: 'ostrovok', name: 'Ostrovok.ru', category: 'OTA', color: '#E94E1B' },
  { id: 'yandex-travel', name: 'Яндекс Путешествия', category: 'OTA', color: '#FFCC00' },
  { id: 'sutochno', name: 'Sutochno.ru', category: 'Аренда', color: '#36B37E' },
  { id: 'avito', name: 'Avito.ru', category: 'Аренда', color: '#00AAFF' },
  { id: 'airbnb', name: 'Airbnb', category: 'Аренда', color: '#FF5A5F' },
  { id: 'cian', name: 'cian.ru', category: 'Аренда', color: '#0468FF' },
  { id: 'tvil', name: 'Tvil.ru', category: 'Аренда', color: '#8B5CF6' },
  { id: 'bronevik', name: 'Bronevik', category: 'OTA', color: '#1F2937' },
  { id: 'onetwotrip', name: 'OneTwoTrip', category: 'OTA', color: '#F59E0B' },
  { id: '101hotels', name: '101Hotels', category: 'OTA', color: '#0EA5E9' },
  { id: 'otello', name: 'Отелло', category: 'OTA', color: '#10B981' },
  { id: 'roomook', name: 'Roomook', category: 'OTA', color: '#EC4899' },
  { id: 'roomlink', name: 'Roomlink', category: 'OTA', color: '#3B82F6' },
  { id: 'privet-tur', name: 'PrivetTur', category: 'OTA', color: '#EF4444' },
  { id: 'tripvenue', name: 'Tripvenue', category: 'OTA', color: '#A855F7' },
  { id: 'tutu', name: 'Tutu', category: 'Метапоиск', color: '#22C55E' },
  { id: 'mirturbaz', name: 'МирТурбаз', category: 'OTA', color: '#14B8A6' },
  { id: 'alean', name: 'Алеан', category: 'OTA', color: '#06B6D4' },
  { id: 'apart-sharing', name: 'Apart Sharing', category: 'Аренда', color: '#F97316' },
  { id: 'ozon-travel', name: 'Ozon Travel', category: 'OTA', color: '#005BFF' },
  { id: 'korzina', name: 'Корзина', category: 'Прочее', color: '#6366F1' },
  { id: 'postoyanniy-gost', name: 'Постоянный гость', category: 'Прямые', color: '#D4AF37' },
  { id: 'domclick', name: 'DomClick', category: 'Аренда', color: '#46A045' },
  { id: 'kufar', name: 'kufar.by', category: 'Аренда', color: '#FFB800' },
  { id: 'apartator', name: 'Апартатор', category: 'Аренда', color: '#7C3AED' },
  { id: 'direct', name: 'Прямые брони', category: 'Прямые', color: '#0F172A' },
  { id: 'walkin', name: 'Заезд без брони', category: 'Прямые', color: '#475569' },
  { id: 'phone', name: 'Телефон', category: 'Прямые', color: '#0EA5E9' },
  { id: 'site', name: 'Сайт отеля', category: 'Прямые', color: '#1E40AF' },
  { id: 'corporate', name: 'Корпоративные клиенты', category: 'Корпоративные', color: '#374151' },
  { id: 'agency', name: 'Туристические агентства', category: 'Корпоративные', color: '#92400E' },
  { id: 'rzd', name: 'РЖД Бонус', category: 'Корпоративные', color: '#DC2626' },
  { id: 'gosuslugi', name: 'Госуслуги Культура', category: 'Корпоративные', color: '#1E40AF' },
  { id: 'mts-travel', name: 'МТС Travel', category: 'OTA', color: '#E30611' },
  { id: 'sbermegamarket', name: 'СберТуризм', category: 'OTA', color: '#21A038' },
  { id: 'tinkoff-travel', name: 'Т-Путешествия', category: 'OTA', color: '#FFDD2D' },
  { id: 'alfa-travel', name: 'Альфа Travel', category: 'OTA', color: '#EF3124' },
  { id: 'vtb-travel', name: 'ВТБ Путешествия', category: 'OTA', color: '#002F6C' },
  { id: 'aviasales', name: 'Aviasales (Hotellook)', category: 'Метапоиск', color: '#FF6D00' },
  { id: 'trivago', name: 'Trivago', category: 'Метапоиск', color: '#E03A3E' },
  { id: 'tripadvisor', name: 'TripAdvisor', category: 'Метапоиск', color: '#34E0A1' },
  { id: 'google-hotels', name: 'Google Hotels', category: 'Метапоиск', color: '#4285F4' },
  { id: 'tochka-travel', name: 'Точка Travel', category: 'OTA', color: '#7E5BFF' },
];

// ---------- Шаблоны писем ----------
export interface EmailTagDef { tag: string; description: string; }
export const EMAIL_TAGS: EmailTagDef[] = [
  { tag: '{{GUEST_NAME}}', description: 'Имя гостя' },
  { tag: '{{GUEST_PHONE}}', description: 'Телефон гостя' },
  { tag: '{{GUEST_EMAIL}}', description: 'Email гостя' },
  { tag: '{{BOOKING_ID}}', description: 'Номер брони' },
  { tag: '{{CHECKIN_DATE}}', description: 'Дата заезда' },
  { tag: '{{CHECKOUT_DATE}}', description: 'Дата выезда' },
  { tag: '{{NIGHTS}}', description: 'Количество ночей' },
  { tag: '{{ROOM_NAME}}', description: 'Название номера' },
  { tag: '{{PROPERTY_NAME}}', description: 'Название объекта' },
  { tag: '{{ADDRESS}}', description: 'Адрес' },
  { tag: '{{ADDRESS_ENG}}', description: 'Адрес (англ.)' },
  { tag: '{{HOW_TO_GET}}', description: 'Как добраться' },
  { tag: '{{MANAGER_NAME}}', description: 'Имя менеджера' },
  { tag: '{{MANAGER_PHONE}}', description: 'Телефон менеджера' },
  { tag: '{{AGENCY_NAME}}', description: 'Название отеля' },
  { tag: '{{AGENCY_PHONE}}', description: 'Телефон отеля' },
  { tag: '{{AGENCY_EMAIL}}', description: 'Email отеля' },
  { tag: '{{LINK_BOOKING}}', description: 'Ссылка на бронь' },
  { tag: '{{WAIT_TIME}}', description: 'Время ожидания' },
  { tag: '{{AMOUNT}}', description: 'Сумма брони' },
  { tag: '{{IS_BOOKING_COM}}', description: 'Условие: канал Booking.com' },
];

export interface EmailTemplate {
  key: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  enabled: boolean;
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: 'booking-confirm',
    label: 'Подтверждение брони',
    description: 'Отправляется сразу после создания брони',
    subject: 'Бронь №{{BOOKING_ID}} подтверждена · {{AGENCY_NAME}}',
    enabled: true,
    body:
      `Здравствуйте, {{GUEST_NAME}}!\n\n` +
      `Подтверждаем вашу бронь №{{BOOKING_ID}} в {{PROPERTY_NAME}}.\n\n` +
      `Заезд: {{CHECKIN_DATE}}\nВыезд: {{CHECKOUT_DATE}}\nНомер: {{ROOM_NAME}}\nСумма: {{AMOUNT}}\n\n` +
      `Адрес: {{ADDRESS}}\nКак добраться: {{HOW_TO_GET}}\n\n` +
      `{% if IS_BOOKING_COM %}Эта бронь сделана через Booking.com, оплата по ваучеру.{% endif %}\n\n` +
      `С уважением,\n{{MANAGER_NAME}}\n{{MANAGER_PHONE}}`,
  },
  {
    key: 'pre-arrival',
    label: 'Напоминание о заезде',
    description: 'За 1 день до заезда',
    subject: 'Завтра ваш заезд · {{AGENCY_NAME}}',
    enabled: true,
    body:
      `Здравствуйте, {{GUEST_NAME}}!\n\n` +
      `Завтра ({{CHECKIN_DATE}}) ждём вас в {{PROPERTY_NAME}}.\n\n` +
      `Адрес: {{ADDRESS}}\n{{HOW_TO_GET}}\n\n` +
      `Если будете опаздывать, сообщите менеджеру: {{MANAGER_PHONE}}.`,
  },
  {
    key: 'post-stay',
    label: 'Благодарность после выезда',
    description: 'Через 1 день после выезда',
    subject: 'Спасибо за визит! · {{AGENCY_NAME}}',
    enabled: true,
    body:
      `{{GUEST_NAME}}, спасибо что выбрали {{AGENCY_NAME}}!\n\n` +
      `Будем рады видеть вас снова. При следующей брони напрямую — скидка 10%.\n\n` +
      `{{MANAGER_NAME}}\n{{AGENCY_PHONE}}`,
  },
  {
    key: 'cancelled',
    label: 'Уведомление об отмене',
    description: 'При отмене брони',
    subject: 'Бронь №{{BOOKING_ID}} отменена',
    enabled: true,
    body:
      `{{GUEST_NAME}}, ваша бронь №{{BOOKING_ID}} отменена.\n\n` +
      `Если это произошло по ошибке — свяжитесь с нами: {{MANAGER_PHONE}}.\n\n` +
      `{{AGENCY_NAME}}`,
  },
  {
    key: 'review-request',
    label: 'Запрос отзыва',
    description: 'Через 3 дня после выезда',
    subject: 'Поделитесь впечатлениями',
    enabled: false,
    body:
      `Здравствуйте, {{GUEST_NAME}}!\n\n` +
      `Будем благодарны за отзыв о пребывании в {{PROPERTY_NAME}}.\n` +
      `Оставить отзыв: {{LINK_BOOKING}}`,
  },
];

// ---------- Автосообщения (мессенджеры) ----------
export interface AutoMessageTemplateDef {
  key: string;
  label: string;
  description: string;
  defaultText: string;
}

export const AUTO_MESSAGE_TEMPLATES: AutoMessageTemplateDef[] = [
  {
    key: 'tg-bot-invite',
    label: 'Приглашение в Telegram-бот',
    description: 'Сообщение с приглашением подключить бота для гостя',
    defaultText: 'Здравствуйте, {{GUEST_NAME}}! Подключитесь к нашему боту @GinoHotelBot — там вы получите код от двери и инструкции по заезду.',
  },
  {
    key: 'booking-confirmation',
    label: 'Подтверждение брони',
    description: 'Короткое сообщение в мессенджер сразу после брони',
    defaultText: 'Бронь №{{BOOKING_ID}} подтверждена. Заезд {{CHECKIN_DATE}} в {{PROPERTY_NAME}}. Адрес: {{ADDRESS}}.',
  },
  {
    key: 'arrival-instructions',
    label: 'Инструкция по заезду',
    description: 'Отправляется за несколько часов до заезда',
    defaultText: '{{GUEST_NAME}}, ваш номер готов. Код от двери: ____. {{HOW_TO_GET}}',
  },
  {
    key: 'late-checkin',
    label: 'Поздний заезд',
    description: 'Если гость опаздывает',
    defaultText: 'Менеджер ждёт вашего звонка для согласования времени заезда: {{MANAGER_PHONE}}.',
  },
  {
    key: 'checkout-reminder',
    label: 'Напоминание о выезде',
    description: 'За 2 часа до расчётного времени',
    defaultText: '{{GUEST_NAME}}, напоминаем что расчётное время — 12:00. Ждём вас на ресепшене для возврата ключей.',
  },
];

export interface AutoMessageState {
  enabled: boolean;
  channels: string[]; // MAX / WhatsApp / Telegram / Email / SMS
  text: string;
}

// ---------- Webhooks ----------
export interface Webhook {
  id: string;
  event: string;
  url: string;
  enabled: boolean;
}

// ---------- Контакты ----------
export interface ContactsInfo {
  name: string;
  phone: string;
  email: string;
  site: string;
  whatsapp: string;
  telegram: string;
  max: string;
  address: string;
}

// ---------- Уведомления ----------
export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  telegram: boolean;
  whatsapp: boolean;
  max: boolean;
  push: boolean;
  newBooking: boolean;
  cancellation: boolean;
  dailyReport: boolean;
  channelErrors: boolean;
  aiInsights: boolean;
}

// ---------- Баланс ----------
export interface BalanceEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  balanceAfter: number;
}

export interface BalanceState {
  amount: number;
  currency: string;
  history: BalanceEntry[];
}

// ---------- Подключения мессенджеров ----------
// Информация о подключённых каналах рассылки. Не путать с channels (источники броней).
export type MessengerKey = 'telegram' | 'whatsapp' | 'max' | 'email' | 'sms';

export interface MessengerConnection {
  connected: boolean;
  connectedAt?: string;
  // Telegram / MAX
  botToken?: string;
  botUsername?: string;
  chatId?: string;
  // WhatsApp
  provider?: 'green-api' | 'wazzup' | 'twilio' | 'sms-ru' | 'sms-aero';
  apiKey?: string;
  instanceId?: string;
  phoneNumber?: string;
  // Email/SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromName?: string;
}

export type MessengerConnections = Record<MessengerKey, MessengerConnection>;

const initialConnections: MessengerConnections = {
  telegram: { connected: false },
  whatsapp: { connected: false },
  max: { connected: false },
  email: { connected: false },
  sms: { connected: false },
};

// ---------- Стор ----------
interface SettingsState {
  notifications: NotificationPrefs;
  balance: BalanceState;
  contacts: ContactsInfo;
  channels: Record<string, boolean>;
  emailTemplates: EmailTemplate[];
  autoMessages: Record<string, AutoMessageState>;
  webhooks: Webhook[];
  connections: MessengerConnections;

  setNotifications: (patch: Partial<NotificationPrefs>) => void;
  setContacts: (patch: Partial<ContactsInfo>) => void;
  toggleChannel: (id: string) => void;
  updateEmailTemplate: (key: string, patch: Partial<EmailTemplate>) => void;
  updateAutoMessage: (key: string, patch: Partial<AutoMessageState>) => void;
  addWebhook: (data: { event: string; url: string }) => void;
  toggleWebhook: (id: string) => void;
  removeWebhook: (id: string) => void;
  topUpBalance: (amount: number) => void;
  connectMessenger: (key: MessengerKey, data: Partial<MessengerConnection>) => void;
  disconnectMessenger: (key: MessengerKey) => void;
}

const initialAutoMessages: Record<string, AutoMessageState> = Object.fromEntries(
  AUTO_MESSAGE_TEMPLATES.map((t) => [t.key, { enabled: false, channels: ['Telegram'], text: t.defaultText }]),
);

const initialChannels: Record<string, boolean> = Object.fromEntries(
  // По умолчанию включены самые популярные
  CHANNELS_CATALOG.map((c) => [c.id, ['bookingcom', 'ostrovok', 'yandex-travel', 'sutochno', 'avito', 'direct'].includes(c.id)]),
);

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: {
        email: true, sms: false, telegram: true, whatsapp: false, max: false, push: true,
        newBooking: true, cancellation: true, dailyReport: false, channelErrors: true, aiInsights: true,
      },
      balance: {
        amount: 12450,
        currency: '₽',
        history: [
          { id: 'b1', date: '2026-05-12', description: 'Пополнение', amount: 10000, balanceAfter: 12450 },
          { id: 'b2', date: '2026-05-11', description: 'Списание за брони (24 шт.)', amount: -288, balanceAfter: 2450 },
          { id: 'b3', date: '2026-05-01', description: 'Пополнение', amount: 5000, balanceAfter: 2738 },
        ],
      },
      contacts: {
        name: 'Отель GinoHotel',
        phone: '+7 (495) 123-45-67',
        email: 'info@ginohotel.ru',
        site: 'https://ginohotel.ru',
        whatsapp: '+74951234567',
        telegram: '@ginohotel',
        max: '@ginohotel',
        address: 'Москва, ул. Тверская, 12',
      },
      channels: initialChannels,
      emailTemplates: DEFAULT_EMAIL_TEMPLATES,
      autoMessages: initialAutoMessages,
      webhooks: [
        { id: 'w1', event: 'booking.created', url: 'https://api.example.com/webhook/created', enabled: true },
        { id: 'w2', event: 'booking.cancelled', url: 'https://api.example.com/webhook/cancelled', enabled: true },
      ],
      connections: initialConnections,

      setNotifications: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),
      setContacts: (patch) => set((s) => ({ contacts: { ...s.contacts, ...patch } })),
      toggleChannel: (id) => set((s) => ({ channels: { ...s.channels, [id]: !s.channels[id] } })),
      updateEmailTemplate: (key, patch) => set((s) => ({
        emailTemplates: s.emailTemplates.map((t) => t.key === key ? { ...t, ...patch } : t),
      })),
      updateAutoMessage: (key, patch) => set((s) => ({
        autoMessages: { ...s.autoMessages, [key]: { ...(s.autoMessages[key] ?? { enabled: false, channels: [], text: '' }), ...patch } },
      })),
      addWebhook: ({ event, url }) => set((s) => ({
        webhooks: [...s.webhooks, { id: `w-${Date.now()}`, event, url, enabled: true }],
      })),
      toggleWebhook: (id) => set((s) => ({
        webhooks: s.webhooks.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w),
      })),
      removeWebhook: (id) => set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== id) })),
      topUpBalance: (amount) => set((s) => {
        const newAmount = s.balance.amount + amount;
        const entry: BalanceEntry = {
          id: `b-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          description: 'Пополнение',
          amount,
          balanceAfter: newAmount,
        };
        return { balance: { ...s.balance, amount: newAmount, history: [entry, ...s.balance.history] } };
      }),
      connectMessenger: (key, data) => set((s) => ({
        connections: { ...s.connections, [key]: { ...s.connections[key], ...data, connected: true, connectedAt: new Date().toISOString() } },
      })),
      disconnectMessenger: (key) => set((s) => ({
        connections: { ...s.connections, [key]: { connected: false } },
      })),
    }),
    { name: 'ginohotel-settings', version: 2 },
  ),
);
