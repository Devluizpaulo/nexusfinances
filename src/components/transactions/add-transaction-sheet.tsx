'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc, arrayUnion, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
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
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { CurrencyInput } from '../ui/currency-input';
import { Separator } from '../ui/separator';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  category: z.string().min(1, 'A categoria é obrigatória.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type TransactionFormValues = z.infer<typeof formSchema>;

type AddTransactionSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionType: 'income' | 'expense';
  categories: readonly string[];
  transaction?: Transaction | null;
};

export function AddTransactionSheet({
  isOpen,
  onClose,
  transactionType,
  categories,
  transaction,
}: AddTransactionSheetProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
      isRecurring: false,
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');


  const allCategories = useMemo(() => {
    const customCategories = transactionType === 'income' 
      ? user?.customIncomeCategories 
      : user?.customExpenseCategories;
    
    const combined = new Set([...categories, ...(customCategories || [])]);

    return Array.from(combined);
  }, [categories, user, transactionType]);


  useEffect(() => {
    if (isOpen && transaction) {
      form.reset({
        ...transaction,
        description: transaction.description || '',
        date: parseISO(transaction.date),
      });
    } else if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        category: '',
        date: new Date(),
        isRecurring: false,
      });
    }
  }, [isOpen, transaction, form]);


  const onSubmit = (values: TransactionFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para gerenciar transações.',
      });
      return;
    }
    
    const collectionName = transactionType === 'income' ? 'incomes' : 'expenses';
    const collectionPath = `users/${user.uid}/${collectionName}`;
    
    const dataToSave = {
      ...values,
      date: formatISO(values.date),
      userId: user.uid,
      type: transactionType,
    };

    if (transaction) {
      const docRef = doc(firestore, collectionPath, transaction.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({
        title: 'Transação atualizada!',
        description: `Sua ${transactionType === 'income' ? 'renda' : 'despesa'} foi atualizada com sucesso.`,
      });
    } else {
      addDocumentNonBlocking(collection(firestore, collectionPath), dataToSave);
      toast({
        title: 'Transação salva!',
        description: `Sua ${transactionType === 'income' ? 'renda' : 'despesa'} foi adicionada com sucesso.`,
      });
    }
    
    onClose();
  };
  
  const handleAddCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) return;

    const fieldToUpdate = transactionType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        [fieldToUpdate]: arrayUnion(newCategoryName.trim())
      });
      toast({ title: 'Categoria Adicionada!', description: `"${newCategoryName.trim()}" foi adicionada.` });
      
      // Set the newly added category in the form
      form.setValue('category', newCategoryName.trim());
      
      setNewCategoryName('');
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar a categoria." });
    }
  };


  const title = transaction ? `Editar ${transactionType === 'income' ? 'Renda' : 'Despesa'}` : `Adicionar ${transactionType === 'income' ? 'Renda' : 'Despesa'}`;
  const description = transaction ? 'Modifique os detalhes da sua transação.' : `Adicione uma nova ${transactionType === 'income' ? 'entrada de renda' : 'saída para suas despesas'}.`;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
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
                  <FormLabel>Valor (R$)</FormLabel>
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Salário da empresa, compra do mês no mercado X..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-secondary p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recorrente</FormLabel>
                    <FormDescription>
                      Esta transação se repetirá todo mês.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !user}
              className="w-full"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {transaction ? 'Salvar Alterações' : 'Salvar Transação'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
     <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
          <DialogDescription>
            Adicione uma nova categoria de {transactionType === 'income' ? 'renda' : 'despesa'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-category-name">Nome da Categoria</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Educação"
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
