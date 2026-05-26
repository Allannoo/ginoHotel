// Стор аутентификации и команды (директор + подчинённые)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PermissionKey, UserRole } from '@/types';

// Полный набор прав по умолчанию (для админа/директора)
export const ALL_PERMISSIONS: PermissionKey[] = [
  'dashboard', 'grid', 'properties', 'channels',
  'guests', 'finance', 'tasks', 'settings', 'team',
  'pricing', 'expenses', 'roomservice', 'locks', 'mvd', 'reports',
];

// Базовый набор прав на роль (когда добавляется новый пользователь)
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [...ALL_PERMISSIONS],
  manager: ['dashboard', 'grid', 'properties', 'guests', 'tasks', 'finance', 'pricing', 'expenses', 'roomservice', 'mvd', 'reports'],
  reception: ['dashboard', 'grid', 'guests', 'tasks', 'roomservice', 'locks', 'mvd'],
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
  reports: 'Отчёты / Аналитика',
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
  addMember: (data: { name: string; email: string; role: UserRole; permissions?: PermissionKey[]; password?: string }) => User;
  updateMember: (id: string, patch: Partial<User>) => void;
  removeMember: (id: string) => void;
  togglePermission: (id: string, perm: PermissionKey) => void;
  // Сбрасывает пароль сотрудника, возвращает новый пароль (показать админу один раз)
  resetPassword: (id: string) => string;
}

const newId = () => `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// Генератор временного пароля. 10 символов из алфавита без похожих символов (0/O, 1/l/I).
// Для мок-режима этого достаточно; в проде пароль сохранялся бы хешем на бэке.
export function generatePassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// ===== Демо-аккаунт =====
// Сид-пользователь для презентации/партнёрского доступа. Всегда восстанавливается в persist через merge,
// чтобы логин работал даже после очистки хранилища.
export const DEMO_USER: User = {
  id: 'u_demo',
  name: 'Демо-директор',
  email: 'demo@horizon-pms.ru',
  role: 'admin',
  active: true,
  password: 'Demo2026!',
  ownerId: 'u_demo',
  permissions: [...ALL_PERMISSIONS],
  createdAt: new Date(0).toISOString(),
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      team: [DEMO_USER],

      login: (email, password, name) => {
        const existing = get().team.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          // Если у пользователя выставлен пароль — валидируем его.
          if (existing.password && existing.password !== password) {
            throw new Error('Неверный пароль');
          }
          // Бэкфилл: у директора ownerId должен указывать на самого себя,
          // чтобы фильтрация команды по владельцу работала для старых аккаунтов.
          if (existing.role === 'admin' && !existing.ownerId) {
            set((s) => ({
              team: s.team.map((u) => (u.id === existing.id ? { ...u, ownerId: existing.id } : u)),
              currentUserId: existing.id,
            }));
          } else {
            set({ currentUserId: existing.id });
          }
          return existing;
        }
        // Если пользователя нет — создаём как директора (первый вход)
        const id = newId();
        const created: User = {
          id,
          name: name || email.split('@')[0],
          email,
          role: 'admin',
          active: true,
          password,
          ownerId: id, // директор — владелец самого себя
          permissions: [...ALL_PERMISSIONS],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ team: [created, ...s.team], currentUserId: created.id }));
        return created;
      },

      register: ({ name, email, password }) => {
        const id = newId();
        const created: User = {
          id,
          name,
          email,
          role: 'admin',
          active: true,
          password,
          ownerId: id, // директор — владелец самого себя
          permissions: [...ALL_PERMISSIONS],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ team: [created, ...s.team], currentUserId: created.id }));
        return created;
      },

      logout: () => set({ currentUserId: null }),

      addMember: ({ name, email, role, permissions, password }) => {
        const owner = get().currentUserId;
        const member: User = {
          id: newId(),
          name,
          email,
          role,
          active: true,
          ownerId: owner ?? undefined,
          // Если админ не указал пароль — генерируем временный, чтобы сотрудник мог войти.
          password: password && password.trim() ? password.trim() : generatePassword(),
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

      resetPassword: (id) => {
        const newPwd = generatePassword();
        set((s) => ({
          team: s.team.map((u) => (u.id === id ? { ...u, password: newPwd } : u)),
        }));
        return newPwd;
      },
    }),
    {
      name: 'horizon-auth',
      version: 2,
      // При регидратации всегда гарантируем наличие демо-аккаунта
      merge: (persisted, current) => {
        const p = (persisted as Partial<AuthState>) ?? {};
        const team = p.team ?? [];
        const hasDemo = team.some((u) => u.email.toLowerCase() === DEMO_USER.email);
        return {
          ...current,
          ...p,
          team: hasDemo ? team : [DEMO_USER, ...team],
        } as AuthState;
      },
    },
  ),
);

// ===================== Импersonation (просмотр от лица другой роли) =====================
// Используется в шапке: «Смотреть как директор / менеджер / ресепшен / уборка».
// Это ВРЕМЕННЫЙ предпросмотр, который меняет только то, что видит интерфейс — все правки
// остаются от настоящего пользователя. Сбрасывается при перезагрузке.
type ImpersonationState = {
  role: UserRole | null;
  setRole: (r: UserRole | null) => void;
};
export const useImpersonation = create<ImpersonationState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));

// Хелпер: список ID пользователей, принадлежащих текущему аккаунту-директору.
// Каждый зарегистрированный директор владеет самим собой (ownerId === id) и сотрудниками,
// которых он добавил. Это изолирует команды разных аккаунтов в общем persist-хранилище.
export function useOwnedTeam(): User[] {
  return useAuth((s) => {
    const current = s.team.find((u) => u.id === s.currentUserId);
    if (!current) return [];
    // Корень владения: для директора — он сам; для подчинённого — его директор
    const ownerId = current.role === 'admin' ? current.id : current.ownerId;
    if (!ownerId) return [current];
    return s.team.filter((u) => u.id === ownerId || u.ownerId === ownerId);
  });
}

// Хелпер: текущий пользователь (с учётом просмотра от лица другой роли)
export function useCurrentUser(): User | null {
  const base = useAuth((s) => s.team.find((u) => u.id === s.currentUserId) ?? null);
  const imp = useImpersonation((s) => s.role);
  if (!base) return null;
  if (!imp || imp === base.role) return base;
  // Подменяем роль и подсчитываем доступы по дефолту для этой роли
  return {
    ...base,
    role: imp,
    permissions: imp === 'admin' ? [...ALL_PERMISSIONS] : [...DEFAULT_ROLE_PERMISSIONS[imp]],
  };
}

// Хелпер проверки прав
export function useHasPermission(perm: PermissionKey): boolean {
  const user = useCurrentUser();
  if (!user) return false;
  return user.role === 'admin' || user.permissions.includes(perm);
}
