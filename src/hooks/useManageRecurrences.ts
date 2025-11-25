
'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { startOfMonth, endOfMonth, formatISO, setDate, parseISO, isSameMonth } from 'date-fns';
import type { Transaction } from '@/lib/types';

const LAST_CHECK_KEY = 'recurrencesLastCheck';

export function useManageRecurrences() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [newlyCreatedTransactions, setNewlyCreatedTransactions] = useState<Transaction[]>([]);

  const manageRecurrences = useCallback(async () => {
    if (!user || !firestore) return;

    const now = new Date();
    const currentMonthStr = formatISO(now, { representation: 'date' }).substring(0, 7); 

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck === currentMonthStr) {
      return;
    }

    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const createdForSummary: Transaction[] = [];

    const processRecurrence = async (type: 'incomes' | 'expenses') => {
      const recurringTemplatesQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('isRecurring', '==', true)
      );

      const monthQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('date', '>=', formatISO(startOfCurrentMonth)),
        where('date', '<=', formatISO(endOfCurrentMonth))
      );

      const [recurringSnapshot, monthSnapshot] = await Promise.all([
        getDocs(recurringTemplatesQuery),
        getDocs(monthQuery),
      ]);
      
      const existingRecurringSourceIds = new Set(
        monthSnapshot.docs
          .map(doc => doc.data() as Transaction)
          .filter(t => t.recurringSourceId)
          .map(t => t.recurringSourceId)
      );
      
      for (const doc of recurringSnapshot.docs) {
        const templateId = doc.id;
        const template = doc.data() as Transaction;
        const templateDate = parseISO(template.date);

        if (existingRecurringSourceIds.has(templateId)) {
            continue;
        }

        if (isSameMonth(templateDate, now)) {
            continue;
        }

        let newDate = setDate(now, templateDate.getDate());
        
        if (newDate.getMonth() !== now.getMonth()) {
            newDate = endOfMonth(now);
        }

        const newTransaction: Omit<Transaction, 'id'> & { type: 'income' | 'expense' } = {
          ...template,
          type: type === 'incomes' ? 'income' : 'expense',
          date: formatISO(newDate, { representation: 'date' }),
          isRecurring: false, 
          recurringSourceId: templateId,
          status: 'pending',
        };
        
        // This is fire-and-forget, but we can capture the object for the summary
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

    localStorage.setItem(LAST_CHECK_KEY, currentMonthStr);

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
