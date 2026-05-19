import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtPct, fmtNum, fmtDate, fmtDateShort, daysBetween } from './format';

describe('fmtMoney', () => {
  it('форматирует обычные суммы в рублях', () => {
    expect(fmtMoney(1500)).toContain('1');
    expect(fmtMoney(1500)).toContain('₽');
  });
  it('compact > 1 млн', () => {
    expect(fmtMoney(2_500_000, { compact: true })).toBe('2.5 млн ₽');
  });
  it('compact от 1 тыс', () => {
    expect(fmtMoney(15_000, { compact: true })).toBe('15 тыс ₽');
  });
});

describe('fmtPct/fmtNum', () => {
  it('процент целое', () => {
    expect(fmtPct(76.4)).toBe('76%');
  });
  it('число с разделителями', () => {
    expect(fmtNum(1234567)).toMatch(/1.234.567/);
  });
});

describe('fmtDate', () => {
  it('формат DD.MM.YYYY', () => {
    expect(fmtDate('2025-10-05')).toBe('05.10.2025');
  });
});

describe('fmtDateShort + daysBetween', () => {
  it('короткая дата', () => {
    expect(fmtDateShort('2025-05-10')).toContain('мая');
  });
  it('дни между датами', () => {
    expect(daysBetween('2025-10-01', '2025-10-05')).toBe(4);
  });
});
