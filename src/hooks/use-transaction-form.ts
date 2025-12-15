

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, parseISO } from 'date-fns';
import { collection, doc, arrayUnion, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, CreditCard } from '@/lib/types';
import { subcategoryMap } from '@/lib/types';

const formSchema = z.object({
  category: z.string().min(1, 'Escolha uma categoria.'),
  subcategory: z.string().optional(),
  amount: z.coerce.number().positive('Use um valor maior que zero.'),
  date: z.date({
    required_error: 'Escolha uma data.',
  }),
  description: z.string().optional(),
  vendor: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceSchedule: z.string().optional(),
  status: z.enum(['paid', 'pending']).default('paid'),
  paymentMethod: z.enum(['cash', 'creditCard', 'pix']).default('cash'),
  creditCardId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'creditCard') {
        return !!data.creditCardId;
    }
    return true;
}, {
    message: "Selecione um cartão de crédito.",
    path: ["creditCardId"],
});


export type TransactionFormValues = z.infer<typeof formSchema>;

interface UseTransactionFormProps {
  transactionType: 'income' | 'expense';
  categories: readonly string[];
  transaction?: Transaction | null;
  onClose: () => void;
  vendors?: string[];
}

export function useTransactionForm({
  transactionType,
  categories,
  transaction,
  onClose,
  vendors = [],
}: UseTransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      vendor: '',
      amount: 0,
      category: '',
      subcategory: '',
      date: new Date(),
      isRecurring: false,
      recurrenceSchedule: 'monthly',
      status: 'paid',
      paymentMethod: 'cash',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddCardSheetOpen, setIsAddCardSheetOpen] = useState(false);
  
  const creditCardsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/creditCards`);
  }, [user, firestore]);

  const { data: creditCardsData } = useCollection<CreditCard>(creditCardsQuery);

  const allCategories = useMemo(() => {
    const customCategories = transactionType === 'income' 
      ? user?.customIncomeCategories 
      : user?.customExpenseCategories;
    
    const combined = new Set([...categories, ...(customCategories || [])]);

    return Array.from(combined);
  }, [categories, user, transactionType]);


  useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        description: transaction.description || '',
        vendor: (transaction as any).vendor || '',
        date: parseISO(transaction.date),
        status: transaction.status || 'paid',
        paymentMethod: transaction.creditCardId ? 'creditCard' : 'cash',
        creditCardId: transaction.creditCardId || undefined,
        recurrenceSchedule: transaction.recurrenceSchedule || 'monthly',
      });
    } else {
      form.reset({
        description: '',
        vendor: '',
        amount: 0,
        category: '',
        subcategory: '',
        date: new Date(),
        isRecurring: false,
        recurrenceSchedule: 'monthly',
        status: 'paid',
        paymentMethod: 'cash',
        creditCardId: undefined,
      });
    }
  }, [transaction, form]);
  
  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
        description: 'Entre na sua conta para registrar essa movimentação.',
      });
      return;
    }
    
    const collectionName = transactionType === 'income' ? 'incomes' : 'expenses';
    const collectionPath = `users/${user.uid}/${collectionName}`;
    
    const dataToSave: any = {
      ...values,
      date: formatISO(values.date),
      userId: user.uid,
      type: transactionType,
    };
    
    // Se a categoria não tiver subcategorias, limpe o campo subcategory
    if (!subcategoryMap[values.category as keyof typeof subcategoryMap]) {
        delete dataToSave.subcategory;
    }

    if (!values.isRecurring) {
        delete dataToSave.recurrenceSchedule;
    }
    
    if (transactionType === 'expense' && values.paymentMethod === 'creditCard' && values.creditCardId) {
      dataToSave.creditCardId = values.creditCardId;
    } else {
      delete dataToSave.creditCardId;
    }
    delete dataToSave.paymentMethod;

    try {
      if (transaction) {
        const docRef = doc(firestore, collectionPath, transaction.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast({
          title: 'Movimentação atualizada',
          description: 'Seu painel já foi atualizado.',
        });
      } else {
        await addDoc(collection(firestore, collectionPath), dataToSave);
        toast({
          title: 'Movimentação salva',
          description: `Sua ${transactionType === 'income' ? 'renda' : 'despesa'} já entrou no painel.`,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a transação. Tente novamente."
      });
    }
  };
  
  const handleAddCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) return;

    const fieldToUpdate = transactionType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        [fieldToUpdate]: arrayUnion(newCategoryName.trim())
      });
      toast({ title: 'Categoria adicionada', description: `"${newCategoryName.trim()}" foi incluída na sua lista.` });
      
      form.setValue('category', newCategoryName.trim());
      
      setNewCategoryName('');
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Não deu para salvar a categoria", description: "Tente de novo em alguns segundos." });
    }
  };

  return {
    form,
    user,
    allCategories,
    creditCardsData,
    vendors,
    isAddCategoryDialogOpen,
    setIsAddCategoryDialogOpen,
    newCategoryName,
    setNewCategoryName,
    isAddCardSheetOpen,
    setIsAddCardSheetOpen,
    onSubmit,
    handleAddCategory,
  };
}
