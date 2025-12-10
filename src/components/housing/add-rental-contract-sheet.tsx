
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, setDate, addYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { cn, formatCurrency } from '@/lib/utils';
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
  FormDescription,
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
import type { RentalContract } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';


const paymentMethodSchema = z.object({
    method: z.enum(['pix', 'bankTransfer', 'boleto', 'creditCard', 'cash', 'debit']),
    instructions: z.string().optional(),
    identifier: z.string().optional(),
  }).optional();


const formSchema = z.object({
  landlordName: z.string().min(1, 'O nome do proprietário ou imobiliária é obrigatório.'),
  type: z.enum(['Aluguel', 'Condomínio', 'Aluguel + Condomínio', 'Outros']),
  rentAmount: z.coerce.number().min(0, 'O valor não pode ser negativo.').optional(),
  condoFee: z.coerce.number().min(0, 'O valor não pode ser negativo.').optional(),
  totalAmount: z.coerce.number().positive('O valor total deve ser positivo.'),
  dueDate: z.coerce.number().int().min(1).max(31, 'O dia do vencimento deve ser entre 1 e 31.'),
  paymentPeriodicity: z.enum(['Mensal', 'Bimestral', 'Trimestral', 'Anual']).default('Mensal'),
  startDate: z.date({ required_error: 'A data de início do contrato é obrigatória.' }),
  endDate: z.date().optional(),
  isAutoRenew: z.boolean().default(false),
  propertyAddress: z.string().optional(),
  securityDeposit: z.coerce.number().min(0, 'O valor deve ser positivo ou zero.').optional(),
  notes: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  status: z.enum(['active', 'inactive']).default('active'),
}).refine(data => {
    // Only perform validation if 'type' is a valid string
    if (typeof data.type === 'string') {
        if (data.type.includes('Aluguel') && (data.rentAmount === undefined || data.rentAmount === 0)) {
            return false;
        }
        if (data.type.includes('Condomínio') && (data.condoFee === undefined || data.condoFee === 0)) {
            return false;
        }
    }
    return true;
}, {
    message: "Informe o valor correspondente ao tipo de contrato.",
    path: ["totalAmount"],
});

type RentalFormValues = z.infer<typeof formSchema>;

type AddRentalContractSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  contract?: RentalContract | null;
};

