// Стор: уведомления-колокольчик. Хранит ленту, поддерживает браузерные push-нотификации и звук.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifTone = 'info' | 'success' | 'warning' | 'error';
export type NotifCategory = 'booking' | 'channel' | 'payment' | 'task' | 'system' | 'guest' | 'mvd';

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  tone: NotifTone;
  category: NotifCategory;
  link?: string;       // куда вести по клику
  read: boolean;
  createdAt: string;
}

interface NotifState {
  items: NotificationItem[];
  permission: NotificationPermission | 'default';
  hydrated: boolean;
  push: (n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'> & { id?: string }) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  requestBrowserPermission: () => Promise<NotificationPermission>;
  setPermission: (p: NotificationPermission) => void;
}

const seed: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Новая бронь по каналу Ostrovok',
    body: 'А. Иванов · номер 105 · с 21.05 на 3 ночи',
    tone: 'success',
    category: 'booking',
    link: '/grid',
    read: false,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'n-2',
    title: 'Платёж получен',
    body: 'СБП · 14 400 ₽ от М. Петровой',
    tone: 'success',
    category: 'payment',
    link: '/finance',
    read: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'n-3',
    title: 'Конфликт броней',
    body: 'Двойная продажа номера 207 — Booking и Ostrovok',
    tone: 'error',
    category: 'channel',
    link: '/channels',
    read: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n-4',
    title: 'Отчёт МВД принят',
    body: 'Гость Liu Wei · форма №7',
    tone: 'info',
    category: 'mvd',
    link: '/mvd',
    read: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n-5',
    title: 'Задача просрочена',
    body: 'Уборка номера 308',
    tone: 'warning',
    category: 'task',
    link: '/tasks',
    read: true,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
  },
];

// Короткий синтез звука "ding" через WebAudio (без файлов)
function playDing() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.42);
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    // тихо игнорируем — звук необязателен
  }
}

function maybeShowBrowserNotification(n: NotificationItem, pushEnabled: boolean, soundEnabled: boolean) {
  if (typeof window === 'undefined') return;
  if (soundEnabled) playDing();
  if (!pushEnabled) return;
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    const browserNotif = new Notification(n.title, {
      body: n.body,
      icon: '/favicon.ico',
      tag: n.id,
      silent: true, // звук рисуем сами, чтоб не дублировать
    });
    if (n.link) {
      browserNotif.onclick = () => {
        try { window.focus(); } catch {}
        try { window.location.hash = n.link!; } catch {}
      };
    }
    setTimeout(() => browserNotif.close(), 6000);
  } catch {
    // ignore
  }
}

export const useNotifications = create<NotifState>()(
  persist(
    (set, get) => ({
      items: seed,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      hydrated: false,
      push: (n) => {
        const item: NotificationItem = {
          id: n.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: n.title,
          body: n.body,
          tone: n.tone,
          category: n.category,
          link: n.link,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ items: [item, ...s.items].slice(0, 200) }));
        // читаем настройки (лениво, чтоб избежать циклов импортов)
        try {
          const { useSettings } = require('@/store/settings');
          const prefs = useSettings.getState().notifications;
          maybeShowBrowserNotification(item, !!prefs?.push, !!prefs?.push);
        } catch {
          maybeShowBrowserNotification(item, true, true);
        }
      },
      markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
      markRead: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      requestBrowserPermission: async () => {
        if (typeof Notification === 'undefined') return 'denied';
        try {
          const res = await Notification.requestPermission();
          set({ permission: res });
          return res;
        } catch {
          return 'denied';
        }
      },
      setPermission: (p) => set({ permission: p }),
    }),
    {
      name: 'ginohotel-notifications',
      partialize: (s) => ({ items: s.items.slice(0, 100) }),
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);

export const NOTIF_CATEGORY_LABEL: Record<NotifCategory, string> = {
  booking: 'Брони',
  channel: 'Каналы',
  payment: 'Платежи',
  task: 'Задачи',
  system: 'Система',
  guest: 'Гости',
  mvd: 'МВД',
};
