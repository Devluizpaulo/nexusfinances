
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, setDate, addYears, parseISO } from 'date-fns';
import { collection, doc, writeBatch, addDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { RentalContract } from '@/lib/types';

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

export type RentalFormValues = z.infer<typeof formSchema>;

interface UseRentalContractFormProps {
  contract?: RentalContract | null;
  onClose: () => void;
}

export function useRentalContractForm({ contract, onClose }: UseRentalContractFormProps) {
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
  
  const isEditing = !!contract;
  const contractType = form.watch('type');
  const rentAmount = form.watch('rentAmount');
  const condoFee = form.watch('condoFee');
  const startDate = form.watch('startDate');
  const paymentMethod = form.watch('paymentMethod');

  // Calculate total amount whenever rent or condo fee changes
  useEffect(() => {
    const safeRent = rentAmount || 0;
    const safeCondo = condoFee || 0;

    let total = 0;
    if (contractType === 'Aluguel') total = safeRent;
    else if (contractType === 'Condomínio') total = safeCondo;
    else if (contractType === 'Aluguel + Condomínio') total = safeRent + safeCondo;
    else total = form.getValues('totalAmount');

    const currentTotal = form.getValues('totalAmount');
    if (!Number.isNaN(total) && total !== currentTotal) {
      form.setValue('totalAmount', total, { shouldValidate: true });
    }
  }, [rentAmount, condoFee, contractType, form]);

  // Populate form for editing
  useEffect(() => {
    if (contract) {
      form.reset({
        ...contract,
        startDate: contract.startDate ? parseISO(contract.startDate) : new Date(),
        endDate: contract.endDate ? parseISO(contract.endDate) : undefined,
        paymentPeriodicity: contract.paymentPeriodicity || 'Mensal',
        status: contract.status || 'active',
        paymentMethod: contract.paymentMethod ?? { method: 'boleto' },
      });
    } else {
      form.reset({
        landlordName: '', type: 'Aluguel + Condomínio', rentAmount: 0,
        condoFee: 0, totalAmount: 0, dueDate: 5, paymentPeriodicity: 'Mensal',
        startDate: new Date(), endDate: addYears(new Date(), 1), isAutoRenew: false,
        paymentMethod: { method: 'boleto' }, status: 'active',
      });
    }
  }, [contract, form]);

  // Auto-suggest end date for new contracts
  useEffect(() => {
    if (startDate && !isEditing) {
      const suggestedEndDate = addYears(startDate, 1);
      form.setValue('endDate', suggestedEndDate);
    }
  }, [startDate, isEditing, form]);

  const onSubmit = async (values: RentalFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }

    try {
      const batch = writeBatch(firestore);

      const contractData: any = {
        ...values,
        userId: user.uid,
        startDate: formatISO(values.startDate),
        endDate: values.endDate ? formatISO(values.endDate) : null,
      };
      
      Object.keys(contractData).forEach((key) => {
        if (contractData[key] === undefined) delete contractData[key];
      });

      if (isEditing) {
        const contractRef = doc(firestore, `users/${user.uid}/rentalContracts`, contract.id);
        batch.set(contractRef, contractData, { merge: true });
        toast({ title: 'Contrato de Aluguel Atualizado!', description: 'As informações do contrato foram salvas.' });
      } else {
        const contractsColRef = collection(firestore, `users/${user.uid}/rentalContracts`);
        const newContractRef = doc(contractsColRef);
        contractData.id = newContractRef.id;
        batch.set(newContractRef, contractData);

        const expensesColRef = collection(firestore, `users/${user.uid}/expenses`);
        const newExpenseRef = doc(expensesColRef);
        const expenseData = {
          id: newExpenseRef.id, userId: user.uid, amount: values.totalAmount, category: 'Moradia' as const,
          date: formatISO(setDate(new Date(), values.dueDate)), description: `${values.type} - ${values.landlordName}`,
          isRecurring: true, recurringSourceId: newContractRef.id, status: 'pending' as const, type: 'expense' as const,
        };
        batch.set(newExpenseRef, expenseData);
        toast({ title: 'Contrato de Aluguel Adicionado!', description: `Uma despesa recorrente de ${values.type.toLowerCase()} foi criada.` });
      }

      await batch.commit();
      onClose();

    } catch (error) {
      console.error("Error adding/editing rental contract: ", error);
      toast({ variant: 'destructive', title: 'Erro ao salvar contrato', description: 'Tente novamente.' });
    }
  };

  return { form, user, onSubmit, contractType, paymentMethod };
}
