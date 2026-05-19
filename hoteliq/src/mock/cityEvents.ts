// События города Владикавказ для RMS-модели спроса.
// Каждое событие повышает прогнозную загрузку и рекомендуемую цену.
export type CityEvent = {
  id: string;
  date: string;       // ISO yyyy-mm-dd
  name: string;
  category: 'concert' | 'festival' | 'forum' | 'sport' | 'holiday';
  venue: string;
  impactPct: number;  // +N% к загрузке/цене
  attendance?: number;
};

function addDays(d: Date, n: number): string {
  const x = new Date(d); x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

const today = new Date(); today.setHours(0, 0, 0, 0);

export const cityEvents: CityEvent[] = [
  { id: 'evt_1', date: addDays(today, 3), name: 'Концерт «Алан и братья» — академический театр', category: 'concert', venue: 'Театр им. Тхапсаева', impactPct: 18, attendance: 1200 },
  { id: 'evt_2', date: addDays(today, 7), name: 'Фестиваль аланских традиций', category: 'festival', venue: 'Парк культуры', impactPct: 32, attendance: 8000 },
  { id: 'evt_3', date: addDays(today, 12), name: 'Кавказский экономический форум', category: 'forum', venue: 'Конгресс-холл «Алания»', impactPct: 45, attendance: 2500 },
  { id: 'evt_4', date: addDays(today, 14), name: 'Матч ФК «Алания Владикавказ» — РПЛ', category: 'sport', venue: 'Стадион «Спартак»', impactPct: 24, attendance: 28000 },
  { id: 'evt_5', date: addDays(today, 21), name: 'День города Владикавказа', category: 'holiday', venue: 'Центр города', impactPct: 38, attendance: 15000 },
  { id: 'evt_6', date: addDays(today, 28), name: 'Горный туристический слёт', category: 'sport', venue: 'Цей', impactPct: 22, attendance: 1800 },
  { id: 'evt_7', date: addDays(today, 35), name: 'Фестиваль осетинских пирогов', category: 'festival', venue: 'Площадь Свободы', impactPct: 28, attendance: 5000 },
  { id: 'evt_8', date: addDays(today, 42), name: 'Концерт «Сосо Павлиашвили»', category: 'concert', venue: 'СК «Манеж»', impactPct: 20, attendance: 4000 },
];

export const CITY_EVENT_CATEGORY_LABEL: Record<CityEvent['category'], string> = {
  concert: 'Концерт',
  festival: 'Фестиваль',
  forum: 'Форум',
  sport: 'Спорт',
  holiday: 'Праздник',
};

export const CITY_EVENT_CATEGORY_COLOR: Record<CityEvent['category'], string> = {
  concert: '#a855f7',
  festival: '#ec4899',
  forum: '#3b82f6',
  sport: '#10b981',
  holiday: '#f59e0b',
};
