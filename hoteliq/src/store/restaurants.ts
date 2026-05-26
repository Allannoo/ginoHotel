// Стор: ресторанов и блюд (CRUD меню). Сидируется из mock/restaurants.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RESTAURANTS as seed } from '@/mock/restaurants';
import type { Restaurant, RestaurantMenuItem } from '@/types';

interface RestaurantsState {
  restaurants: Restaurant[];
  hydrated: boolean;
  // Меню
  addMenuItem: (restaurantId: string, item: RestaurantMenuItem) => void;
  updateMenuItem: (restaurantId: string, itemId: string, patch: Partial<RestaurantMenuItem>) => void;
  removeMenuItem: (restaurantId: string, itemId: string) => void;
  // Сам ресторан
  updateRestaurant: (id: string, patch: Partial<Restaurant>) => void;
  resetToMock: () => void;
}

export const useRestaurants = create<RestaurantsState>()(
  persist(
    (set) => ({
      restaurants: seed,
      hydrated: false,
      addMenuItem: (rid, item) =>
        set((s) => ({
          restaurants: s.restaurants.map((r) =>
            r.id === rid ? { ...r, menu: [...r.menu, item] } : r
          ),
        })),
      updateMenuItem: (rid, iid, patch) =>
        set((s) => ({
          restaurants: s.restaurants.map((r) =>
            r.id === rid
              ? { ...r, menu: r.menu.map((m) => (m.id === iid ? { ...m, ...patch } : m)) }
              : r
          ),
        })),
      removeMenuItem: (rid, iid) =>
        set((s) => ({
          restaurants: s.restaurants.map((r) =>
            r.id === rid ? { ...r, menu: r.menu.filter((m) => m.id !== iid) } : r
          ),
        })),
      updateRestaurant: (id, patch) =>
        set((s) => ({ restaurants: s.restaurants.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      resetToMock: () => set({ restaurants: seed }),
    }),
    {
      name: 'horizon-restaurants',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);

export const MENU_CATEGORY_LABEL: Record<RestaurantMenuItem['category'], string> = {
  starter: 'Закуска',
  main: 'Основное',
  soup: 'Суп',
  dessert: 'Десерт',
  drink: 'Напиток',
  pie: 'Осетинский пирог',
};
