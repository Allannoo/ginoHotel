// Конструктор отчётов + планировщик рассылки (мок).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReportField =
  | 'bookings.count'
  | 'bookings.amount'
  | 'bookings.adr'      // средняя цена ночи
  | 'bookings.nights'
  | 'occupancy'
  | 'guests.new'
  | 'guests.returning'
  | 'cancellations'
  | 'revenue.gross'
  | 'revenue.net'
  | 'commissions'
  | 'expenses'
  | 'profit';

export const REPORT_FIELD_LABEL: Record<ReportField, string> = {
  'bookings.count': 'Кол-во броней',
  'bookings.amount': 'Сумма броней',
  'bookings.adr': 'Средняя цена ночи (ADR)',
  'bookings.nights': 'Проданных ночей',
  'occupancy': 'Загрузка, %',
  'guests.new': 'Новых гостей',
  'guests.returning': 'Возвратных гостей',
  'cancellations': 'Отмены',
  'revenue.gross': 'Выручка валовая',
  'revenue.net': 'Выручка чистая',
  'commissions': 'Комиссии каналов',
  'expenses': 'Расходы',
  'profit': 'Прибыль',
};

export type GroupBy = 'day' | 'week' | 'month' | 'channel' | 'property' | 'room-category' | 'none';
export const GROUP_BY_LABEL: Record<GroupBy, string> = {
  day: 'По дням',
  week: 'По неделям',
  month: 'По месяцам',
  channel: 'По каналам',
  property: 'По объектам',
  'room-category': 'По категориям номеров',
  none: 'Без группировки',
};

export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'kpi';
export const CHART_TYPE_LABEL: Record<ChartType, string> = {
  table: 'Таблица',
  bar: 'Столбцы',
  line: 'Линия',
  pie: 'Круг',
  kpi: 'KPI-карточки',
};

export type Frequency = 'daily' | 'weekly' | 'monthly';
export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: 'Ежедневно (09:00)',
  weekly: 'Еженедельно (Пн 09:00)',
  monthly: 'Ежемесячно (1-го 09:00)',
};

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  fields: ReportField[];
  groupBy: GroupBy;
  chart: ChartType;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    channel?: string;
    propertyId?: string;
    status?: string;
  };
  createdAt: string;
}

export interface ScheduledReport {
  id: string;
  reportId: string;
  recipients: string[]; // email
  frequency: Frequency;
  enabled: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
}

interface State {
  reports: SavedReport[];
  scheduled: ScheduledReport[];
  saveReport: (r: Omit<SavedReport, 'id' | 'createdAt'>) => SavedReport;
  removeReport: (id: string) => void;
  schedule: (s: Omit<ScheduledReport, 'id'>) => void;
  toggleSchedule: (id: string) => void;
  removeSchedule: (id: string) => void;
  runNow: (id: string) => void;
}

function seed(): { reports: SavedReport[]; scheduled: ScheduledReport[] } {
  const r1: SavedReport = {
    id: 'rep_demo_revenue',
    name: 'Выручка по каналам · месяц',
    description: 'Сравнение Островок, Яндекс, Авито, прямые',
    fields: ['bookings.count', 'revenue.gross', 'commissions', 'revenue.net'],
    groupBy: 'channel',
    chart: 'bar',
    filters: {},
    createdAt: new Date().toISOString(),
  };
  const r2: SavedReport = {
    id: 'rep_demo_occupancy',
    name: 'Загрузка по объектам',
    fields: ['occupancy', 'bookings.nights', 'bookings.adr'],
    groupBy: 'property',
    chart: 'table',
    filters: {},
    createdAt: new Date().toISOString(),
  };
  return {
    reports: [r1, r2],
    scheduled: [
      {
        id: 'sch_demo_1',
        reportId: r1.id,
        recipients: ['director@ginohotel.ru'],
        frequency: 'weekly',
        enabled: true,
        nextRunAt: new Date(Date.now() + 86400_000).toISOString(),
      },
    ],
  };
}

export const useReports = create<State>()(
  persist(
    (set) => ({
      ...seed(),
      saveReport: (r) => {
        const newR: SavedReport = { ...r, id: `rep_${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
        set((s) => ({ reports: [newR, ...s.reports] }));
        return newR;
      },
      removeReport: (id) => set((s) => ({
        reports: s.reports.filter((r) => r.id !== id),
        scheduled: s.scheduled.filter((x) => x.reportId !== id),
      })),
      schedule: (sc) => set((s) => ({ scheduled: [{ ...sc, id: `sch_${Date.now().toString(36)}` }, ...s.scheduled] })),
      toggleSchedule: (id) => set((s) => ({ scheduled: s.scheduled.map((x) => x.id === id ? { ...x, enabled: !x.enabled } : x) })),
      removeSchedule: (id) => set((s) => ({ scheduled: s.scheduled.filter((x) => x.id !== id) })),
      runNow: (id) => set((s) => ({ scheduled: s.scheduled.map((x) => x.id === id ? { ...x, lastRunAt: new Date().toISOString() } : x) })),
    }),
    { name: 'ginohotel-reports' },
  ),
);