export function AddRentalContractSheet({ isOpen, onClose, contract }: AddRentalContractSheetProps) {
  const form = useForm<RentalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landlordName: '',
      type: 'Aluguel + Condomínio',
      rentAmount: 0,
      condoFee: 0,
      totalAmount: 0,
      dueDate: 5,
      paymentPeriodicity: 'Mensal',
      startDate: new Date(),
      isAutoRenew: false,
      paymentMethod: {
        method: 'boleto'
      },
      status: 'active'
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const startDate = form.watch('startDate');
  const contractType = form.watch('type');
  const rentAmount = form.watch('rentAmount');
  const condoFee = form.watch('condoFee');
  const paymentMethod = form.watch('paymentMethod');
  const isEditing = !!contract;
  
  // Calculate total amount whenever rent or condo fee changes
  useEffect(() => {
    const safeRent = rentAmount || 0;
    const safeCondo = condoFee || 0;

    let total = 0;
    if (contractType === 'Aluguel') total = safeRent;
    else if (contractType === 'Condomínio') total = safeCondo;
    else if (contractType === 'Aluguel + Condomínio') total = safeRent + safeCondo;
    else total = form.getValues('totalAmount'); // For 'Outros', let user define total

    const currentTotal = form.getValues('totalAmount');
    if (!Number.isNaN(total) && total !== currentTotal) {
      form.setValue('totalAmount', total, { shouldValidate: true });
    }

  }, [rentAmount, condoFee, contractType, form]);


  // Populate form for editing
  useEffect(() => {
    if (contract && isOpen) {
      form.reset({
        ...contract,
        startDate: contract.startDate ? parseISO(contract.startDate) : new Date(),
        endDate: contract.endDate ? parseISO(contract.endDate) : undefined,
        paymentPeriodicity: contract.paymentPeriodicity || 'Mensal',
        status: contract.status || 'active',
        paymentMethod: contract.paymentMethod ?? { method: 'boleto' },
      });
    } else {
      // Reset for new contract
      form.reset({
        landlordName: '',
        type: 'Aluguel + Condomínio',
        rentAmount: 0,
        condoFee: 0,
        totalAmount: 0,
        dueDate: 5,
        paymentPeriodicity: 'Mensal',
        startDate: new Date(),
        endDate: addYears(new Date(), 1),
        isAutoRenew: false,
        paymentMethod: { method: 'boleto' },
        status: 'active',
      });
    }
  }, [contract, isOpen, form]);


  // Auto-suggest end date as 1 year from start date for new contracts
  useEffect(() => {
    if (startDate && !isEditing) {
      const suggestedEndDate = addYears(startDate, 1);
      form.setValue('endDate', suggestedEndDate);
    }
  }, [startDate, isEditing, form]);

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

      const contractData: any = {
        ...values,
        userId: user.uid,
        startDate: formatISO(values.startDate),
      };

      if (values.endDate) {
        contractData.endDate = formatISO(values.endDate);
      } else {
        contractData.endDate = null;
      }

      // Remove campos undefined para evitar erros do Firestore (ex.: notes: undefined)
      Object.keys(contractData).forEach((key) => {
        if (contractData[key] === undefined) {
          delete contractData[key];
        }
      });

      if (isEditing) {
        const contractRef = doc(firestore, `users/${user.uid}/rentalContracts`, contract.id);
        batch.set(contractRef, contractData, { merge: true });
        toast({
          title: 'Contrato de Aluguel Atualizado!',
          description: `As informações do contrato foram salvas.`,
        });

      } else {
        const contractsColRef = collection(firestore, `users/${user.uid}/rentalContracts`);
        const newContractRef = doc(contractsColRef);
        contractData.id = newContractRef.id;
        batch.set(newContractRef, contractData);

        const expensesColRef = collection(firestore, `users/${user.uid}/expenses`);
        const newExpenseRef = doc(expensesColRef);
        const expenseData = {
          id: newExpenseRef.id,
          userId: user.uid,
          amount: values.totalAmount,
          category: 'Moradia',
          date: formatISO(setDate(new Date(), values.dueDate)),
          description: `${values.type} - ${values.landlordName}`,
          isRecurring: true,
          recurringSourceId: newContractRef.id,
          status: 'pending' as const,
          type: 'expense' as const,
        };
        batch.set(newExpenseRef, expenseData);
        toast({
          title: 'Contrato de Aluguel Adicionado!',
          description: `Uma despesa recorrente de ${values.type.toLowerCase()} foi criada automaticamente para você.`,
        });
      }


      await batch.commit();
      onClose();

    } catch (error) {
      console.error("Error adding/editing rental contract: ", error);
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
          <DialogTitle>{isEditing ? 'Editar Contrato de Moradia' : 'Cadastrar Contrato de Moradia'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do seu contrato.' : 'Insira os detalhes do seu contrato. Uma despesa recorrente será criada automaticamente.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground pt-2">Informações do Contrato</h3>
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
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Aluguel">Aluguel</SelectItem>
                      <SelectItem value="Condomínio">Condomínio</SelectItem>
                      <SelectItem value="Aluguel + Condomínio">Aluguel + Condomínio</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                {(contractType === 'Aluguel' || contractType === 'Aluguel + Condomínio') && (
                    <FormField
                        control={form.control}
                        name="rentAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor do Aluguel (R$)</FormLabel>
                            <FormControl>
                            <CurrencyInput
                                value={field.value || 0}
                                onValueChange={(value) => field.onChange(value)}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                 {(contractType === 'Condomínio' || contractType === 'Aluguel + Condomínio') && (
                    <FormField
                        control={form.control}
                        name="condoFee"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor do Condomínio (R$)</FormLabel>
                            <FormControl>
                            <CurrencyInput
                                value={field.value || 0}
                                onValueChange={(value) => field.onChange(value)}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>

            <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total da Cobrança (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={contractType !== 'Outros'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="paymentPeriodicity"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Periodicidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Mensal">Mensal</SelectItem>
                                <SelectItem value="Bimestral">Bimestral</SelectItem>
                                <SelectItem value="Trimestral">Trimestral</SelectItem>
                                <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
                />
            </div>
            
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground">Vigência do Contrato</h3>
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
                        <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            initialFocus 
                            locale={ptBR} 
                            captionLayout="dropdown"
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
                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Sem data final</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            locale={ptBR}
                            captionLayout="dropdown"
                            fromYear={new Date().getFullYear() - 10}
                            toYear={new Date().getFullYear() + 10}
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
              name="isAutoRenew"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Renovação Automática</FormLabel>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground">Meio de Pagamento</h3>
            <FormField
              control={form.control}
              name="paymentMethod"
              render={() => (
                <div className="space-y-3">
                  <FormItem>
                    <FormLabel>Forma principal de pagamento</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          form.setValue('paymentMethod', {
                            ...(paymentMethod || {}),
                            method: value as any,
                          })
                        }
                        value={paymentMethod?.method || 'boleto'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o meio de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="bankTransfer">Transferência Bancária</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="creditCard">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit">Cartão de Débito</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Essas informações ajudam você a lembrar como realizar o pagamento todo mês.
                    </FormDescription>
                  </FormItem>

                  {paymentMethod?.method === 'pix' && (
                    <div className="grid gap-3">
                      <FormItem>
                        <FormLabel>Chave PIX</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E-mail, CPF, CNPJ, telefone ou chave aleatória"
                            value={paymentMethod.identifier || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'pix',
                                identifier: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Detalhes adicionais (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex.: Chave em nome de João Silva, CPF 000.000.000-00"
                            value={paymentMethod.instructions || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'pix',
                                instructions: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}

                  {paymentMethod?.method === 'bankTransfer' && (
                    <div className="grid gap-3">
                      <FormItem>
                        <FormLabel>Dados bancários</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              'Banco, agência, conta, tipo de conta, titular, CPF/CNPJ...\nEx.: Banco XPTO, ag. 0000, conta 000000-0, cc, João Silva, CPF 000.000.000-00'
                            }
                            value={paymentMethod.instructions || ''}
                            onChange={(e) => {
                              const full = e.target.value;
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'bankTransfer',
                                instructions: full,
                                // Pequeno resumo para exibição/cópia rápida
                                identifier:
                                  paymentMethod?.identifier ||
                                  (full ? full.split('\n')[0]?.slice(0, 80) : ''),
                              });
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Detalhe aqui tudo o que você precisa para fazer a transferência.
                        </FormDescription>
                      </FormItem>
                    </div>
                  )}

                  {paymentMethod?.method === 'boleto' && (
                    <div className="grid gap-3">
                      <FormItem>
                        <FormLabel>Como você recebe o boleto?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              'Ex.: Recebo o boleto por e-mail da imobiliária, acesso o app do banco tal, ou faço download no portal X.'
                            }
                            value={paymentMethod.instructions || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'boleto',
                                instructions: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Identificador (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex.: E-mail da imobiliária, portal, código de cliente..."
                            value={paymentMethod.identifier || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'boleto',
                                identifier: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}

                  {paymentMethod?.method &&
                    !['pix', 'bankTransfer', 'boleto'].includes(paymentMethod.method) && (
                      <FormItem>
                        <FormLabel>Detalhes do pagamento (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anote aqui qualquer informação útil para lembrar como você paga este contrato."
                            value={paymentMethod.instructions || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                instructions: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                </div>
              )}
            />

            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground">Informações Adicionais (Opcional)</h3>
            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço do Imóvel</FormLabel>
                  <FormControl><Input placeholder="Rua, número, bairro..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Gerais</FormLabel>
                    <FormControl><Textarea placeholder="Detalhes importantes, contatos, etc." {...field} /></FormControl>
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
                {isEditing ? 'Salvar Alterações' : 'Salvar Contrato'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
