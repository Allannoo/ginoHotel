// Аудит-лог действий пользователей (мок, persist в localStorage).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'booking.create'
  | 'booking.update'
  | 'booking.cancel'
  | 'guest.create'
  | 'guest.update'
  | 'payment.add'
  | 'payment.refund'
  | 'pricing.rule.add'
  | 'pricing.rule.update'
  | 'pricing.rule.remove'
  | 'team.member.add'
  | 'team.member.remove'
  | 'team.permission.toggle'
  | 'settings.update'
  | 'lock.code.create'
  | 'lock.code.revoke'
  | 'mvd.submit'
  | 'export';

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  'login': 'Вход',
  'logout': 'Выход',
  'booking.create': 'Создание брони',
  'booking.update': 'Изменение брони',
  'booking.cancel': 'Отмена брони',
  'guest.create': 'Создание гостя',
  'guest.update': 'Изменение гостя',
  'payment.add': 'Внесён платёж',
  'payment.refund': 'Возврат платежа',
  'pricing.rule.add': 'Добавлено правило цен',
  'pricing.rule.update': 'Изменено правило цен',
  'pricing.rule.remove': 'Удалено правило цен',
  'team.member.add': 'Добавлен сотрудник',
  'team.member.remove': 'Удалён сотрудник',
  'team.permission.toggle': 'Изменены права',
  'settings.update': 'Изменены настройки',
  'lock.code.create': 'Создан код замка',
  'lock.code.revoke': 'Отозван код замка',
  'mvd.submit': 'Отправлено в МВД',
  'export': 'Экспорт данных',
};

export interface AuditEntry {
  id: string;
  at: string;          // ISO
  userId?: string;
  userName: string;
  action: AuditAction;
  target?: string;
  details?: string;
  ip?: string;
}

interface AuditState {
  entries: AuditEntry[];
  log: (e: Omit<AuditEntry, 'id' | 'at'>) => void;
  clear: () => void;
}

function seed(): AuditEntry[] {
  const now = Date.now();
  const minutes = (m: number) => new Date(now - m * 60_000).toISOString();
  return [
    { id: 'a1', at: minutes(2), userName: 'Алан Сидаков', action: 'booking.create', target: 'BK-2401', details: 'Двухместный №203 · 2 ночи', ip: '192.168.1.10' },
    { id: 'a2', at: minutes(15), userName: 'Алан Сидаков', action: 'payment.add', target: 'BK-2398', details: '+4 800 ₽ наличными', ip: '192.168.1.10' },
    { id: 'a3', at: minutes(48), userName: 'Мария К.', action: 'guest.update', target: 'Иванов И.', details: 'Обновлены паспортные данные', ip: '192.168.1.22' },
    { id: 'a4', at: minutes(120), userName: 'Алан Сидаков', action: 'pricing.rule.add', target: 'Выходные +15%', ip: '192.168.1.10' },
    { id: 'a5', at: minutes(280), userName: 'Мария К.', action: 'mvd.submit', target: 'BK-2390', details: 'Иностранный гость', ip: '192.168.1.22' },
    { id: 'a6', at: minutes(720), userName: 'Алан Сидаков', action: 'team.member.add', target: 'Анна Г. · Ресепшен', ip: '192.168.1.10' },
    { id: 'a7', at: minutes(1440), userName: 'Алан Сидаков', action: 'login', details: 'Браузер: Chrome · Windows', ip: '192.168.1.10' },
  ];
}

export const useAuditLog = create<AuditState>()(
  persist(
    (set) => ({
      entries: seed(),
      log: (e) => set((s) => ({
        entries: [
          { ...e, id: `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, at: new Date().toISOString() },
          ...s.entries,
        ].slice(0, 500),
      })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'ginohotel-audit' },
  ),
);
