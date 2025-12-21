
'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, addDoc, getDocs } from 'firebase/firestore';
import { startOfDay, addDays, differenceInDays, parseISO, format, setMonth, getMonth, getYear, setDate } from 'date-fns';
import type { Transaction, Debt, Installment } from '@/lib/types';

const LAST_CHECKED_KEY = 'upcomingNotificationsLastChecked_v2';
const NOTIFICATION_WINDOW_DAYS = 3;

/**
 * Hook to create notifications for upcoming due dates for recurring transactions and debt installments.
 * It checks once per day.
 */
export function useUpcomingNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Query to get all active debts for the user
  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [user, firestore]);
  const { data: debts } = useCollection<Debt>(debtsQuery);

  const checkUpcomingDues = useCallback(async () => {
    if (!user || !firestore || !debts) return;

    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);

    if (lastChecked === todayStr) {
      return; // Already checked today
    }
    
    console.log('Checking for upcoming due dates...');

    const batch = writeBatch(firestore);
    let notificationCount = 0;

    const upcomingEndDate = addDays(today, NOTIFICATION_WINDOW_DAYS);
    const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

    // 1. Check for upcoming recurring expenses
    const recurringExpensesQuery = query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('isRecurring', '==', true)
    );
    const recurringIncomesQuery = query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('isRecurring', '==', true)
    );

    const [expenseTemplates, incomeTemplates] = await Promise.all([
      getDocs(recurringExpensesQuery),
      getDocs(recurringIncomesQuery)
    ]);
    
    const allTemplates = [...expenseTemplates.docs, ...incomeTemplates.docs];

    for (const docSnap of allTemplates) {
      const template = docSnap.data() as Transaction;
      const templateDay = parseISO(template.date).getDate();
      const dueDate = setDate(today, templateDay); // Due date in the current month

      const daysUntilDue = differenceInDays(dueDate, today);

      if (daysUntilDue >= 0 && daysUntilDue <= NOTIFICATION_WINDOW_DAYS) {
        const entityId = `recurrence-${template.id}-${format(dueDate, 'yyyy-MM-dd')}`;
        const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
        const existingNotifs = await getDocs(existingNotifQuery);

        if (existingNotifs.empty) {
          const message = `Lembrete: Sua ${template.type === 'income' ? 'renda' : 'despesa'} "${template.description}" vence ${daysUntilDue === 0 ? 'hoje' : `em ${daysUntilDue} dia(s)`}.`;
          const newNotification = {
            userId: user.uid,
            type: 'upcoming_due' as const,
            message,
            isRead: false,
            link: template.type === 'income' ? '/income' : '/expenses',
            timestamp: new Date().toISOString(),
            entityId,
          };
          batch.set(doc(notificationsColRef), newNotification);
          notificationCount++;
        }
      }
    }
    
    // 2. Check for upcoming debt installments for each debt
    for (const debt of debts) {
        const installmentsQuery = query(
            collection(firestore, `users/${user.uid}/debts/${debt.id}/installments`),
            where('status', '==', 'unpaid'),
            where('dueDate', '>=', today.toISOString()),
            where('dueDate', '<=', upcomingEndDate.toISOString())
        );

        const installmentsSnapshot = await getDocs(installmentsQuery);

        for (const installmentDoc of installmentsSnapshot.docs) {
            const installment = installmentDoc.data() as Installment;
            const entityId = `installment-${installment.id}`;
            const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
            const existingNotifs = await getDocs(existingNotifQuery);

            if (existingNotifs.empty) {
                const daysUntilDue = differenceInDays(parseISO(installment.dueDate), today);
                const message = `Lembrete: A parcela ${installment.installmentNumber} da dívida "${debt.name}" vence ${daysUntilDue === 0 ? 'hoje' : `em ${daysUntilDue} dia(s)`}.`;
                const newNotification = {
                userId: user.uid,
                type: 'upcoming_due' as const,
                message,
                isRead: false,
                link: `/debts?dueDate=${installment.dueDate}`,
                timestamp: new Date().toISOString(),
                entityId,
                };
                batch.set(doc(notificationsColRef), newNotification);
                notificationCount++;
            }
        }
    }
    
    if (notificationCount > 0) {
      await batch.commit();
      console.log(`${notificationCount} upcoming due notifications created.`);
    }

    localStorage.setItem(LAST_CHECKED_KEY, todayStr);
  }, [user, firestore, debts]);

  useEffect(() => {
    if (user && firestore && debts) {
      // Check immediately on load, then rely on daily check
      checkUpcomingDues();
    }
  }, [user, firestore, debts, checkUpcomingDues]);
}
