

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, parseISO } from 'date-fns';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';

const formSchema = z.object({
  amount: z.coerce.number().positive('Use um valor maior que zero.'),
  date: z.date({
    required_error: 'Escolha uma data.',
  }),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  isRecurring: z.boolean().default(false),
  status: z.enum(['paid', 'pending']).default('paid'),
});

type FreelancerFormValues = z.infer<typeof formSchema>;

type AddFreelancerSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
};

export function AddFreelancerSheet({
  isOpen,
  onClose,
  transaction,
}: AddFreelancerSheetProps) {
  const form = useForm<FreelancerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      isRecurring: false,
      status: 'paid',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

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
        date: new Date(),
        isRecurring: false,
        status: 'paid',
      });
    }
  }, [isOpen, transaction, form]);
  
  const onSubmit = async (values: FreelancerFormValues) => {
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
      category: 'Freelance', // Hardcoded category
      date: formatISO(values.date),
      userId: user.uid,
      type: 'income',
    };

    try {
      if (transaction) {
        const docRef = doc(firestore, collectionPath, transaction.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast({
          title: 'Renda atualizada',
          description: 'Seu painel já foi atualizado.',
        });
      } else {
        await addDoc(collection(firestore, collectionPath), dataToSave);
        toast({
          title: 'Renda salva',
          description: `Sua renda de freelancer já entrou no painel.`,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving freelancer income:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a renda. Tente novamente."
      });
    }
  };

  const title = transaction ? `Editar Renda Freelancer` : `Adicionar Renda Freelancer`;
  const descriptionText = transaction ? 'Modifique os detalhes da sua renda.' : 'Adicione um novo recebimento de um projeto ou serviço.';

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
                <FormItem>
                  <FormLabel>Data de Recebimento</FormLabel>
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Projeto de design para Empresa X, Consultoria de SEO..." {...field} />
                  </FormControl>
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
                    <FormLabel>Contrato Recorrente</FormLabel>
                    <DialogDescription className="text-xs">
                      É um contrato mensal fixo?
                    </DialogDescription>
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
                    <DialogDescription className="text-xs">
                      Marque se o valor já foi pago.
                    </DialogDescription>
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
