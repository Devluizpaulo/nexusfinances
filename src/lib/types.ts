
import { z } from 'zod';
import type { ElementType } from 'react';
import type { LucideIcon } from 'lucide-react';


export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO string
  description: string;
  category: string; // e.g., 'Salary', 'Groceries'
  subcategory?: string; // e.g., 'Electricity', 'Water', 'Internet'
  isRecurring: boolean;
  recurrenceSchedule?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  userId?: string;
  recurringSourceId?: string;
  status: 'paid' | 'pending';
  creditCardId?: string | null;
  grossAmount?: number;
  totalDeductions?: number;
  earnings?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
  fgtsAmount?: number;
  companyName?: string;
  notes?: string;
  vendor?: string;
  consumption?: string; // e.g., '150 kWh', '25 m³'
};

export type CreditCard = {
  id: string;
  name: string;
  lastFourDigits: string;
  limit: number;
  dueDate: number; // Day of the month
  closingDate: number; // Day of the month
  userId?: string;
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
  status: 'paid' | 'unpaid';
  userId?: string;
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

export type Budget = {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  spentAmount?: number;
  period: 'monthly';
  startDate: string; // ISO String
  endDate: string; // ISO String
};

export type RentalContract = {
  id: string;
  userId: string;
  landlordName: string;
  type: 'Aluguel' | 'Condomínio' | 'Aluguel + Condomínio' | 'Outros';
  rentAmount?: number;
  condoFee?: number;
  totalAmount: number;
  dueDate: number;
  paymentPeriodicity: 'Mensal' | 'Bimestral' | 'Trimestral' | 'Anual';
  startDate: string; // ISO string
  endDate?: string | null; // ISO string
  isAutoRenew?: boolean;
  propertyAddress?: string;
  securityDeposit?: number;
  notes?: string;
  status?: 'active' | 'inactive';
  paymentMethod?: {
    method: 'pix' | 'bankTransfer' | 'boleto' | 'creditCard' | 'cash' | 'debit';
    instructions?: string;
    identifier?: string;
  };
};

export type Recurrence = Transaction;

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  paymentGatewayId: string;
  active: boolean;
};

export type UserSubscription = {
  planId: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  startDate: any; // Can be Firestore Timestamp
  endDate?: any; // Can be Firestore Timestamp
  paymentGatewaySubscriptionId: string;
};


export type Log = {
    id: string;
    timestamp: any; // Can be Firestore Timestamp
    level: 'info' | 'warn' | 'error';
    message: string;
    createdBy: string;
    createdByName: string;
}

export type Notification = {
  id: string;
  userId: string;
  type: 'debt_due' | 'goal_reached' | 'budget_warning' | 'upcoming_due' | 'recurrence_created';
  message: string;
  isRead: boolean;
  link?: string;
  timestamp: string; // ISO string
  entityId?: string;
}

// Categorias que possuem páginas/lógicas específicas
export const specificExpenseCategories = [
    'Moradia', 'Contas de Consumo', 'Impostos & Taxas', 'Assinaturas & Serviços', 'Saúde', 'Educação', 'Lazer', 'Alimentação', 'Transporte'
] as const;

type SubcategoryOption = {
  value: string;
  label: string;
  icon: keyof typeof import('lucide-react');
};

export const utilitySubcategories: SubcategoryOption[] = [
  { value: 'Luz', label: 'Luz', icon: 'Lightbulb' },
  { value: 'Água', label: 'Água', icon: 'Droplet' },
  { value: 'Gás', label: 'Gás', icon: 'Flame' },
  { value: 'Internet', label: 'Internet', icon: 'Wifi' },
  { value: 'Celular', label: 'Celular', icon: 'Smartphone' },
  { value: 'Telefone Fixo', label: 'Telefone Fixo', icon: 'Phone' },
  { value: 'TV por Assinatura', label: 'TV por Assinatura', icon: 'Tv' },
  { value: 'Outro', label: 'Outro', icon: 'Zap' },
];

