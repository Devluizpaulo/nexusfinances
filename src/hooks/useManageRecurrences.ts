
'use client';

import { useEffect, useCallback } from 'react';
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

  const manageRecurrences = useCallback(async () => {
    if (!user || !firestore) return;

    const now = new Date();
    // Use a format like 'YYYY-MM' to check once per month.
    const currentMonthStr = formatISO(now, { representation: 'date' }).substring(0, 7); 

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck === currentMonthStr) {
      return;
    }

    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const processRecurrence = async (type: 'incomes' | 'expenses') => {
      // 1. Get all recurring templates for the type
      const recurringTemplatesQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('isRecurring', '==', true)
      );

      // 2. Get all transactions for the current month to check against
      const monthQuery = query(
        collection(firestore, `users/${user.uid}/${type}`),
        where('date', '>=', formatISO(startOfCurrentMonth)),
        where('date', '<=', formatISO(endOfCurrentMonth))
      );

      const [recurringSnapshot, monthSnapshot] = await Promise.all([
        getDocs(recurringTemplatesQuery),
        getDocs(monthQuery),
      ]);
      
      // 3. Create a set of recurring transactions already created this month
      const existingRecurringSourceIds = new Set(
        monthSnapshot.docs
          .map(doc => doc.data() as Transaction)
          .filter(t => t.recurringSourceId)
          .map(t => t.recurringSourceId)
      );
      
      // 4. Create transactions that are missing for the current month
      for (const doc of recurringSnapshot.docs) {
        const templateId = doc.id;
        const template = doc.data() as Transaction;
        const templateDate = parseISO(template.date);

        // Skip if a transaction from this template has already been created this month
        if (existingRecurringSourceIds.has(templateId)) {
            continue;
        }

        // Only create if the template's original date is not in the current month
        // This prevents duplicating the very first entry.
        if (isSameMonth(templateDate, now)) {
            continue;
        }

        const newDate = setDate(now, templateDate.getDate());
        
        // Ensure newDate is within the current month, otherwise cap at the end of month.
        if (newDate.getMonth() !== now.getMonth()) {
            newDate.setDate(endOfCurrentMonth.getDate());
        }

        const newTransaction: Omit<Transaction, 'id'> = {
          ...template,
          date: formatISO(newDate),
          isRecurring: false, // CRITICAL: The generated instance is not a recurring template
          recurringSourceId: templateId, // Link back to the original template
        };
        
        addDocumentNonBlocking(collection(firestore, `users/${user.uid}/${type}`), newTransaction);
      }
    };

    await Promise.all([
        processRecurrence('incomes'),
        processRecurrence('expenses')
    ]);

    // Mark that we've run the process for this month
    localStorage.setItem(LAST_CHECK_KEY, currentMonthStr);

  }, [user, firestore]);

  useEffect(() => {
    // We only need to run this when the user is available.
    if(user) {
        manageRecurrences();
    }
  }, [manageRecurrences, user]);
}
