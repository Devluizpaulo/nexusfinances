'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '../ui/currency-input';
import { DatePicker } from '../ui/date-picker';

const formSchema = z.object({
  name: z.string().min(1, 'O nome da dívida é obrigatório.'),
  creditor: z.string().min(1, 'O credor é obrigatório.'),
  totalAmount: z.coerce.number().positive('O valor total deve ser positivo.'),
  numberOfInstallments: z.coerce.number().int().min(1, 'Deve haver pelo menos uma parcela.'),
  startDate: z.date({ required_error: 'A data da primeira parcela é obrigatória.' }),
});

type DebtFormValues = z.infer<typeof formSchema>;

type AddDebtSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddDebtSheet({ isOpen, onClose }: AddDebtSheetProps) {
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      creditor: '',
      totalAmount: 0,
      numberOfInstallments: 1,
      startDate: new Date(),
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const onSubmit = async (values: DebtFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
        description: 'Entre na sua conta para cadastrar dívidas.',
      });

      return;
    }

    try {
      const batch = writeBatch(firestore);
      
      const debtsColRef = collection(firestore, `users/${user.uid}/debts`);
      const newDebtRef = doc(debtsColRef);
      
      const debtData = {
        id: newDebtRef.id,
        name: values.name,
        creditor: values.creditor,
        totalAmount: values.totalAmount,
        paidAmount: 0,
        userId: user.uid,
      };

      batch.set(newDebtRef, debtData);

      const installmentAmount = values.totalAmount / values.numberOfInstallments;
      const installmentsColRef = collection(newDebtRef, 'installments');

      for (let i = 0; i < values.numberOfInstallments; i++) {
        const installmentRef = doc(installmentsColRef);
        const installmentData = {
          id: installmentRef.id,
          debtId: newDebtRef.id,
          userId: user.uid,
          installmentNumber: i + 1,
          amount: installmentAmount,
          dueDate: formatISO(addMonths(values.startDate, i)),
          status: 'unpaid' as const,
        };
        batch.set(installmentRef, installmentData);
      }

      await batch.commit();

      toast({
        title: 'Dívida adicionada',
        description: `${values.name} foi criada com ${values.numberOfInstallments} parcelas.`,
      });

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding debt: ", error);
      toast({
        variant: 'destructive',
        title: 'Não deu para salvar a dívida',
        description: 'Tente novamente em alguns segundos.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Dívida</DialogTitle>
          <DialogDescription>
            Cadastre um novo empréstimo ou compra parcelada. As parcelas serão geradas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Dívida</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Financiamento do Carro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$)</FormLabel>
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
              name="numberOfInstallments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Parcelas</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="12" {...field} step="1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Primeira Parcela</FormLabel>
                   <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
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
                Salvar Dívida e Gerar Parcelas
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
