

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, addDoc } from 'firebase/firestore';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CurrencyInput } from '../ui/currency-input';
import { Textarea } from '../ui/textarea';

import { utilitySubcategories, type UtilitySubcategory } from '@/lib/types';

const utilityTypes = utilitySubcategories;

const formSchema = z.object({
  utilityType: z.string().min(1, "Selecione o tipo de conta."),
  provider: z.string().min(1, 'O nome do fornecedor é obrigatório.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  consumption: z.string().optional(),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

type UtilityBillFormValues = z.infer<typeof formSchema>;

type AddUtilityBillSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddUtilityBillSheet({ isOpen, onClose }: AddUtilityBillSheetProps) {
  const form = useForm<UtilityBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      utilityType: '',
      provider: '',
      amount: 0,
      dueDate: new Date(),
      consumption: '',
      isRecurring: false,
      notes: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const onSubmit = async (values: UtilityBillFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }

    try {
      const expensesColRef = collection(firestore, `users/${user.uid}/expenses`);
      
      const expenseData = {
        amount: values.amount,
        category: 'Contas de Consumo',
        subcategory: values.utilityType,
        date: formatISO(values.dueDate),
        description: `${values.utilityType} - ${values.provider}`,
        consumption: values.consumption,
        isRecurring: values.isRecurring,
        notes: values.notes,
        status: 'pending' as const,
        type: 'expense' as const,
        userId: user.uid,
      };

      await addDoc(expensesColRef, expenseData);

      toast({
        title: 'Conta de Consumo Adicionada!',
        description: `A conta de ${values.utilityType} foi salva com sucesso.`,
      });

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding utility bill: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar conta',
        description: 'Não foi possível salvar a conta. Tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Conta de Consumo</DialogTitle>
          <DialogDescription>
            Cadastre uma nova conta de luz, água, internet, etc.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Conta</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {utilityTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Enel, Sabesp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
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
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
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
                        <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            initialFocus 
                            locale={ptBR}
                            defaultMonth={field.value}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="consumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 150 kWh, 25 m³" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Conta referente ao apto 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recorrente</FormLabel>
                    <DialogDescription className="text-xs">
                      Marque para que esta conta seja um modelo para os próximos meses.
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
            <DialogFooter>
                <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user}
                className="w-full"
                >
                {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Conta
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
