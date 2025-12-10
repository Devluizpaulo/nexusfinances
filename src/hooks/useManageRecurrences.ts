
'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { startOfMonth, endOfMonth, formatISO, setDate, parseISO, isSameMonth, addMonths } from 'date-fns';
import type { Transaction } from '@/lib/types';

const LAST_CHECK_KEY = 'recurrencesLastCheck_v2';

export function useManageRecurrences() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [newlyCreatedTransactions, setNewlyCreatedTransactions] = useState<Transaction[]>([]);

  const manageRecurrences = useCallback(async () => {
    if (!user || !firestore) return;

    const now = new Date();
    const currentMonthIdentifier = formatISO(now, { representation: 'date' }).substring(0, 7); 

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck === currentMonthIdentifier) {
      return;
    }

    const createdForSummary: Transaction[] = [];

    const processRecurrence = async (type: 'incomes' | 'expenses') => {
      const recurringTemplatesQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('isRecurring', '==', true)
      );

      const recurringSnapshot = await getDocs(recurringTemplatesQuery);
      
      for (const doc of recurringSnapshot.docs) {
        const template = doc.data() as Transaction;
        const templateId = doc.id;
        const lastCreatedDate = parseISO(template.date);

        const schedule = template.recurrenceSchedule || 'monthly';
        let monthsToAdd = 1;
        if (schedule === 'quarterly') monthsToAdd = 3;
        else if (schedule === 'semiannual') monthsToAdd = 6;
        else if (schedule === 'annual') monthsToAdd = 12;

        let nextDueDate = addMonths(lastCreatedDate, monthsToAdd);
        
        // Se a próxima data de vencimento ainda não chegou, não faz nada
        if (nextDueDate > now) {
            continue;
        }
        
        // Verifica se já existe uma transação para este template neste mês
        const monthQuery = query(
          collection(firestore, `users/${user.uid}/${type}`),
          where('recurringSourceId', '==', templateId),
          where('date', '>=', formatISO(startOfMonth(now))),
          where('date', '<=', formatISO(endOfMonth(now)))
        );
        
        const monthSnapshot = await getDocs(monthQuery);
        if(!monthSnapshot.empty) {
            continue;
        }

        const newTransaction: Omit<Transaction, 'id'> & { type: 'income' | 'expense' } = {
          ...template,
          type: type === 'incomes' ? 'income' : 'expense',
          date: formatISO(nextDueDate, { representation: 'date' }),
          isRecurring: false, 
          recurringSourceId: templateId,
          status: 'pending',
        };
        
        const docRef = await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/${type}`), newTransaction);
        if (docRef) {
          createdForSummary.push({ ...newTransaction, id: docRef.id });
        }
      }
    };

    await Promise.all([
        processRecurrence('incomes'),
        processRecurrence('expenses')
    ]);

    if (createdForSummary.length > 0) {
      setNewlyCreatedTransactions(createdForSummary);
    }

    localStorage.setItem(LAST_CHECK_KEY, currentMonthIdentifier);

  }, [user, firestore]);

  useEffect(() => {
    if(user) {
        manageRecurrences();
    }
  }, [manageRecurrences, user]);

  return {
    newlyCreatedTransactions,
    clearNewlyCreatedTransactions: () => setNewlyCreatedTransactions([]),
  };
}
