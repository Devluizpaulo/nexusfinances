
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
import { startOfMonth, endOfMonth, formatISO, setDate } from 'date-fns';
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
      const recurringQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('isRecurring', '==', true)
      );

      const existingQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('date', '>=', formatISO(startOfCurrentMonth)),
        where('date', '<=', formatISO(endOfCurrentMonth)),
        where('isRecurring', '==', true)
      );

      const [recurringSnapshot, existingSnapshot] = await Promise.all([
        getDocs(recurringQuery),
        getDocs(existingQuery),
      ]);
      
      const existingDescriptions = new Set(
        existingSnapshot.docs.map(doc => doc.data().description)
      );

      for (const doc of recurringSnapshot.docs) {
        const template = doc.data() as Transaction;
        
        if (!existingDescriptions.has(template.description)) {
          const originalDate = new Date(template.date);
          const newDate = setDate(startOfCurrentMonth, originalDate.getDate());

          const newTransaction = {
            ...template,
            date: formatISO(newDate),
            // Important: This is a generated instance of a recurring transaction, so it is NOT recurring itself
            isRecurring: false, 
            recurringSourceId: doc.id, // Link back to the original recurring template
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
