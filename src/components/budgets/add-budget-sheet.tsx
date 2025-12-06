'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, arrayUnion, updateDoc } from 'firebase/firestore';
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
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '../ui/currency-input';
import { expenseCategories, type Budget } from '@/lib/types';
import { formatISO, startOfMonth, endOfMonth } from 'date-fns';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  amount: z.coerce.number().positive('O valor do limite deve ser positivo.'),
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
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
      });
    } else {
       form.reset({
        name: '',
        category: '',
        amount: 0,
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
      const dataToSave = { ...values, userId: user.uid };

      if (isEditing) {
        // When editing, preserve the original start and end dates if they exist, otherwise calculate
        const budgetRef = doc(firestore, `users/${user.uid}/budgets`, budget!.id);
        const updatedData = { 
            ...dataToSave,
            period: 'monthly' as const,
            startDate: budget.startDate || formatISO(startOfMonth(new Date())), 
            endDate: budget.endDate || formatISO(endOfMonth(new Date()))
        };
        setDocumentNonBlocking(budgetRef, updatedData, { merge: true });
        toast({ title: 'Limite atualizado!', description: `O limite de gasto "${values.name}" foi salvo.` });
      } else {
        // When creating, always calculate new start and end dates for the current month
        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);
        
        const newBudgetData = {
            ...dataToSave,
            period: 'monthly' as const,
            startDate: formatISO(startDate),
            endDate: formatISO(endDate),
        };

        const budgetsColRef = collection(firestore, `users/${user.uid}/budgets`);
        addDocumentNonBlocking(budgetsColRef, newBudgetData);
        toast({ title: 'Limite de gasto criado!', description: `O limite "${values.name}" foi criado com sucesso.` });
      }
      onClose();
    } catch (error) {
      console.error("Error saving budget: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o limite de gasto. Tente novamente.',
      });
    }
  };
  
  const handleAddCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) return;

    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        customExpenseCategories: arrayUnion(newCategoryName.trim())
      });
      toast({ title: 'Categoria adicionada' });
      form.setValue('category', newCategoryName.trim());
      setNewCategoryName('');
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Não deu para salvar a categoria" });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Limite de Gasto' : 'Criar Novo Limite de Gasto'}</DialogTitle>
            <DialogDescription>
              Defina um limite de gastos para uma categoria para o mês atual.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Limite</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Mercado do mês" {...field} />
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
                          <SelectValue placeholder="Selecione a categoria para definir um limite" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                         <Separator className="my-1" />
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal h-8 px-2"
                          onClick={(e) => {
                             e.preventDefault();
                             setIsAddCategoryDialogOpen(true);
                          }}
                        >
                           <PlusCircle className="mr-2 h-4 w-4" />
                           Criar nova categoria...
                        </Button>
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
                    <FormLabel>Valor Limite (R$)</FormLabel>
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
              <DialogFooter>
                  <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || !user}
                  className="w-full"
                  >
                  {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? 'Salvar Alterações' : 'Salvar Limite'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria de Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-category-name">Nome da Categoria</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Pets, Assinaturas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Salvar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