export const leisureSubcategories: SubcategoryOption[] = [
    { value: 'Restaurantes & Bares', label: 'Restaurantes & Bares', icon: 'UtensilsCrossed' },
    { value: 'Viagens', label: 'Viagens', icon: 'Plane' },
    { value: 'Cinema & Teatro', label: 'Cinema & Teatro', icon: 'Clapperboard' },
    { value: 'Eventos & Shows', label: 'Eventos & Shows', icon: 'Ticket' },
    { value: 'Hobbies', label: 'Hobbies', icon: 'Paintbrush' },
    { value: 'Esportes', label: 'Esportes', icon: 'Dumbbell' },
    { value: 'Outro', label: 'Outro', icon: 'PartyPopper' },
];

export const foodSubcategories: SubcategoryOption[] = [
    { value: 'Supermercado', label: 'Supermercado', icon: 'ShoppingCart' },
    { value: 'Restaurantes', label: 'Restaurantes', icon: 'Utensils' },
    { value: 'Delivery', label: 'Delivery', icon: 'Bike' },
    { value: 'Feira & Sacolão', label: 'Feira & Sacolão', icon: 'Grape' },
    { value: 'Padaria & Lanches', label: 'Padaria & Lanches', icon: 'Cake' },
    { value: 'Outro', label: 'Outro', icon: 'UtensilsCrossed' },
];

export const healthSubcategories: SubcategoryOption[] = [
    { value: 'Farmácia', label: 'Farmácia', icon: 'Pill' },
    { value: 'Consultas', label: 'Consultas', icon: 'Stethoscope' },
    { value: 'Exames', label: 'Exames', icon: 'FlaskConical' },
    { value: 'Plano de Saúde', label: 'Plano de Saúde', icon: 'Shield' },
    { value: 'Academia', label: 'Academia', icon: 'Dumbbell' },
    { value: 'Terapias', label: 'Terapias', icon: 'BrainCircuit' },
    { value: 'Outro', label: 'Outro', icon: 'Activity' },
];

export const subcategoryMap = {
  'Contas de Consumo': utilitySubcategories,
  'Lazer': leisureSubcategories,
  'Alimentação': foodSubcategories,
  'Saúde': healthSubcategories,
} as const;


export const expenseCategories = [
    ...specificExpenseCategories,
    'Compras',
    'Investimentos',
    'Outros',
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export const incomeCategories = [
    'Salário',
    'Freelance',
    'Vendas',
    'Comissão',
    'Rendimento de Investimentos',
    'Aluguel',
    'Presente',
    'Outros',
] as const;

export type IncomeCategory = typeof incomeCategories[number];

export const goalCategories = [
    'Reserva de Emergência',
    'Viagem',
    'Carro',
    'Casa',
    'Educação',
    'Aposentadoria',
    'Investir',
    'Quitar Dívidas',
    'Eletrônicos',
    'Outros'
] as const;

export type GoalCategory = typeof goalCategories[number];

export type HealthProvider = {
  id: string;
  name: string;
  type: 'Academia' | 'Clínica' | 'Consultório' | 'Estúdio' | 'Centro Terapêutico' | 'Outro';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  userId?: string;
};

export type HealthProfessional = {
  id: string;
  name: string;
  specialty: string;
  providerId?: string;
  phone?: string;
  email?: string;
  notes?: string;
  userId?: string;
};

export type HealthInsuranceDependent = {
  name: string;
  cardNumber: string;
};

export type HealthInsurance = {
  id: string;
  type: 'Saúde' | 'Odontológico';
  operator: string;
  planName: string;
  cardNumber: string;
  emergencyContact?: string;
  dependents: HealthInsuranceDependent[];
  userId?: string;
};


// Schemas and types for AI Financial Insights Flow
export const AITransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  amount: z.number(),
  date: z.string(),
  description: z.string(),
  category: z.string(),
  isRecurring: z.boolean(),
  status: z.enum(['paid', 'pending']),
});

export const AIDebtSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  creditor: z.string(),
});

