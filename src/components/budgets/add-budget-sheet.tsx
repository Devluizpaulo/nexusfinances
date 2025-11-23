'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '../ui/currency-input';
import { expenseCategories, type Budget } from '@/lib/types';
import { formatISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  amount: z.coerce.number().positive('O valor do orçamento deve ser positivo.'),
  period: z.enum(['monthly', 'weekly'], { required_error: 'Selecione um período.' }),
});

type BudgetFormValues = z.infer<typeof formSchema>;

type AddBudgetSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget | null;
};

export function AddBudgetSheet({ isOpen, onClose, budget }: AddBudgetSheetProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      amount: 0,
      period: 'monthly',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const allCategories = useMemo(() => {
    const customCategories = user?.customExpenseCategories || [];
    const combined = new Set([...expenseCategories, ...customCategories]);
    return Array.from(combined);
  }, [user]);

  useEffect(() => {
    if (budget && isOpen) {
      form.reset({
        name: budget.name,
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
      });
    } else {
       form.reset({
        name: '',
        category: '',
        amount: 0,
        period: 'monthly',
      });
    }
  }, [budget, isOpen, form]);
  
  const isEditing = !!budget;

  const onSubmit = async (values: BudgetFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }

    try {
      if (isEditing) {
        // When editing, preserve the original start and end dates
        const budgetRef = doc(firestore, `users/${user.uid}/budgets`, budget!.id);
        const updatedData = { 
            ...values,
            userId: user.uid, // ensure userId is present for security rules if needed
            startDate: budget.startDate, 
            endDate: budget.endDate 
        };
        setDocumentNonBlocking(budgetRef, updatedData, { merge: true });
        toast({ title: 'Orçamento atualizado!', description: `O orçamento "${values.name}" foi salvo.` });
      } else {
        // When creating, calculate new start and end dates
        const now = new Date();
        const startDate = values.period === 'monthly' ? startOfMonth(now) : startOfWeek(now, { weekStartsOn: 1 });
        const endDate = values.period === 'monthly' ? endOfMonth(now) : endOfWeek(now, { weekStartsOn: 1 });
        
        const newBudgetData = {
            ...values,
            userId: user.uid,
            startDate: formatISO(startDate),
            endDate: formatISO(endDate),
        };

        const budgetsColRef = collection(firestore, `users/${user.uid}/budgets`);
        addDocumentNonBlocking(budgetsColRef, newBudgetData);
        toast({ title: 'Orçamento criado!', description: `O orçamento "${values.name}" foi criado com sucesso.` });
      }
      onClose();
    } catch (error) {
      console.error("Error saving budget: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o orçamento. Tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</DialogTitle>
          <DialogDescription>
            Defina um limite de gastos para uma categoria em um período específico.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Orçamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mercado da semana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria de Despesa</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria para orçar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Orçado (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>O orçamento será para o mês ou semana atual.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user}
                className="w-full"
                >
                {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Salvar Alterações' : 'Salvar Orçamento'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
