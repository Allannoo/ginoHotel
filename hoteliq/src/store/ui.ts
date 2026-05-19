// UI-стор: состояние сайдбара, командной палитры, drawer-меню на мобильном
import { create } from 'zustand';

interface UiStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileDrawerOpen: boolean;
  setMobileDrawer: (open: boolean) => void;
  cmdkOpen: boolean;
  setCmdk: (open: boolean) => void;
  onboardingDone: boolean;
  finishOnboarding: () => void;
}

const storageGet = (k: string, def: boolean) =>
  typeof localStorage !== 'undefined' && localStorage.getItem(k) === '1' ? true : def;
const storageSet = (k: string, v: boolean) => {
  try { localStorage.setItem(k, v ? '1' : '0'); } catch {}
};

export const useUi = create<UiStore>((set, get) => ({
  sidebarCollapsed: storageGet('ginohotel.sidebar', false),
  toggleSidebar: () => {
    const v = !get().sidebarCollapsed;
    storageSet('ginohotel.sidebar', v);
    set({ sidebarCollapsed: v });
  },
  mobileDrawerOpen: false,
  setMobileDrawer: (open) => set({ mobileDrawerOpen: open }),
  cmdkOpen: false,
  setCmdk: (open) => set({ cmdkOpen: open }),
  onboardingDone: storageGet('ginohotel.onboarding', false),
  finishOnboarding: () => {
    storageSet('ginohotel.onboarding', true);
    set({ onboardingDone: true });
  },
}));
