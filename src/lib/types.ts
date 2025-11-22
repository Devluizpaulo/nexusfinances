export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO string
  description: string;
  category: string; // e.g., 'Salary', 'Groceries'
  isRecurring: boolean;
  userId?: string;
  recurringSourceId?: string;
  status: 'paid' | 'pending';
};

export type Debt = {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  creditor: string;
  installments?: Installment[]; // This can be optional if we fetch them separately
  userId?: string;
};

export type Installment = {
  id: string;
  debtId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string; // ISO string
  status: 'paid' | 'unpaid' | 'overdue';
};

export type Goal = {
  id: string;
  name: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO string, optional
  userId?: string;
};

export type Log = {
    id: string;
    timestamp: any; // Can be Firestore Timestamp
    level: 'info' | 'warn' | 'error';
    message: string;
    createdBy: string;
    createdByName: string;
}

export const expenseCategories = [
  'Mercado',
  'Contas',
  'Aluguel/Hipoteca',
  'Transporte',
  'Lazer',
  'Saúde',
  'Assinaturas',
  'Compras',
  'Outros',
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export const incomeCategories = [
  'Salário',
  'Freelance',
  'Comissão',
  'Investimento',
  'Presente',
  'Outros',
] as const;

export type IncomeCategory = typeof incomeCategories[number];

export const goalCategories = [
    'Reserva de Emergência',
    'Viagem',
    'Carro',
    'Casa',
    'Eletrônicos',
    'Educação',
    'Aposentadoria',
    'Outros'
] as const;

export type GoalCategory = typeof goalCategories[number];