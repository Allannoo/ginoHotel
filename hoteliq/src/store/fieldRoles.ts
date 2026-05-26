// Доступ к чувствительным полям по ролям (мок).
// Включил поле → роль видит данные, выключил → '***'.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types';

export type SensitiveField =
  | 'guest.phone'
  | 'guest.email'
  | 'guest.passport'
  | 'booking.amount'
  | 'finance.pnl'
  | 'team.salary'
  | 'lock.master-code';

export const SENSITIVE_FIELD_LABEL: Record<SensitiveField, string> = {
  'guest.phone': 'Телефон гостя',
  'guest.email': 'Email гостя',
  'guest.passport': 'Паспортные данные',
  'booking.amount': 'Сумма брони',
  'finance.pnl': 'P&L и выручка',
  'team.salary': 'Зарплаты сотрудников',
  'lock.master-code': 'Мастер-код замка',
};

type Matrix = Record<SensitiveField, UserRole[]>;

const DEFAULT_MATRIX: Matrix = {
  'guest.phone':        ['admin', 'manager', 'reception'],
  'guest.email':        ['admin', 'manager', 'reception'],
  'guest.passport':     ['admin', 'manager', 'reception'],
  'booking.amount':     ['admin', 'manager'],
  'finance.pnl':        ['admin'],
  'team.salary':        ['admin'],
  'lock.master-code':   ['admin'],
};

interface FieldRolesState {
  matrix: Matrix;
  toggle: (field: SensitiveField, role: UserRole) => void;
  canSee: (field: SensitiveField, role: UserRole) => boolean;
  reset: () => void;
}

export const useFieldRoles = create<FieldRolesState>()(
  persist(
    (set, get) => ({
      matrix: DEFAULT_MATRIX,
      toggle: (field, role) => set((s) => {
        const cur = s.matrix[field];
        const has = cur.includes(role);
        return {
          matrix: {
            ...s.matrix,
            [field]: has ? cur.filter((r) => r !== role) : [...cur, role],
          },
        };
      }),
      canSee: (field, role) => get().matrix[field]?.includes(role) ?? false,
      reset: () => set({ matrix: DEFAULT_MATRIX }),
    }),
    { name: 'horizon-field-roles' },
  ),
);
