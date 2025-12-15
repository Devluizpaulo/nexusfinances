

'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, getDocs, doc, addDoc } from 'firebase/firestore';
import { startOfMonth, endOfMonth, getMonth, getYear, setMonth, formatISO } from 'date-fns';
import type { Transaction } from '@/lib/types';

const LAST_CHECKED_KEY = 'recurrencesLastChecked';

/**
 * Hook to manage recurring transactions for the current user.
 * It checks once per month if recurring transactions for the current month
 * have been created and, if not, creates them.
 */
export function useManageRecurrences() {
  const { user } = useUser();
  const firestore = useFirestore();

  const recurrencesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('isRecurring', '==', true)
    );
  }, [user, firestore]);
  
  const { data: expenseTemplates } = useCollection<Transaction>(recurrencesQuery);

  const recurrencesIncomeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('isRecurring', '==', true)
    );
  }, [user, firestore]);

  const { data: incomeTemplates } = useCollection<Transaction>(incomeTemplatesQuery);

  const createRecurringTransactions = useCallback(async () => {
    if (!user || !firestore) return;
    
    const now = new Date();
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);
    const monthKey = `${currentYear}-${currentMonth}`;

    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);
    if (lastChecked === monthKey) {
      return;
    }
    
    console.log(`Checking for recurring transactions for ${monthKey}...`);
    
    const allTemplates = [...(expenseTemplates || []), ...(incomeTemplates || [])];
    if (allTemplates.length === 0) {
        localStorage.setItem(LAST_CHECKED_KEY, monthKey);
        return;
    }

    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const batch = writeBatch(firestore);
    let createdCount = 0;

    for (const template of allTemplates) {
      const collectionName = template.type === 'income' ? 'incomes' : 'expenses';
      const collectionRef = collection(firestore, `users/${user.uid}/${collectionName}`);
      
      const q = query(
        collectionRef,
        where('recurringSourceId', '==', template.id),
        where('date', '>=', formatISO(start)),
        where('date', '<=', formatISO(end))
      );

      const existing = await getDocs(q);

      if (existing.empty) {
        const newDate = setMonth(new Date(template.date), currentMonth);
        const newTransaction: Omit<Transaction, 'id'> = {
          ...template,
          date: formatISO(newDate),
          status: 'pending',
          isRecurring: false, // The created instance is not a template
          recurringSourceId: template.id, // Link back to the template
        };
        
        // Remove fields that shouldn't be in the new instance
        delete (newTransaction as any).id;
        
        const newDocRef = doc(collectionRef);
        batch.set(newDocRef, newTransaction);
        createdCount++;
      }
    }

    if (createdCount > 0) {
        const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);
        const newNotification = {
            userId: user.uid,
            type: 'recurrence_created' as const,
            message: `✨ ${createdCount} de suas contas recorrentes para este mês foram criadas.`,
            isRead: false,
            link: `/`, // Link to dashboard or a specific page for review
            timestamp: new Date().toISOString(),
            entityId: `recurrence-${monthKey}`,
        };
        
        batch.set(doc(notificationsColRef), newNotification);

        await batch.commit();
        console.log(`${createdCount} recurring transactions created for ${monthKey}.`);
    }

    localStorage.setItem(LAST_CHECKED_KEY, monthKey);

  }, [user, firestore, expenseTemplates, incomeTemplates]);

  useEffect(() => {
    // Run only if all data is loaded to avoid partial checks
    if (expenseTemplates !== null && incomeTemplates !== null) {
      createRecurringTransactions();
    }
  }, [expenseTemplates, incomeTemplates, createRecurringTransactions]);
}


  