
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { incomeCategories } from '@/lib/types';

const otherIncomeCategories = incomeCategories.filter(
  c => c !== 'Salário' && c !== 'Freelance'
);

const formSchema = z.object({
  amount: z.coerce.number().positive('Use um valor maior que zero.'),
  date: z.date({
    required_error: 'Escolha uma data.',
  }),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  isRecurring: z.boolean().default(false),
  status: z.enum(['paid', 'pending']).default('paid'),
});

type OtherIncomeFormValues = z.infer<typeof formSchema>;

type AddOtherIncomeSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
};

export function AddOtherIncomeSheet({
  isOpen,
  onClose,
  transaction,
}: AddOtherIncomeSheetProps) {
  const form = useForm<OtherIncomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
      isRecurring: false,
      status: 'paid',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const allCategories = useMemo(() => {
    const customCategories = user?.customIncomeCategories || [];
    const combined = new Set([...otherIncomeCategories, ...customCategories]);
    return Array.from(combined);
  }, [user]);

  useEffect(() => {
    if (isOpen && transaction) {
      form.reset({
        ...transaction,
        description: transaction.description || '',
        date: parseISO(transaction.date),
        status: transaction.status || 'paid',
      });
    } else if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        category: '',
        date: new Date(),
        isRecurring: false,
        status: 'paid',
      });
    }
  }, [isOpen, transaction, form]);
  
  const onSubmit = (values: OtherIncomeFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }
    
    const collectionPath = `users/${user.uid}/incomes`;
    
    const dataToSave: any = {
      ...values,
      date: formatISO(values.date),
      userId: user.uid,
      type: 'income',
    };

    if (transaction) {
      const docRef = doc(firestore, collectionPath, transaction.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({
        title: 'Renda atualizada',
        description: 'Seu painel já foi atualizado.',
      });
    } else {
      addDocumentNonBlocking(collection(firestore, collectionPath), dataToSave);
      toast({
        title: 'Renda salva',
        description: `Sua renda de "${values.description}" já entrou no painel.`,
      });
    }
    
    onClose();
  };

  const title = transaction ? `Editar Renda` : `Adicionar Outra Renda`;
  const descriptionText = transaction ? 'Modifique os detalhes da sua renda.' : 'Adicione uma nova fonte de renda, como aluguéis ou rendimentos.';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
         <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Rendimento Poupança, Aluguel Apto 123..." {...field} />
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
                  <FormLabel>Valor Recebido (R$)</FormLabel>
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
                  <FormLabel>Data de Recebimento</FormLabel>
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
                        captionLayout="dropdown-nav"
                        fromYear={new Date().getFullYear() - 10}
                        toYear={new Date().getFullYear() + 10}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted p-3">
                  <div className="space-y-0.5">
                    <FormLabel>É uma renda recorrente?</FormLabel>
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
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recebido</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'paid'}
                      onCheckedChange={(checked) => field.onChange(checked ? 'paid' : 'pending')}
                    />
                  </FormControl>
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
                {transaction ? 'Salvar Alterações' : 'Salvar Renda'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
