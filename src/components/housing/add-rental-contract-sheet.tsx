'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, setDate } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '../ui/separator';

const paymentMethodSchema = z.object({
    method: z.enum(['pix', 'bankTransfer', 'boleto']),
    pixKeyType: z.string().optional(),
    pixKey: z.string().optional(),
    bankName: z.string().optional(),
    agency: z.string().optional(),
    account: z.string().optional(),
  }).optional();


const formSchema = z.object({
  landlordName: z.string().min(1, 'O nome do proprietário ou imobiliária é obrigatório.'),
  rentAmount: z.coerce.number().positive('O valor do aluguel deve ser positivo.'),
  dueDate: z.coerce.number().int().min(1).max(31, 'O dia do vencimento deve ser entre 1 e 31.'),
  lateFee: z.coerce.number().min(0, 'A multa deve ser um valor positivo ou zero.').optional(),
  startDate: z.date({ required_error: 'A data de início do contrato é obrigatória.' }),
  endDate: z.date().optional(),
  paymentMethod: paymentMethodSchema,
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
      startDate: new Date(),
      paymentMethod: {
        method: 'boleto'
      }
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const paymentMethod = form.watch('paymentMethod.method');

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
      
      const contractData: any = {
        ...values,
        id: newContractRef.id,
        userId: user.uid,
        startDate: formatISO(values.startDate),
      };

      if (values.endDate) {
        contractData.endDate = formatISO(values.endDate);
      }

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
            Insira os detalhes do seu contrato. Uma despesa recorrente de aluguel será criada automaticamente.
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
            
            <Separator />
            
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Detalhes do Pagamento (Opcional)</h3>
                 <FormField
                    control={form.control}
                    name="paymentMethod.method"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Forma de Pagamento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um método"/>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="bankTransfer">Transferência Bancária</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                 />

                {paymentMethod === 'pix' && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                         <FormField
                            control={form.control}
                            name="paymentMethod.pixKeyType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Chave PIX</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tipo"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="phone">Celular</SelectItem>
                                            <SelectItem value="cpf_cnpj">CPF/CNPJ</SelectItem>
                                            <SelectItem value="random">Aleatória</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                         <FormField
                            control={form.control}
                            name="paymentMethod.pixKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chave PIX</FormLabel>
                                    <FormControl><Input placeholder="Sua chave PIX" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                    </div>
                )}
                
                {paymentMethod === 'bankTransfer' && (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="paymentMethod.bankName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Banco</FormLabel>
                                    <FormControl><Input placeholder="Nome do banco" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                        <FormField
                            control={form.control}
                            name="paymentMethod.agency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agência</FormLabel>
                                    <FormControl><Input placeholder="0001" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                         <FormField
                            control={form.control}
                            name="paymentMethod.account"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conta</FormLabel>
                                    <FormControl><Input placeholder="12345-6" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                    </div>
                )}

            </div>
            
            <Separator />
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
