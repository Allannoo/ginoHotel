// Локализованные ярлыки для доменных enum-значений
import type { RoomCategory, RoomStatus, BookingStatus, Channel, PropertyType } from '@/types';

export const ROOM_CATEGORY_LABEL: Record<RoomCategory, string> = {
  Standard: 'Стандарт',
  Deluxe: 'Делюкс',
  Suite: 'Люкс',
  Family: 'Семейный',
  Studio: 'Студия',
};

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  clean: 'Готов',
  dirty: 'Уборка',
  occupied: 'Занят',
  inspection: 'Проверка',
  maintenance: 'Ремонт',
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Подтверждено',
  pending: 'Ожидание',
  checkin: 'Заезд',
  checkout: 'Выезд',
  blocked: 'Блок',
  cancelled: 'Отмена',
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  ostrovok: 'Островок',
  yandex: 'Яндекс.Путешествия',
  sutochno: 'Суточно.ру',
  otello: 'Отелло',
  '101hotels': '101Hotels',
  avito: 'Авито',
  direct: 'Прямая бронь',
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  hotel: 'Отель',
  apartment: 'Квартира / Апартаменты',
  house: 'Дом / Коттедж',
};

// Полные русские названия месяцев (родительный падеж: «3 мая»)
export const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Именительный падеж: «Май 2026»
export const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

// Короткие: «Янв»
export const MONTHS_SHORT = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
];

// «3 мая 2026»
export const fmtDateLong = (d: Date) => `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()}`;
