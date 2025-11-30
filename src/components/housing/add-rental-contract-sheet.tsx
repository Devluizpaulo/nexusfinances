'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO } from 'date-fns';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CurrencyInput } from '../ui/currency-input';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  landlordName: z.string().min(1, 'O nome do proprietário ou imobiliária é obrigatório.'),
  rentAmount: z.coerce.number().positive('O valor do aluguel deve ser positivo.'),
  dueDate: z.coerce.number().int().min(1).max(31, 'O dia do vencimento deve ser entre 1 e 31.'),
  lateFee: z.coerce.number().min(0, 'A multa deve ser um valor positivo ou zero.').optional(),
  paymentDetails: z.string().optional(),
  startDate: z.date({ required_error: 'A data de início do contrato é obrigatória.' }),
  endDate: z.date().optional(),
});

type RentalFormValues = z.infer<typeof formSchema>;

type AddRentalContractSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddRentalContractSheet({ isOpen, onClose }: AddRentalContractSheetProps) {
  const form = useForm<RentalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landlordName: '',
      rentAmount: 0,
      dueDate: 5,
      lateFee: 0,
      paymentDetails: '',
      startDate: new Date(),
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const onSubmit = async (values: RentalFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      
      const contractsColRef = collection(firestore, `users/${user.uid}/rentalContracts`);
      const newContractRef = doc(contractsColRef);
      
      const contractData = {
        ...values,
        id: newContractRef.id,
        userId: user.uid,
        startDate: formatISO(values.startDate),
        endDate: values.endDate ? formatISO(values.endDate) : undefined,
      };

      batch.set(newContractRef, contractData);

      // Create a corresponding recurring expense
      const expensesColRef = collection(firestore, `users/${user.uid}/expenses`);
      const newExpenseRef = doc(expensesColRef);
      const expenseData = {
        id: newExpenseRef.id,
        userId: user.uid,
        amount: values.rentAmount,
        category: 'Moradia',
        date: formatISO(setDate(new Date(), values.dueDate)), // Set initial date for this month
        description: `Aluguel - ${values.landlordName}`,
        isRecurring: true,
        recurringSourceId: newContractRef.id, // Link to the contract
        status: 'pending' as const,
        type: 'expense' as const,
      };
      batch.set(newExpenseRef, expenseData);


      await batch.commit();

      toast({
        title: 'Contrato de Aluguel Adicionado!',
        description: `Uma despesa recorrente de aluguel foi criada automaticamente para você.`,
      });

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding rental contract: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar contrato',
        description: 'Tente novamente em alguns segundos.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Contrato de Aluguel</DialogTitle>
          <DialogDescription>
            Insira os detalhes do seu contrato de aluguel. Uma despesa recorrente será criada automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="landlordName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietário / Imobiliária</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Imobiliária X Ltda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Aluguel (R$)</FormLabel>
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="paymentDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes do Pagamento (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Chave PIX: email@exemplo.com, Conta: 1234-5 Ag: 0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Início do Contrato</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fim do Contrato (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <DialogFooter>
                <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user}
                className="w-full"
                >
                {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Contrato
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
