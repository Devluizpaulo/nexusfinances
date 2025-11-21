
'use client';

import { useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { startOfMonth, endOfMonth, formatISO, setDate, parseISO } from 'date-fns';
import type { Transaction } from '@/lib/types';

const LAST_CHECK_KEY = 'recurrencesLastCheck';

export function useManageRecurrences() {
  const firestore = useFirestore();
  const { user } = useUser();

  const manageRecurrences = useCallback(async () => {
    if (!user || !firestore) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if we've already run this process today
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck === todayStr) {
      return;
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const processRecurrence = async (type: 'incomes' | 'expenses') => {
      // 1. Get all recurring templates for the type
      const recurringQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('isRecurring', '==', true)
      );

      // 2. Get all transactions for the current month
      const monthQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('date', '>=', formatISO(startOfCurrentMonth)),
        where('date', '<=', formatISO(endOfCurrentMonth))
      );

      const [recurringSnapshot, monthSnapshot] = await Promise.all([
        getDocs(recurringQuery),
        getDocs(monthQuery),
      ]);
      
      // 3. Create a set of recurring transactions already created this month
      const existingRecurringSourceIds = new Set(
        monthSnapshot.docs
          .map(doc => doc.data() as Transaction)
          .filter(t => t.recurringSourceId)
          .map(t => t.recurringSourceId)
      );
      
      // 4. Create transactions that are missing
      for (const doc of recurringSnapshot.docs) {
        const templateId = doc.id;
        
        if (!existingRecurringSourceIds.has(templateId)) {
          const template = doc.data() as Transaction;
          const originalDate = parseISO(template.date);
          const newDate = setDate(startOfCurrentMonth, originalDate.getDate());

          const newTransaction = {
            ...template,
            date: formatISO(newDate),
            // Important: This is a generated instance of a recurring transaction, 
            // so it is NOT recurring itself.
            isRecurring: false, 
            // Link back to the original recurring template
            recurringSourceId: templateId, 
          };
          // a fire-and-forget operation
          addDocumentNonBlocking(collection(firestore, `users/${user.uid}/${type}`), newTransaction);
        }
      }
    };

    await Promise.all([
        processRecurrence('incomes'),
        processRecurrence('expenses')
    ]);

    // Mark that we've run the process for today
    localStorage.setItem(LAST_CHECK_KEY, todayStr);

  }, [user, firestore]);

  useEffect(() => {
    manageRecurrences();
  }, [manageRecurrences]);
}
