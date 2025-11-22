import { subMonths, formatISO } from 'date-fns';
import type { Transaction, Debt } from './types';

const now = new Date();

export const mockTransactions: Transaction[] = [
  // Rendas
  { id: '1', type: 'income', amount: 4500, date: formatISO(subMonths(now, 2)), description: 'Salário Mensal', category: 'Salário', isRecurring: true, status: 'paid' },
  { id: '2', type: 'income', amount: 4500, date: formatISO(subMonths(now, 1)), description: 'Salário Mensal', category: 'Salário', isRecurring: true, status: 'paid' },
  { id: '3', type: 'income', amount: 4500, date: formatISO(now), description: 'Salário Mensal', category: 'Salário', isRecurring: true, status: 'paid' },
  { id: '4', type: 'income', amount: 750, date: formatISO(subMonths(now, 1)), description: 'Projeto Freelance', category: 'Freelance', isRecurring: false, status: 'paid' },

  // Despesas
  { id: '5', type: 'expense', amount: 1200, date: formatISO(subMonths(now, 2)), description: 'Aluguel', category: 'Aluguel/Hipoteca', isRecurring: true, status: 'paid' },
  { id: '6', type: 'expense', amount: 1200, date: formatISO(subMonths(now, 1)), description: 'Aluguel', category: 'Aluguel/Hipoteca', isRecurring: true, status: 'paid' },
  { id: '7', type: 'expense', amount: 1200, date: formatISO(now), description: 'Aluguel', category: 'Aluguel/Hipoteca', isRecurring: true, status: 'paid' },
  { id: '8', type: 'expense', amount: 450, date: formatISO(subMonths(now, 1)), description: 'Compras de mercado', category: 'Mercado', isRecurring: false, status: 'paid' },
  { id: '9', type: 'expense', amount: 150, date: formatISO(subMonths(now, 1)), description: 'Contas da casa', category: 'Contas', isRecurring: true, status: 'paid' },
  { id: '10', type: 'expense', amount: 80, date: formatISO(subMonths(now, 1)), description: 'Jantar com amigos', category: 'Lazer', isRecurring: false, status: 'paid' },
  { id: '11', type: 'expense', amount: 15.99, date: formatISO(subMonths(now, 1)), description: 'Serviço de Streaming', category: 'Assinaturas', isRecurring: true, status: 'paid' },
  { id: '12', type: 'expense', amount: 480, date: formatISO(now), description: 'Compras de mercado', category: 'Mercado', isRecurring: false, status: 'paid' },
  { id: '13', type: 'expense', amount: 160, date: formatISO(now), description: 'Contas da casa', category: 'Contas', isRecurring: true, status: 'paid' },
  { id: '14', type: 'expense', amount: 15.99, date: formatISO(now), description: 'Serviço de Streaming', category: 'Assinaturas', isRecurring: true, status: 'paid' },
  { id: '15', type: 'expense', amount: 250, date: formatISO(now), description: 'Sapatos novos', category: 'Compras', isRecurring: false, status: 'paid' },
];

export const mockDebts: Debt[] = [
  {
    id: 'd1',
    name: 'Financiamento do Carro',
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
    name: 'Empréstimo Estudantil',
    totalAmount: 50000,
    paidAmount: 5000,
    creditor: 'Empréstimos Federais',
    installments: [
        { id: 'i4', debtId: 'd2', installmentNumber: 1, amount: 250, dueDate: formatISO(subMonths(now, 2)), status: 'paid' },
        { id: 'i5', debtId: 'd2', installmentNumber: 2, amount: 250, dueDate: formatISO(subMonths(now, 1)), status: 'paid' },
        { id: 'i6', debtId: 'd2', installmentNumber: 3, amount: 250, dueDate: formatISO(now), status: 'unpaid' },
    ],
  },
];
