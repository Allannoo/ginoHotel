// Стор темы: light/dark с persist в localStorage
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      set: (t) => set({ theme: t }),
    }),
    { name: 'horizon-theme' },
  ),
);

// Провайдер синхронизирует класс на <html>
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [theme]);
  return <>{children}</>;
}
