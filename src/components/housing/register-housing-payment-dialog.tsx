
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { RentalContract } from '@/lib/types';
import { format, formatISO, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { CurrencyInput } from '../ui/currency-input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const additionalItemSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  amount: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
});

const paymentFormSchema = z.object({
  paymentDate: z.date({ required_error: 'A data do pagamento é obrigatória.' }),
  contractItems: z.array(z.string()),
  additionalItems: z.array(additionalItemSchema).optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface RegisterHousingPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentalContract;
}

export function RegisterHousingPaymentDialog({ isOpen, onClose, contract }: RegisterHousingPaymentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentDate: new Date(),
      contractItems: [],
      additionalItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'additionalItems',
  });

  const selectedContractItems = form.watch('contractItems');
  const additionalItems = form.watch('additionalItems');

  const availableContractItems = useMemo(() => {
    const items = [];
    if (contract.rentAmount && contract.rentAmount > 0) {
      items.push({ id: 'rent', label: 'Aluguel', amount: contract.rentAmount });
    }
    if (contract.condoFee && contract.condoFee > 0) {
      items.push({ id: 'condo', label: 'Condomínio', amount: contract.condoFee });
    }
    // Se não for aluguel nem condomínio, use o valor total como um item único
    if (items.length === 0 && contract.totalAmount > 0) {
        items.push({ id: 'total', label: contract.type, amount: contract.totalAmount });
    }
    return items;
  }, [contract]);

  useEffect(() => {
    if (isOpen) {
      // Pré-seleciona todos os itens disponíveis por padrão ao abrir
      const allItemIds = availableContractItems.map(item => item.id);
      form.reset({
        paymentDate: new Date(),
        contractItems: allItemIds,
        additionalItems: [],
      });
    }
  }, [isOpen, contract, form, availableContractItems]);

  const totalAmount = useMemo(() => {
    const contractItemsTotal = (selectedContractItems || []).reduce((sum, itemId) => {
        const item = availableContractItems.find(i => i.id === itemId);
        return sum + (item?.amount || 0);
    }, 0);
    const additionalItemsTotal = (additionalItems || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    return contractItemsTotal + additionalItemsTotal;
  }, [selectedContractItems, additionalItems, availableContractItems]);
  
  const onSubmit = async (values: PaymentFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você não está autenticado.' });
      return;
    }

    try {
        const expensesColRef = collection(firestore, `users/${user.uid}/expenses`);
        
        const mainItemsDescriptions = values.contractItems
          .map(itemId => availableContractItems.find(i => i.id === itemId)?.label)
          .filter(Boolean);
        const additionalItemsDescriptions = (values.additionalItems || []).map(i => i.description);

        const allDescriptions = [...mainItemsDescriptions, ...additionalItemsDescriptions];
        const description = allDescriptions.length > 0 ? allDescriptions.join(' + ') : `${contract.type} - ${contract.landlordName}`;
        
        const expenseData = {
            userId: user.uid,
            amount: totalAmount,
            category: 'Moradia' as const,
            date: formatISO(values.paymentDate),
            description,
            isRecurring: false,
            recurringSourceId: contract.id,
            status: 'paid' as const,
            type: 'expense' as const,
            notes: `Pagamento referente ao contrato com ${contract.landlordName}. Itens: ${JSON.stringify({contract: mainItemsDescriptions, additional: values.additionalItems})}`,
        };

        await addDoc(expensesColRef, expenseData);

        toast({
            title: 'Pagamento Registrado!',
            description: `Um lançamento de ${formatCurrency(totalAmount)} foi adicionado às suas despesas.`,
        });

        onClose();

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao registrar pagamento',
        description: 'Não foi possível salvar o lançamento. Tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento de Moradia</DialogTitle>
          <DialogDescription>
            Confirme os detalhes do pagamento para o contrato com &quot;{contract.landlordName}&quot;.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha a data</span>}
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
              name="contractItems"
              render={() => (
                <FormItem>
                    <FormLabel>Itens do Contrato</FormLabel>
                    <div className="rounded-md border bg-muted/30 p-4 space-y-2">
                        {availableContractItems.map((item) => (
                        <FormField
                            key={item.id}
                            control={form.control}
                            name="contractItems"
                            render={({ field }) => {
                            return (
                                <FormItem
                                key={item.id}
                                className="flex flex-row items-center justify-between"
                                >
                                <div className="flex items-center space-x-3">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                    {item.label}
                                    </FormLabel>
                                </div>
                                <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                                </FormItem>
                            )
                            }}
                        />
                        ))}
                         {availableContractItems.length === 0 && <p className="text-xs text-muted-foreground text-center">Nenhum item principal no contrato.</p>}
                    </div>
                </FormItem>
              )}
            />

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <FormLabel>Valores Adicionais (Opcional)</FormLabel>
                     <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => append({ description: '', amount: 0 })}>
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Adicionar
                    </Button>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr,120px,auto] gap-2 items-end">
                       <FormField
                        control={form.control}
                        name={`additionalItems.${index}.description`}
                        render={({ field }) => (
                           <FormItem>
                             <FormControl><Input {...field} placeholder="Ex: Multa por atraso" /></FormControl>
                             <FormMessage className="text-xs" />
                           </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name={`additionalItems.${index}.amount`}
                        render={({ field }) => (
                           <FormItem>
                                <FormControl>
                                    <CurrencyInput value={field.value} onValueChange={field.onChange} />
                                </FormControl>
                                <FormMessage className="text-xs" />
                           </FormItem>
                        )}
                        />
                         <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
            
            <Separator />

            <div className="rounded-md border-2 border-primary bg-primary/5 p-4 flex justify-between items-center">
                <p className="text-base font-bold text-primary">Valor Total a Pagar</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
