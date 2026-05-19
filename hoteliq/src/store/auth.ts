// Стор аутентификации и команды (директор + подчинённые)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PermissionKey, UserRole } from '@/types';

// Полный набор прав по умолчанию (для админа/директора)
export const ALL_PERMISSIONS: PermissionKey[] = [
  'dashboard', 'grid', 'properties', 'channels',
  'guests', 'finance', 'tasks', 'settings', 'team',
  'pricing', 'expenses', 'roomservice', 'locks', 'mvd',
];

// Базовый набор прав на роль (когда добавляется новый пользователь)
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [...ALL_PERMISSIONS],
  manager: ['dashboard', 'grid', 'properties', 'guests', 'tasks', 'finance', 'pricing', 'expenses', 'roomservice', 'mvd'],
  reception: ['grid', 'guests', 'tasks', 'roomservice', 'locks', 'mvd'],
  cleaner: ['tasks'],
};

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  dashboard: 'Дашборд',
  grid: 'Календарь броней',
  properties: 'Объекты',
  channels: 'Каналы продаж',
  guests: 'Гости',
  finance: 'Финансы',
  tasks: 'Задачи',
  settings: 'Настройки',
  team: 'Команда',
  pricing: 'Цены / RMS',
  expenses: 'Расходы / OPEX',
  roomservice: 'Доставка в номер',
  locks: 'Электронные замки',
  mvd: 'Отчёты МВД',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Директор',
  manager: 'Менеджер',
  reception: 'Ресепшен',
  cleaner: 'Горничная',
};

interface AuthState {
  currentUserId: string | null;
  team: User[];
  // Действия
  login: (email: string, password: string, name?: string) => User;
  register: (data: { name: string; email: string; password: string }) => User;
  logout: () => void;
  addMember: (data: { name: string; email: string; role: UserRole; permissions?: PermissionKey[] }) => User;
  updateMember: (id: string, patch: Partial<User>) => void;
  removeMember: (id: string) => void;
  togglePermission: (id: string, perm: PermissionKey) => void;
}

const newId = () => `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      team: [],

      login: (email, password, name) => {
        const existing = get().team.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          set({ currentUserId: existing.id });
          return existing;
        }
        // Если пользователя нет — создаём как директора (первый вход)
        const created: User = {
          id: newId(),
          name: name || email.split('@')[0],
          email,
          role: 'admin',
          active: true,
          password,
          permissions: [...ALL_PERMISSIONS],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ team: [created, ...s.team], currentUserId: created.id }));
        return created;
      },

      register: ({ name, email, password }) => {
        const created: User = {
          id: newId(),
          name,
          email,
          role: 'admin',
          active: true,
          password,
          permissions: [...ALL_PERMISSIONS],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ team: [created, ...s.team], currentUserId: created.id }));
        return created;
      },

      logout: () => set({ currentUserId: null }),

      addMember: ({ name, email, role, permissions }) => {
        const owner = get().currentUserId;
        const member: User = {
          id: newId(),
          name,
          email,
          role,
          active: true,
          ownerId: owner ?? undefined,
          permissions: permissions ?? [...DEFAULT_ROLE_PERMISSIONS[role]],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ team: [member, ...s.team] }));
        return member;
      },

      updateMember: (id, patch) => set((s) => ({
        team: s.team.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      })),

      removeMember: (id) => set((s) => ({
        team: s.team.filter((u) => u.id !== id),
      })),

      togglePermission: (id, perm) => set((s) => ({
        team: s.team.map((u) => {
          if (u.id !== id) return u;
          const has = u.permissions.includes(perm);
          return {
            ...u,
            permissions: has ? u.permissions.filter((p) => p !== perm) : [...u.permissions, perm],
          };
        }),
      })),
    }),
    { name: 'ginohotel-auth' },
  ),
);

// Хелпер: текущий пользователь
export function useCurrentUser(): User | null {
  return useAuth((s) => s.team.find((u) => u.id === s.currentUserId) ?? null);
}

// Хелпер проверки прав
export function useHasPermission(perm: PermissionKey): boolean {
  const user = useCurrentUser();
  if (!user) return false;
  return user.role === 'admin' || user.permissions.includes(perm);
}
