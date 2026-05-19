// Утилиты форматирования и хелперы
import clsx, { type ClassValue } from 'clsx';

// Сокращённое имя для объединения классов Tailwind
export const cn = (...inputs: ClassValue[]) => clsx(inputs);

// Форматирование суммы в рублях
export const fmtMoney = (v: number, opts?: { compact?: boolean }) => {
  if (opts?.compact && v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₽`;
  if (opts?.compact && v >= 1_000) return `${(v / 1_000).toFixed(0)} тыс ₽`;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
  }).format(v);
};

// Форматирование числа
export const fmtNum = (v: number) => new Intl.NumberFormat('ru-RU').format(v);

// Форматирование процентов
export const fmtPct = (v: number) => `${v.toFixed(0)}%`;

// Короткая дата
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

// Текстовая дата "5 мая"
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export const fmtDateShort = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

// Кол-во дней между датами
export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
