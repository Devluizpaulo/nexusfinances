'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { Budget, Transaction } from '@/lib/types';

const LAST_CHECKED_KEY = 'budgetWarningLastChecked_v3';

/**
 * Hook to monitor budget spending and create notifications when:
 * - 80% of budget is reached (warning)
 * - 100% of budget is exceeded (alert)
 * Checks daily for all active budgets
 */
export function useBudgetWarningNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Get all active budgets
  const budgetsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/budgets`),
      where('isActive', '==', true)
    );
  }, [user, firestore]);
  const { data: budgets } = useCollection<Budget>(budgetsQuery);

  const checkBudgetWarnings = useCallback(async () => {
    if (!user || !firestore || !budgets || budgets.length === 0) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);

    if (lastChecked === todayStr) {
      return; // Already checked today
    }

    console.log('Checking budget warnings...');

    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const batch = writeBatch(firestore);
    let notificationCount = 0;
    const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

    // Get all expenses for current month
    const expensesQuery = query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', start.toISOString()),
      where('date', '<=', end.toISOString()),
      where('status', '==', 'paid')
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];

    // Check each budget
    for (const budget of budgets) {
      // Calculate spent amount for this category
      const categoryExpenses = expenses.filter(exp => exp.category === budget.category);
      const totalSpent = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      const budgetLimit = budget.amount; // Budget amount is the limit
      const percentageUsed = (totalSpent / budgetLimit) * 100;

      // Check for 80% warning
      if (percentageUsed >= 80 && percentageUsed < 100) {
        const entityId = `budget-warning-80-${budget.id}-${format(today, 'yyyy-MM')}`;
        const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
        const existingNotifs = await getDocs(existingNotifQuery);

        if (existingNotifs.empty) {
          const remaining = budgetLimit - totalSpent;
          const message = `⚠️ Alerta: Você já gastou ${percentageUsed.toFixed(0)}% do orçamento de "${budget.category}". Restam R$ ${remaining.toFixed(2)}.`;
          const newNotification = {
            userId: user.uid,
            type: 'budget_warning' as const,
            message,
            isRead: false,
            link: '/budgets',
            timestamp: new Date().toISOString(),
            entityId,
            priority: 'medium' as const,
            metadata: {
              category: budget.category,
              spent: totalSpent,
              limit: budgetLimit,
              percentage: percentageUsed,
            }
          };
          batch.set(doc(notificationsColRef), newNotification);
          notificationCount++;
        }
      }

      // Check for 100% exceeded
      if (percentageUsed >= 100) {
        const entityId = `budget-exceeded-${budget.id}-${format(today, 'yyyy-MM')}`;
        const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
        const existingNotifs = await getDocs(existingNotifQuery);

        if (existingNotifs.empty) {
          const exceeded = totalSpent - budgetLimit;
          const message = `🚨 Orçamento estourado! Você excedeu o limite de "${budget.category}" em R$ ${exceeded.toFixed(2)} (${percentageUsed.toFixed(0)}% gasto).`;
          const newNotification = {
            userId: user.uid,
            type: 'budget_exceeded' as const,
            message,
            isRead: false,
            link: '/budgets',
            timestamp: new Date().toISOString(),
            entityId,
            priority: 'high' as const,
            metadata: {
              category: budget.category,
              spent: totalSpent,
              limit: budgetLimit,
              exceeded,
              percentage: percentageUsed,
            }
          };
          batch.set(doc(notificationsColRef), newNotification);
          notificationCount++;
        }
      }
    }

    if (notificationCount > 0) {
      await batch.commit();
      console.log(`${notificationCount} budget warning notifications created.`);
    }

    localStorage.setItem(LAST_CHECKED_KEY, todayStr);
  }, [user, firestore, budgets]);

  useEffect(() => {
    if (user && firestore && budgets) {
      checkBudgetWarnings();
    }
  }, [user, firestore, budgets, checkBudgetWarnings]);
}
