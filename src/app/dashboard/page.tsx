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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
    savingsGoals: { 'New Car': 25000, 'Vacation': 5000 },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          icon={Landmark}
          description="Total income this period"
        />
        <KpiCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={CreditCard}
          description="Total expenses this period"
        />
        <KpiCard
          title="Savings"
          value={formatCurrency(savings)}
          icon={Wallet}
          description="Income minus expenses"
        />
        <KpiCard
          title="Outstanding Debt"
          value={formatCurrency(totalDebt)}
          icon={Banknote}
          description="Total remaining debt balance"
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
