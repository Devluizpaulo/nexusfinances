'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, updateDoc, doc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { Loader2, Film, Cpu, Repeat, PlusCircle, Upload, LayoutGrid, List, TrendingUp, CreditCard } from 'lucide-react';
import { AddSubscriptionSheet } from '@/components/subscriptions/add-subscription-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';
import { SubscriptionColumn } from '@/components/subscriptions/subscription-column';
import { subscriptionCategoriesConfig } from '@/lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function SubscriptionsPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('isRecurring', '==', true),
      where('category', 'in', ['Assinaturas & Serviços', 'Lazer', 'Saúde', 'Educação', 'Outros'])
    );
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(recurringExpensesQuery);

  const groupedExpenses = useMemo(() => {
    const grouped: Record<string, Recurrence[]> = {
      media: [],
      software: [],
      services: [],
    };
    
    (expenseData || []).forEach(expense => {
      // Use a metadata se existir, senão, use a lógica de keywords
      const subCategory = (expense as any).metadata?.subscriptionType;
      if (subCategory && grouped[subCategory]) {
        grouped[subCategory].push(expense);
        return;
      }
      
      const expenseDescription = expense.description.toLowerCase();
      let assigned = false;
      for (const cat of subscriptionCategoriesConfig) {
        if (cat.id !== 'services' && cat.keywords.some(keyword => expenseDescription.includes(keyword))) {
          grouped[cat.id].push(expense);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        grouped['services'].push(expense);
      }
    });

    return grouped;
  }, [expenseData]);

  // Calculate totals for summary cards
  const subscriptionTotals = useMemo(() => {
    const totals = {
      total: 0,
      byCategory: {
        media: 0,
        software: 0,
        services: 0,
      }
    };

    Object.entries(groupedExpenses).forEach(([category, expenses]) => {
      const categoryTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      totals.byCategory[category as keyof typeof totals.byCategory] = categoryTotal;
      totals.total += categoryTotal;
    });

    return totals;
  }, [groupedExpenses]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setEditingTransaction(null);
    setIsAddSheetOpen(false);
  };

  const isLoading = isUserLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasAnySubscription = Object.values(groupedExpenses).some(arr => arr.length > 0);

  return (
    <>
      <AddSubscriptionSheet isOpen={isAddSheetOpen} onClose={handleCloseSheet} transaction={editingTransaction} />
      <ImportTransactionsSheet isOpen={isImportSheetOpen} onClose={() => setIsImportSheetOpen(false)} />

      <PageHeader title="Streams & Assinaturas" description="Gerencie seus serviços recorrentes de streaming, software e outros.">
        <div className="flex items-center gap-2">
           <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-muted p-1">
             <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('card')}>
               <LayoutGrid className="h-4 w-4" />
             </Button>
             <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}>
               <List className="h-4 w-4" />
             </Button>
           </div>
          <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Assinatura
          </Button>
          <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
            <Upload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Importar PDF com IA</span>
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {hasAnySubscription && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensal</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(subscriptionTotals.total)}</div>
              <p className="text-xs text-muted-foreground">Total de todas as assinaturas</p>
            </CardContent>
          </Card>
          
          {subscriptionCategoriesConfig.map(categoryConfig => {
            const categoryTotal = subscriptionTotals.byCategory[categoryConfig.id];
            const Icon = categoryConfig.icon;
            return (
              <Card key={categoryConfig.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{categoryConfig.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(categoryTotal)}</div>
                  <p className="text-xs text-muted-foreground">{groupedExpenses[categoryConfig.id].length} assinaturas</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {hasAnySubscription ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {subscriptionCategoriesConfig.map(categoryConfig => (
            <SubscriptionColumn
              key={categoryConfig.id}
              categoryConfig={categoryConfig}
              subscriptions={groupedExpenses[categoryConfig.id] || []}
              viewMode={viewMode}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma assinatura encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Comece a organizar seus serviços recorrentes como Netflix, Spotify, software e outros.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeira Assinatura
            </Button>
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
              <Upload className="mr-2 h-4 w-4" />
              Importar com IA
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
