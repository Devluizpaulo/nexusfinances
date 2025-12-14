
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { Loader2, PlusCircle, Upload, CreditCard, Filter, ArrowUpDown, MoreHorizontal, Trash2, PauseCircle, RefreshCw } from 'lucide-react';
import { AddSubscriptionSheet } from '@/components/subscriptions/add-subscription-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subscriptionCategoriesConfig } from '@/lib/config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionWithCategory extends Transaction {
  categoryType: 'media' | 'software' | 'services';
  categoryLabel: string;
}

export default function SubscriptionsPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('description');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<SubscriptionWithCategory | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('isRecurring', '==', true),
      where('category', 'in', ['Assinaturas & Serviços', 'Lazer', 'Saúde', 'Educação', 'Outros'])
    );
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(recurringExpensesQuery);

  const processedSubscriptions = useMemo(() => {
    if (!expenseData) return [];

    return expenseData.map(expense => {
      // Use a metadata se existir, senão, use a lógica de keywords
      const subCategory = (expense as any).metadata?.subscriptionType;
      let categoryType: 'media' | 'software' | 'services' = 'services';
      let categoryLabel = 'Outros Serviços';

      if (subCategory && ['media', 'software', 'services'].includes(subCategory)) {
        categoryType = subCategory;
        categoryLabel = subscriptionCategoriesConfig.find(cat => cat.id === subCategory)?.title || 'Outros Serviços';
      } else {
        const expenseDescription = expense.description.toLowerCase();
        for (const cat of subscriptionCategoriesConfig) {
          if (cat.id !== 'services' && cat.keywords.some(keyword => expenseDescription.includes(keyword))) {
            categoryType = cat.id;
            categoryLabel = cat.title;
            break;
          }
        }
      }

      return {
        ...expense,
        categoryType,
        categoryLabel,
      } as SubscriptionWithCategory;
    });
  }, [expenseData]);

  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = processedSubscriptions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(sub => sub.categoryType === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'description':
          return a.description.localeCompare(b.description);
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.categoryLabel.localeCompare(b.categoryLabel);
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedSubscriptions, selectedCategory, sortBy]);

  // Calculate totals
  const subscriptionTotals = useMemo(() => {
    const totals = {
      total: 0,
      byCategory: {
        media: 0,
        software: 0,
        services: 0,
      },
      count: {
        media: 0,
        software: 0,
        services: 0,
      }
    };

    processedSubscriptions.forEach(sub => {
      totals.total += sub.amount || 0;
      totals.byCategory[sub.categoryType] += sub.amount || 0;
      totals.count[sub.categoryType]++;
    });

    return totals;
  }, [processedSubscriptions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  };

  const handleDelete = (subscription: SubscriptionWithCategory) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!subscriptionToDelete || !user) return;

    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/expenses/${subscriptionToDelete.id}`));
      toast({
        title: "Assinatura excluída",
        description: `${subscriptionToDelete.description} foi removida com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a assinatura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleSuspend = async (subscription: SubscriptionWithCategory) => {
    if (!user) return;

    try {
      await updateDoc(doc(firestore, `users/${user.uid}/expenses/${subscription.id}`), {
        status: 'suspended',
        notes: `${subscription.notes || ''}\n[Assinatura suspensa em ${new Date().toLocaleDateString('pt-BR')}]`
      });
      toast({
        title: "Assinatura suspensa",
        description: `${subscription.description} foi suspensa. Você pode reativá-la quando quiser.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao suspender",
        description: "Não foi possível suspender a assinatura. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRenewPayment = async (subscription: SubscriptionWithCategory) => {
    if (!user) return;

    try {
      // Create a new transaction for the payment
      const paymentData = {
        userId: user.uid,
        amount: subscription.amount,
        category: subscription.category,
        date: new Date().toISOString(),
        description: `Pagamento: ${subscription.description}`,
        isRecurring: false,
        recurringSourceId: subscription.id,
        status: 'paid',
        type: 'expense',
        notes: `Pagamento registrado em ${new Date().toLocaleDateString('pt-BR')}. OBS: Este é apenas um registro financeiro. O pagamento efetivo deve ser realizado no serviço contratado.`,
      };

      await addDoc(collection(firestore, `users/${user.uid}/expenses`), paymentData);
      toast({
        title: "Pagamento registrado",
        description: `Pagamento de ${formatCurrency(subscription.amount)} registrado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao registrar pagamento",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
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

  const hasAnySubscription = processedSubscriptions.length > 0;

  // Table columns
  const columns = [
    {
      header: 'Serviço',
      accessorKey: 'description',
      cell: ({ row }: { row: { original: SubscriptionWithCategory } }) => (
        <div>
          <div className="font-medium">{row.original.description}</div>
          <div className="text-sm text-muted-foreground">{row.original.categoryLabel}</div>
        </div>
      ),
    },
    {
      header: 'Valor',
      accessorKey: 'amount',
      cell: ({ row }: { row: { original: SubscriptionWithCategory } }) => (
        <div className="font-medium">{formatCurrency(row.original.amount)}</div>
      ),
    },
    {
      header: 'Próximo Pagamento',
      accessorKey: 'date',
      cell: ({ row }: { row: { original: SubscriptionWithCategory } }) => (
        <div className="text-sm">
          {new Date(row.original.date).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
    {
      header: 'Categoria',
      accessorKey: 'categoryType',
      cell: ({ row }: { row: { original: SubscriptionWithCategory } }) => {
        const categoryConfig = subscriptionCategoriesConfig.find(cat => cat.id === row.original.categoryType);
        const Icon = categoryConfig?.icon;
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            {Icon && <Icon className="h-3 w-3" />}
            {row.original.categoryLabel}
          </Badge>
        );
      },
    },
    {
      header: 'Ações',
      accessorKey: 'actions',
      cell: ({ row }: { row: { original: SubscriptionWithCategory } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRenewPayment(row.original)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Registrar Pagamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSuspend(row.original)}>
              <PauseCircle className="mr-2 h-4 w-4" />
              Suspender
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(row.original)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AddSubscriptionSheet isOpen={isAddSheetOpen} onClose={handleCloseSheet} transaction={editingTransaction} />
      <ImportTransactionsSheet isOpen={isImportSheetOpen} onClose={() => setIsImportSheetOpen(false)} />

      <PageHeader title="Assinaturas & Serviços" description="Gerencie todas suas assinaturas em um único lugar.">
        <div className="flex items-center gap-2">
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
              <p className="text-xs text-muted-foreground">{processedSubscriptions.length} assinaturas ativas</p>
            </CardContent>
          </Card>
          
          {subscriptionCategoriesConfig.map(categoryConfig => {
            const categoryTotal = subscriptionTotals.byCategory[categoryConfig.id];
            const categoryCount = subscriptionTotals.count[categoryConfig.id];
            const Icon = categoryConfig.icon;
            return (
              <Card key={categoryConfig.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{categoryConfig.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(categoryTotal)}</div>
                  <p className="text-xs text-muted-foreground">{categoryCount} assinaturas</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters and Controls */}
      {hasAnySubscription && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {subscriptionCategoriesConfig.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ordenar:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="description">Nome</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="date">Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasAnySubscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Minhas Assinaturas</CardTitle>
            <CardDescription>
              {filteredAndSortedSubscriptions.length} assinatura{filteredAndSortedSubscriptions.length !== 1 ? 's' : ''} 
              {selectedCategory !== 'all' && ` em ${subscriptionCategoriesConfig.find(cat => cat.id === selectedCategory)?.title}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredAndSortedSubscriptions}
            />
          </CardContent>
        </Card>
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
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{subscriptionToDelete?.description}&quot;? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
