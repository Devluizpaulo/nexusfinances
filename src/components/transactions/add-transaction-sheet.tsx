'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';

const formSchema = z.object({
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
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

  useEffect(() => {
    if (isOpen && transaction) {
      form.reset({
        ...transaction,
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
      // Editing existing transaction
      const docRef = doc(firestore, collectionPath, transaction.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({
        title: 'Transação atualizada!',
        description: `Sua ${transactionType === 'income' ? 'renda' : 'despesa'} foi atualizada com sucesso.`,
      });
    } else {
      // Adding new transaction
      addDocumentNonBlocking(collection(firestore, collectionPath), dataToSave);
      toast({
        title: 'Transação salva!',
        description: `Sua ${transactionType === 'income' ? 'renda' : 'despesa'} foi adicionada com sucesso.`,
      });
    }
    
    onClose();
  };

  const title = transaction ? `Editar ${transactionType === 'income' ? 'Renda' : 'Despesa'}` : `Adicionar ${transactionType === 'income' ? 'Renda' : 'Despesa'}`;
  const description = transaction ? 'Modifique os detalhes da sua transação.' : `Adicione uma nova ${transactionType === 'income' ? 'entrada de renda' : 'saída para suas despesas'}.`;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salário, Compras do mês" {...field} />
                  </FormControl>
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
                    <Input type="number" placeholder="0,00" {...field} step="0.01" />
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
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
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recorrente</FormLabel>
                    <FormDescription>
                      Esta transação se repete mensalmente.
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
      </SheetContent>
    </Sheet>
  );
}
