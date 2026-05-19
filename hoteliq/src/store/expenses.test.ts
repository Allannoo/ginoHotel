import { describe, it, expect, beforeEach } from 'vitest';
import { useExpenses, EXPENSE_CATEGORY_LABEL } from './expenses';
import type { Expense } from '@/types';

const mockExpense = (id: string, amount = 1000): Expense => ({
  id,
  date: '2025-10-05',
  category: 'salary',
  amount,
  description: 'Тест',
  propertyId: 'shared',
  createdAt: '2025-10-05',
  createdBy: 'u1',
});

describe('useExpenses store', () => {
  beforeEach(() => {
    useExpenses.getState().resetToMock();
  });

  it('содержит сид-данные', () => {
    expect(useExpenses.getState().expenses.length).toBeGreaterThan(0);
  });

  it('addExpense увеличивает список', () => {
    const before = useExpenses.getState().expenses.length;
    useExpenses.getState().addExpense(mockExpense('test-x'));
    expect(useExpenses.getState().expenses.length).toBe(before + 1);
  });

  it('removeExpense удаляет по id', () => {
    useExpenses.getState().addExpense(mockExpense('test-y'));
    const before = useExpenses.getState().expenses.length;
    useExpenses.getState().removeExpense('test-y');
    expect(useExpenses.getState().expenses.length).toBe(before - 1);
    expect(useExpenses.getState().expenses.find((e) => e.id === 'test-y')).toBeUndefined();
  });

  it('updateExpense меняет поля', () => {
    useExpenses.getState().addExpense(mockExpense('test-z', 500));
    useExpenses.getState().updateExpense('test-z', { amount: 9999 });
    expect(useExpenses.getState().expenses.find((e) => e.id === 'test-z')?.amount).toBe(9999);
  });

  it('EXPENSE_CATEGORY_LABEL содержит все категории', () => {
    expect(EXPENSE_CATEGORY_LABEL.salary).toBeTruthy();
    expect(EXPENSE_CATEGORY_LABEL.utilities).toBeTruthy();
  });
});
