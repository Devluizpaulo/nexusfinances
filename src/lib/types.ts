
import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';


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
  contributions?: {
    id: string;
    amount: number;
    date: string; // ISO string
  }[];
  monthlyContribution?: number;
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


// Schemas and types for AI Financial Insights Flow
const AITransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  amount: z.number(),
  date: z.string(),
  description: z.string(),
  category: z.string(),
  isRecurring: z.boolean(),
  status: z.enum(['paid', 'pending']),
});

const AIDebtSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  creditor: z.string(),
});

const AIGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
});

export const GetFinancialInsightsInputSchema = z.object({
  userName: z.string().describe('O primeiro nome do usuário para personalizar a resposta.'),
  incomes: z.array(AITransactionSchema).describe('Lista de transações de renda do usuário no mês.'),
  expenses: z.array(AITransactionSchema).describe('Lista de transações de despesa do usuário no mês.'),
  debts: z.array(AIDebtSchema).describe('Lista de todas as dívidas ativas do usuário.'),
  goals: z.array(AIGoalSchema).describe('Lista de todas as metas de economia do usuário.'),
});
export type GetFinancialInsightsInput = z.infer<typeof GetFinancialInsightsInputSchema>;

export const GetFinancialInsightsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'Um parágrafo curto e amigável (2-3 frases) resumindo a saúde financeira do usuário neste mês. Use o nome do usuário. Ex: "Olá, [nome]! Este mês, suas finanças estão..."'
    ),
  actionPoints: z
    .array(z.string())
    .describe('Uma lista de 2 a 3 pontos de ação claros e práticos para o usuário. Cada ponto deve ser uma frase curta e direta.'),
});
export type GetFinancialInsightsOutput = z.infer<typeof GetFinancialInsightsOutputSchema>;

type DetailItem = {
  title: string;
  details: string;
};

type ExperienceItem = DetailItem & {
  description: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export type EducationModule = {
    type: 'psychology' | 'practicalExperiences' | 'microHabits' | 'narrative' | 'finalQuiz' | 'tool';
    title: string;
    subtitle?: string;
    points?: DetailItem[];
    experiences?: ExperienceItem[];
    habits?: string[];
    description?: string;
    questions?: QuizQuestion[];
    componentName?: string;
    component?: React.ComponentType;
};


export type EducationTrack = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
  content: {
    introduction: string;
    modules: EducationModule[];
  };
};

export interface Mission {
  id: string;
  description: string;
  isCompleted: boolean;
  points: number;
}
