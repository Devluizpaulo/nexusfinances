'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs } from 'firebase/firestore';
import { startOfDay, differenceInDays, parseISO, format } from 'date-fns';
import type { Debt, Installment } from '@/lib/types';

const LAST_CHECKED_KEY = 'debtOverdueLastChecked_v2';

/**
 * Hook to create notifications for overdue debt installments.
 * Checks daily for unpaid installments past their due date.
 */
export function useDebtOverdueNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Get all active debts
  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [user, firestore]);
  const { data: debts } = useCollection<Debt>(debtsQuery);

  const checkOverdueDues = useCallback(async () => {
    if (!user || !firestore || !debts) return;

    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);

    if (lastChecked === todayStr) {
      return; // Already checked today
    }

    console.log('Checking for overdue debts...');

    const batch = writeBatch(firestore);
    let notificationCount = 0;
    const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

    // Check each debt for overdue installments
    for (const debt of debts) {
      const installmentsQuery = query(
        collection(firestore, `users/${user.uid}/debts/${debt.id}/installments`),
        where('status', '==', 'unpaid'),
        where('dueDate', '<', today.toISOString())
      );

      const installmentsSnapshot = await getDocs(installmentsQuery);

      for (const installmentDoc of installmentsSnapshot.docs) {
        const installment = installmentDoc.data() as Installment;
        const entityId = `debt-overdue-${installment.id}`;
        const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
        const existingNotifs = await getDocs(existingNotifQuery);

        if (existingNotifs.empty) {
          const dueDate = parseISO(installment.dueDate);
          const daysOverdue = differenceInDays(today, dueDate);
          
          const message = `🚨 Dívida vencida! A parcela ${installment.installmentNumber} de "${debt.name}" está atrasada há ${daysOverdue} dia(s). Valor: R$ ${installment.amount.toFixed(2)}.`;
          const newNotification = {
            userId: user.uid,
            type: 'debt_overdue' as const,
            message,
            isRead: false,
            link: `/debts?dueDate=${installment.dueDate}`,
            timestamp: new Date().toISOString(),
            entityId,
            priority: 'high' as const,
            metadata: {
              debtName: debt.name,
              installmentNumber: installment.installmentNumber,
              amount: installment.amount,
              daysOverdue,
              dueDate: installment.dueDate,
            }
          };
          batch.set(doc(notificationsColRef), newNotification);
          notificationCount++;
        }
      }
    }

    if (notificationCount > 0) {
      await batch.commit();
      console.log(`${notificationCount} overdue debt notifications created.`);
    }

    localStorage.setItem(LAST_CHECKED_KEY, todayStr);
  }, [user, firestore, debts]);

  useEffect(() => {
    if (user && firestore && debts) {
      checkOverdueDues();
    }
  }, [user, firestore, debts, checkOverdueDues]);
}
