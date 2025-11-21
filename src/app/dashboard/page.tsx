import { KpiCard } from '@/components/dashboard/kpi-card';
import { mockTransactions, mockDebts } from '@/lib/data';
import { Banknote, Landmark, CreditCard, Wallet } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import type { FinancialInsightsInput } from '@/ai/flows/financial-insights-generator';

export default function DashboardPage() {
  const totalIncome = mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebt = mockDebts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  
  const savings = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const spendingByCategory = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  const financialData: FinancialInsightsInput = {
    income: totalIncome,
    expenses: totalExpenses,
    debts: totalDebt,
    savings: savings,
    spendingByCategory: spendingByCategory,
    savingsGoals: { 'Carro Novo': 25000, 'Férias': 5000 },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Renda Total"
          value={formatCurrency(totalIncome)}
          icon={Landmark}
          description="Renda total neste período"
        />
        <KpiCard
          title="Despesas Totais"
          value={formatCurrency(totalExpenses)}
          icon={CreditCard}
          description="Despesas totais neste período"
        />
        <KpiCard
          title="Economias"
          value={formatCurrency(savings)}
          icon={Wallet}
          description="Renda menos despesas"
        />
        <KpiCard
          title="Dívida Pendente"
          value={formatCurrency(totalDebt)}
          icon={Banknote}
          description="Saldo devedor total restante"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <IncomeExpenseChart transactions={mockTransactions} />
        </div>
        <div className="lg:col-span-2">
          <ExpenseCategoryChart transactions={mockTransactions} />
        </div>
      </div>

      <div>
        <AiInsights financialData={financialData} />
      </div>
    </div>
  );
}
