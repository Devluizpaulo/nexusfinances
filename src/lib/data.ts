import { subMonths, formatISO } from 'date-fns';
import type { Transaction, Debt } from './types';

const now = new Date();

export const mockTransactions: Transaction[] = [
  // Income
  { id: '1', type: 'income', amount: 4500, date: formatISO(subMonths(now, 2)), description: 'Monthly Salary', category: 'Salary', isRecurring: true },
  { id: '2', type: 'income', amount: 4500, date: formatISO(subMonths(now, 1)), description: 'Monthly Salary', category: 'Salary', isRecurring: true },
  { id: '3', type: 'income', amount: 4500, date: formatISO(now), description: 'Monthly Salary', category: 'Salary', isRecurring: true },
  { id: '4', type: 'income', amount: 750, date: formatISO(subMonths(now, 1)), description: 'Freelance Project', category: 'Freelance', isRecurring: false },

  // Expenses
  { id: '5', type: 'expense', amount: 1200, date: formatISO(subMonths(now, 2)), description: 'Rent', category: 'Rent/Mortgage', isRecurring: true },
  { id: '6', type: 'expense', amount: 1200, date: formatISO(subMonths(now, 1)), description: 'Rent', category: 'Rent/Mortgage', isRecurring: true },
  { id: '7', type: 'expense', amount: 1200, date: formatISO(now), description: 'Rent', category: 'Rent/Mortgage', isRecurring: true },
  { id: '8', type: 'expense', amount: 450, date: formatISO(subMonths(now, 1)), description: 'Groceries', category: 'Groceries', isRecurring: false },
  { id: '9', type: 'expense', amount: 150, date: formatISO(subMonths(now, 1)), description: 'Utilities', category: 'Utilities', isRecurring: true },
  { id: '10', type: 'expense', amount: 80, date: formatISO(subMonths(now, 1)), description: 'Dinner with friends', category: 'Entertainment', isRecurring: false },
  { id: '11', type: 'expense', amount: 15.99, date: formatISO(subMonths(now, 1)), description: 'Streaming Service', category: 'Subscriptions', isRecurring: true },
  { id: '12', type: 'expense', amount: 480, date: formatISO(now), description: 'Groceries', category: 'Groceries', isRecurring: false },
  { id: '13', type: 'expense', amount: 160, date: formatISO(now), description: 'Utilities', category: 'Utilities', isRecurring: true },
  { id: '14', type: 'expense', amount: 15.99, date: formatISO(now), description: 'Streaming Service', category: 'Subscriptions', isRecurring: true },
  { id: '15', type: 'expense', amount: 250, date: formatISO(now), description: 'New shoes', category: 'Shopping', isRecurring: false },
];

export const mockDebts: Debt[] = [
  {
    id: 'd1',
    name: 'Car Loan',
    totalAmount: 20000,
    paidAmount: 8000,
    creditor: 'Auto Credit Corp',
    installments: [
      { id: 'i1', debtId: 'd1', installmentNumber: 1, amount: 400, dueDate: formatISO(subMonths(now, 2)), status: 'paid' },
      { id: 'i2', debtId: 'd1', installmentNumber: 2, amount: 400, dueDate: formatISO(subMonths(now, 1)), status: 'paid' },
      { id: 'i3', debtId: 'd1', installmentNumber: 3, amount: 400, dueDate: formatISO(now), status: 'unpaid' },
    ],
  },
  {
    id: 'd2',
    name: 'Student Loan',
    totalAmount: 50000,
    paidAmount: 5000,
    creditor: 'Federal Loans',
    installments: [
        { id: 'i4', debtId: 'd2', installmentNumber: 1, amount: 250, dueDate: formatISO(subMonths(now, 2)), status: 'paid' },
        { id: 'i5', debtId: 'd2', installmentNumber: 2, amount: 250, dueDate: formatISO(subMonths(now, 1)), status: 'paid' },
        { id: 'i6', debtId: 'd2', installmentNumber: 3, amount: 250, dueDate: formatISO(now), status: 'unpaid' },
    ],
  },
];