export const AIGoalSchema = z.object({
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
  icon: ElementType | string;
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


// Schemas and types for PDF Extraction Flow
export const ExtractedTransactionSchema = z.object({
  date: z.string().describe('A data da transação no formato YYYY-MM-DD.'),
  description: z.string().describe('A descrição completa da transação como aparece no extrato.'),
  amount: z.number().describe('O valor da transação. Deve ser negativo para despesas e positivo para receitas.'),
  suggestedCategory: z.string().describe('Uma categoria sugerida para a transação (ex: "Alimentação", "Transporte", "Salário").'),
});
export type ExtractedTransaction = z.infer<typeof ExtractedTransactionSchema>;

export const ExtractTransactionsInputSchema = z.object({
  pdfBase64: z.string().describe("O conteúdo do arquivo PDF codificado em Base64."),
});
export type ExtractTransactionsInput = z.infer<typeof ExtractTransactionsInputSchema>;

export const ExtractTransactionsOutputSchema = z.object({
  transactions: z.array(ExtractedTransactionSchema),
});
export type ExtractTransactionsOutput = z.infer<typeof ExtractTransactionsOutputSchema>;

// Schemas and types for Payslip Extraction Flow
const NameAmountPairSchema = z.object({
  name: z.string().describe('Nome do item (ex: "Salário Base", "INSS", "Vale Transporte").'),
  amount: z.number().describe('Valor do item.'),
});


export const ExtractPayslipInputSchema = z.object({
  pdfBase64: z.string().describe("O conteúdo do arquivo PDF (holerite ou nota fiscal) como um data URI."),
});
export type ExtractPayslipInput = z.infer<typeof ExtractPayslipInputSchema>;

export const ExtractPayslipOutputSchema = z.object({
  companyName: z.string().optional().describe('O nome da empresa pagadora.'),
  netAmount: z.number().describe("O valor líquido final (salário líquido) encontrado no documento."),
  grossAmount: z.number().optional().describe("O valor bruto total (soma de todos os proventos)."),
  totalDeductions: z.number().optional().describe("A soma de todos os descontos."),
  earnings: z.array(NameAmountPairSchema).optional().describe('Uma lista detalhada de cada item de ganho/provento.'),
  deductions: z.array(NameAmountPairSchema).optional().describe('Uma lista detalhada de cada desconto.'),
  fgtsAmount: z.number().optional().describe('O valor do depósito do FGTS do mês.'),
  issueDate: z.string().optional().describe("A data de emissão ou competência do documento no formato YYYY-MM-DD."),
  description: z.string().optional().describe("Uma breve descrição da origem do pagamento (ex: 'Salário referente a Abril/2024').")
});
export type ExtractPayslipOutput = z.infer<typeof ExtractPayslipOutputSchema>;


// Schemas and types for Budget Suggestion Flow
export const SuggestBudgetsInputSchema = z.object({
  transactions: z.array(AITransactionSchema).describe('Lista de transações de despesa do usuário nos últimos 3 meses.'),
});
export type SuggestBudgetsInput = z.infer<typeof SuggestBudgetsInputSchema>;

export const SuggestedBudgetSchema = z.object({
  category: z.string().describe("A categoria de despesa para a qual o limite é sugerido (ex: 'Alimentação')."),
  amount: z.number().describe("O valor do limite de gasto mensal sugerido, arredondado para um número razoável (ex: 50, 100, 500)."),
  justification: z.string().describe("Uma frase curta explicando por que este limite foi sugerido, baseada nos gastos do usuário."),
});
export type SuggestedBudget = z.infer<typeof SuggestedBudgetSchema>;

export const SuggestBudgetsOutputSchema = z.object({
  suggestions: z
    .array(SuggestedBudgetSchema)
    .describe('Uma lista de 2 a 3 sugestões de limites de gastos.'),
});
export type SuggestBudgetsOutput = z.infer<typeof SuggestBudgetsOutputSchema>;

// 52-Week Challenge Types
export type Challenge52Weeks = {
  id: string;
  userId: string;
  startDate: string; // ISO string
  initialAmount: number;
  incrementAmount: number;
  totalDeposited: number;
  status: 'active' | 'completed' | 'cancelled';
};

export type Challenge52WeeksDeposit = {
  id: string;
  challengeId: string;
  weekNumber: number;
  expectedAmount: number;
  dueDate: string; // ISO string
  status: 'pending' | 'deposited' | 'skipped';
  depositDate?: string | null; // ISO string
};

  

    