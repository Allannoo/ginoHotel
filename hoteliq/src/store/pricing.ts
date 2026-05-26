// Стор: правила ценообразования и прогнозы RMS
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PricingRule, PricingForecast, PaceEntry } from '@/types';
import { properties as seedProperties } from '@/mock/data';

// Детерминированная псевдо-случайность
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Сгенерировать прогноз на 365 дней для всех объектов (отели + апартаменты) */
function makeForecast(): PricingForecast[] {
  const out: PricingForecast[] = [];
  const items = seedProperties; // все объекты: отели + апартаменты
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const p of items) {
    const rnd = seeded(p.id.length * 131 + p.rooms);
    // Для апартаментов база ниже — это короткий съём
    const baseFactor = p.type === 'hotel' ? 1 : 0.55;
    const basePrice = Math.round((4500 + (p.id.charCodeAt(p.id.length - 1) % 10) * 700) * baseFactor);
    for (let d = 0; d < 365; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const iso = date.toISOString().slice(0, 10);
      const dow = date.getDay();
      const month = date.getMonth();

      // сезонность
      const seasonBoost = month === 6 || month === 7 || month === 11 ? 1.25 : month === 5 || month === 8 || month === 0 ? 1.1 : 1.0;
      const weekendBoost = dow === 5 || dow === 6 ? 1.15 : 1.0;
      const noise = 0.9 + rnd() * 0.25;

      const demand = Math.round(40 + 60 * (rnd() * 0.5 + (seasonBoost - 1) * 2 + (weekendBoost - 1) * 1.5));
      const forecastOccupancy = Math.max(20, Math.min(99, demand));
      const currentPrice = Math.round(basePrice * weekendBoost * noise);
      const recommendedPrice = Math.round(basePrice * seasonBoost * weekendBoost * (forecastOccupancy > 80 ? 1.18 : forecastOccupancy < 50 ? 0.85 : 1.0));
      const competitorAvg = Math.round(recommendedPrice * (0.92 + rnd() * 0.18));

      out.push({
        date: iso,
        propertyId: p.id,
        forecastOccupancy,
        currentPrice,
        recommendedPrice,
        competitorAvg,
        demandIndex: Math.min(100, demand),
      });
    }
  }
  return out;
}

/** Pace / Pickup: что наброниро­вано по неделям */
function makePace(): PaceEntry[] {
  const out: PaceEntry[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rnd = seeded(17);
  for (let w = 0; w < 12; w++) {
    const d = new Date(today);
    d.setDate(d.getDate() + w * 7);
    const onBook = Math.round(80 + rnd() * 50 - w * 2);
    const prev = Math.round(onBook * (0.85 + rnd() * 0.2));
    const final = Math.round(prev * (1.15 + rnd() * 0.2));
    out.push({
      date: d.toISOString().slice(0, 10),
      bookingsOnBook: Math.max(20, onBook),
      prevYearOnBook: Math.max(15, prev),
      finalLastYear: Math.max(40, final),
    });
  }
  return out;
}

const seedForecast = makeForecast();
const seedPace = makePace();

const seedRules: PricingRule[] = [
  { id: 'r-1', propertyId: 'all', name: 'Загрузка >85% — поднять цену', condition: 'occupancy-above', threshold: 85, action: 'increase', amount: 15, enabled: true, priority: 1 },
  { id: 'r-2', propertyId: 'all', name: 'Загрузка <40% — скидка', condition: 'occupancy-below', threshold: 40, action: 'decrease', amount: 12, enabled: true, priority: 2 },
  { id: 'r-3', propertyId: 'all', name: 'За 3 дня до заезда — minus 10%', condition: 'days-ahead', threshold: 3, action: 'decrease', amount: 10, enabled: false, priority: 3 },
  { id: 'r-4', propertyId: 'all', name: 'Выходные +20%', condition: 'weekend', threshold: 0, action: 'increase', amount: 20, enabled: true, priority: 4 },
  { id: 'r-5', propertyId: 'all', name: 'Высокий сезон +25%', condition: 'season', threshold: 0, action: 'increase', amount: 25, enabled: true, priority: 5 },
];

interface PricingState {
  rules: PricingRule[];
  forecast: PricingForecast[];
  pace: PaceEntry[];
  hydrated: boolean;
  toggleRule: (id: string) => void;
  addRule: (r: PricingRule) => void;
  updateRule: (id: string, patch: Partial<PricingRule>) => void;
  removeRule: (id: string) => void;
  applyRecommendations: (propertyId: string, days: number) => number; // сколько применено
}

export const usePricing = create<PricingState>()(
  persist(
    (set, get) => ({
      rules: seedRules,
      forecast: seedForecast,
      pace: seedPace,
      hydrated: false,
      toggleRule: (id) => set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) })),
      addRule: (r) => set((s) => ({ rules: [...s.rules, r] })),
      updateRule: (id, patch) => set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      applyRecommendations: (propertyId, days) => {
        const today = new Date().toISOString().slice(0, 10);
        let applied = 0;
        set((s) => {
          const next = s.forecast.map((f) => {
            if (f.propertyId !== propertyId) return f;
            if (f.date < today) return f;
            const dayIdx = (new Date(f.date).getTime() - new Date(today).getTime()) / (24 * 3600 * 1000);
            if (dayIdx > days) return f;
            applied += 1;
            return { ...f, currentPrice: f.recommendedPrice };
          });
          return { forecast: next };
        });
        // подавить unused warning
        void get;
        return applied;
      },
    }),
    {
      name: 'horizon-pricing',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);
