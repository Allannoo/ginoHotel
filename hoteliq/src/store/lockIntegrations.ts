// Интеграции с провайдерами электронных замков (мок).
// Хранит API-ключи; подключение к реальным API подключим позже.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LockProvider = 'ttlock' | 'igloohome' | 'salto' | 'nuki';

export interface LockProviderConfig {
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  accountEmail?: string;
  webhookUrl: string;     // куда провайдер шлёт события (read-only)
  lastSyncAt?: string;
  status: 'disconnected' | 'connected' | 'error';
  message?: string;       // ошибка / последний ответ
}

export const LOCK_PROVIDER_META: Record<LockProvider, { name: string; descr: string; docs: string }> = {
  ttlock: {
    name: 'TTLock',
    descr: 'Bluetooth + Wi-Fi шлюз, популярны в РФ. OAuth + REST API euopen.ttlock.com',
    docs: 'https://euopen.ttlock.com/document',
  },
  igloohome: {
    name: 'Igloohome',
    descr: 'Оффлайн-замки с алгоритмическим PIN. Подойдут для апартаментов без интернета.',
    docs: 'https://igloocompany.zendesk.com/hc/en-us/sections/360003484053',
  },
  salto: {
    name: 'Salto KS',
    descr: 'Корпоративный уровень, RFID-карты. Cloud REST API.',
    docs: 'https://saltoks.com/developer',
  },
  nuki: {
    name: 'Nuki',
    descr: 'Розничный smart-lock, Web API + Bridge.',
    docs: 'https://developer.nuki.io/',
  },
};

interface State {
  providers: Record<LockProvider, LockProviderConfig>;
  update: (p: LockProvider, patch: Partial<LockProviderConfig>) => void;
  testConnection: (p: LockProvider) => Promise<void>;
}

function defaults(): Record<LockProvider, LockProviderConfig> {
  const base = (): LockProviderConfig => ({
    enabled: false,
    apiKey: '',
    apiSecret: '',
    accountEmail: '',
    webhookUrl: 'https://horizon-pms.ru/api/webhooks/locks',
    status: 'disconnected',
  });
  return {
    ttlock: base(),
    igloohome: base(),
    salto: base(),
    nuki: base(),
  };
}

export const useLockIntegrations = create<State>()(
  persist(
    (set, get) => ({
      providers: defaults(),
      update: (p, patch) => set((s) => ({
        providers: { ...s.providers, [p]: { ...s.providers[p], ...patch } },
      })),
      testConnection: async (p) => {
        const cfg = get().providers[p];
        if (!cfg.apiKey || !cfg.apiSecret) {
          set((s) => ({ providers: { ...s.providers, [p]: { ...s.providers[p], status: 'error', message: 'Заполните API-ключ и секрет' } } }));
          return;
        }
        // Мок-проверка
        await new Promise((r) => setTimeout(r, 800));
        const ok = cfg.apiKey.length > 5 && cfg.apiSecret.length > 5;
        set((s) => ({
          providers: {
            ...s.providers,
            [p]: {
              ...s.providers[p],
              status: ok ? 'connected' : 'error',
              message: ok ? 'Соединение установлено (мок)' : 'Неверные креды',
              lastSyncAt: ok ? new Date().toISOString() : s.providers[p].lastSyncAt,
            },
          },
        }));
      },
    }),
    { name: 'horizon-lock-integrations' },
  ),
);
