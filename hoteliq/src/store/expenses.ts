// Стор расходов / OPEX
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, ExpenseCategory } from '@/types';

// Сид: 24 типичных расхода за последний квартал
const seedExpenses: Expense[] = [
  { id: 'e-1', date: '2025-10-05', category: 'salary', description: 'ФОТ октябрь, ресепшен', amount: 285000, propertyId: 'shared', vendor: 'Штат', createdAt: '2025-10-05T10:00:00Z' },
  { id: 'e-2', date: '2025-10-05', category: 'salary', description: 'ФОТ октябрь, горничные', amount: 198000, propertyId: 'shared', vendor: 'Штат', createdAt: '2025-10-05T10:00:00Z' },
  { id: 'e-3', date: '2025-10-08', category: 'utilities', description: 'Электроэнергия', amount: 47200, propertyId: 'prop_h1', vendor: 'Севкавказэнерго', createdAt: '2025-10-08T11:00:00Z' },
  { id: 'e-4', date: '2025-10-08', category: 'utilities', description: 'Газ', amount: 18400, propertyId: 'prop_h1', vendor: 'Газпром МРГ', createdAt: '2025-10-08T11:00:00Z' },
  { id: 'e-5', date: '2025-10-10', category: 'laundry', description: 'Стирка постельного белья', amount: 32500, propertyId: 'prop_h1', vendor: 'Чистый Кавказ', createdAt: '2025-10-10T09:00:00Z' },
  { id: 'e-6', date: '2025-10-12', category: 'supplies', description: 'Шампуни, мыло, полотенца', amount: 24800, propertyId: 'shared', vendor: 'Hotel Pro', createdAt: '2025-10-12T14:00:00Z' },
  { id: 'e-7', date: '2025-10-15', category: 'maintenance', description: 'Ремонт кондиционера №306', amount: 14500, propertyId: 'prop_h1', vendor: 'Климат-Сервис', createdAt: '2025-10-15T16:00:00Z' },
  { id: 'e-8', date: '2025-10-18', category: 'marketing', description: 'Контекстная реклама, Yandex Direct', amount: 38000, propertyId: 'shared', vendor: 'Яндекс', createdAt: '2025-10-18T12:00:00Z' },
  { id: 'e-9', date: '2025-10-20', category: 'food', description: 'Продукты для завтраков', amount: 56400, propertyId: 'prop_h1', vendor: 'Магнит-Опт', createdAt: '2025-10-20T08:00:00Z' },
  { id: 'e-10', date: '2025-10-25', category: 'commission', description: 'Комиссия Островок октябрь', amount: 87600, propertyId: 'shared', vendor: 'Островок', createdAt: '2025-10-25T18:00:00Z' },
  { id: 'e-11', date: '2025-10-28', category: 'rent', description: 'Аренда корпуса', amount: 320000, propertyId: 'prop_h2', vendor: 'ИП Дзагоев', createdAt: '2025-10-28T10:00:00Z' },
  { id: 'e-12', date: '2025-10-30', category: 'depreciation', description: 'Амортизация мебели', amount: 42000, propertyId: 'shared', vendor: '—', createdAt: '2025-10-30T23:59:00Z' },
  { id: 'e-13', date: '2025-11-01', category: 'salary', description: 'ФОТ ноябрь, аванс', amount: 230000, propertyId: 'shared', vendor: 'Штат', createdAt: '2025-11-01T10:00:00Z' },
  { id: 'e-14', date: '2025-11-05', category: 'utilities', description: 'Электроэнергия', amount: 51400, propertyId: 'prop_h1', vendor: 'Севкавказэнерго', createdAt: '2025-11-05T11:00:00Z' },
  { id: 'e-15', date: '2025-11-07', category: 'laundry', description: 'Стирка ноябрь', amount: 35200, propertyId: 'prop_h1', vendor: 'Чистый Кавказ', createdAt: '2025-11-07T09:00:00Z' },
  { id: 'e-16', date: '2025-11-10', category: 'insurance', description: 'Страховка ответственности', amount: 24000, propertyId: 'shared', vendor: 'Ингосстрах', createdAt: '2025-11-10T13:00:00Z' },
  { id: 'e-17', date: '2025-11-12', category: 'taxes', description: 'УСН за III квартал', amount: 184500, propertyId: 'shared', vendor: 'ФНС', createdAt: '2025-11-12T15:00:00Z' },
  { id: 'e-18', date: '2025-11-15', category: 'maintenance', description: 'Покраска фасада', amount: 78000, propertyId: 'prop_h2', vendor: 'РемСтройКавказ', createdAt: '2025-11-15T10:00:00Z' },
  { id: 'e-19', date: '2025-11-20', category: 'supplies', description: 'Канцелярия и расходники', amount: 9400, propertyId: 'shared', vendor: 'Комус', createdAt: '2025-11-20T11:00:00Z' },
  { id: 'e-20', date: '2025-11-22', category: 'food', description: 'Продукты для завтраков', amount: 61200, propertyId: 'prop_h1', vendor: 'Магнит-Опт', createdAt: '2025-11-22T08:00:00Z' },
  { id: 'e-21', date: '2025-11-25', category: 'commission', description: 'Комиссия Яндекс.Путешествия', amount: 64300, propertyId: 'shared', vendor: 'Яндекс', createdAt: '2025-11-25T18:00:00Z' },
  { id: 'e-22', date: '2025-11-28', category: 'marketing', description: 'Контент-съёмка номеров', amount: 45000, propertyId: 'prop_h2', vendor: 'Фотостудия Vlz', createdAt: '2025-11-28T14:00:00Z' },
  { id: 'e-23', date: '2025-11-30', category: 'depreciation', description: 'Амортизация техники', amount: 38500, propertyId: 'shared', vendor: '—', createdAt: '2025-11-30T23:59:00Z' },
  { id: 'e-24', date: '2025-11-30', category: 'other', description: 'Прочие операционные', amount: 12400, propertyId: 'shared', vendor: '—', createdAt: '2025-11-30T23:59:00Z' },
];

interface ExpensesState {
  expenses: Expense[];
  hydrated: boolean;
  addExpense: (e: Expense) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  resetToMock: () => void;
}

export const useExpenses = create<ExpensesState>()(
  persist(
    (set) => ({
      expenses: seedExpenses,
      hydrated: false,
      addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      resetToMock: () => set({ expenses: seedExpenses }),
    }),
    {
      name: 'ginohotel-expenses',
      onRehydrateStorage: () => (state) => { if (state) state.hydrated = true; },
    }
  )
);

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  salary: 'Зарплата / ФОТ',
  utilities: 'Коммуналка',
  laundry: 'Прачечная',
  cleaning: 'Уборка',
  maintenance: 'Ремонт',
  supplies: 'Расходники',
  marketing: 'Маркетинг',
  taxes: 'Налоги',
  insurance: 'Страховка',
  rent: 'Аренда',
  food: 'Продукты',
  commission: 'Комиссии каналов',
  depreciation: 'Амортизация',
  other: 'Прочее',
};

