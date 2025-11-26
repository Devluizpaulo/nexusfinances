'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { Loader2, Briefcase, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories } from '@/lib/types';
import { ImportPayslipCard } from '@/components/income/import-payslip-card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


export default function SalaryPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const salaryIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), where('category', '==', 'Salário'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: salaryData, isLoading: isIncomesLoading } = useCollection<Transaction>(salaryIncomesQuery);

  const {
    avgGross,
    avgNet,
    avgDeductions,
    salaryHistory,
  } = useMemo(() => {
    if (!salaryData) return { avgGross: 0, avgNet: 0, avgDeductions: 0, salaryHistory: [] };

    const salaries = salaryData.filter(t => t.grossAmount !== undefined);
    
    if (salaries.length === 0) return { avgGross: 0, avgNet: 0, avgDeductions: 0, salaryHistory: [] };

    const totalNet = salaries.reduce((sum, s) => sum + s.amount, 0);
    const totalGross = salaries.reduce((sum, s) => sum + (s.grossAmount || 0), 0);
    const totalDeductions = salaries.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);

    return {
      avgNet: totalNet / salaries.length,
      avgGross: totalGross / salaries.length,
      avgDeductions: totalDeductions / salaries.length,
      salaryHistory: salaries.slice(0, 6) // Last 6 salaries
    };
  }, [salaryData]);

  const isLoading = isUserLoading || isIncomesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleOpenSheet = () => {
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
  };

  return (
    <>
       <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        transactionType="income"
        categories={incomeCategories}
      />
      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleOpenSheet} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Renda Fixa
        </Button>
      </div>

      <div className="mb-8">
        <ImportPayslipCard />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
         <KpiCard
            title="Salário Líquido Médio"
            value={formatCurrency(avgNet)}
            icon={TrendingUp}
            description="Média dos últimos salários líquidos."
        />
         <KpiCard
            title="Salário Bruto Médio"
            value={formatCurrency(avgGross)}
            icon={TrendingUp}
            description="Média dos últimos salários brutos."
        />
        <KpiCard
            title="Descontos Médios"
            value={formatCurrency(avgDeductions)}
            icon={TrendingDown}
            description="Média dos descontos (INSS, IRRF, etc.)."
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Histórico de Salários</CardTitle>
          </div>
          <CardDescription>Seus últimos salários importados ou cadastrados como "Salário".</CardDescription>
        </CardHeader>
        <CardContent>
          {salaryHistory.length > 0 ? (
             <div className="space-y-3">
                {salaryHistory.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{formatCurrency(item.amount)} <span className="text-xs text-muted-foreground">(Líquido)</span></p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.date), 'PPP', { locale: ptBR })}
                            </p>
                        </div>
                         <div className="text-right text-xs">
                           <p>Bruto: {formatCurrency(item.grossAmount || 0)}</p>
                           <p className="text-red-500">Descontos: {formatCurrency(item.totalDeductions || 0)}</p>
                        </div>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhum histórico de salário encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Importe um holerite ou cadastre uma renda na categoria "Salário" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
