'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import type { Transaction } from '@/lib/types';

const LAST_CHECKED_KEY = 'monthlySummaryLastChecked_v2';

/**
 * Hook to create a comprehensive monthly financial summary notification.
 * Runs on the last day of each month or first day of next month.
 * Includes: total income, total expenses, savings, top spending categories.
 */
export function useMonthlySummaryNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  const createMonthlySummary = useCallback(async () => {
    if (!user || !firestore) return;

    const today = new Date();
    const currentMonthKey = format(today, 'yyyy-MM');
    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);

    // Only run once per month on or after the 28th
    const dayOfMonth = today.getDate();
    if (dayOfMonth < 28 || lastChecked === currentMonthKey) {
      return;
    }

    console.log('Creating monthly financial summary...');

    const lastMonth = subMonths(today, 1);
    const start = startOfMonth(lastMonth);
    const end = endOfMonth(lastMonth);
    const monthName = format(lastMonth, 'MMMM', { locale: require('date-fns/locale/pt-BR') });

    // Get all incomes for last month
    const incomesQuery = query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('date', '>=', start.toISOString()),
      where('date', '<=', end.toISOString())
    );
    const incomesSnapshot = await getDocs(incomesQuery);
    const incomes = incomesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
    const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);

    // Get all expenses for last month
    const expensesQuery = query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', start.toISOString()),
      where('date', '<=', end.toISOString())
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate savings
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Find top spending category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.category) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }
    });
    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    // Create notification
    const batch = writeBatch(firestore);
    const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);
    
    const entityId = `monthly-summary-${format(lastMonth, 'yyyy-MM')}`;
    const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
    const existingNotifs = await getDocs(existingNotifQuery);

    if (existingNotifs.empty) {
      const savingsEmoji = savings >= 0 ? '💰' : '⚠️';
      const savingsText = savings >= 0 
        ? `Você economizou R$ ${savings.toFixed(2)} (${savingsRate.toFixed(1)}%)` 
        : `Gastou R$ ${Math.abs(savings).toFixed(2)} a mais que ganhou`;

      const message = `${savingsEmoji} Resumo de ${monthName}: Receitas R$ ${totalIncome.toFixed(2)} • Despesas R$ ${totalExpenses.toFixed(2)} • ${savingsText}${topCategory ? ` • Maior gasto: ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)})` : ''}.`;
      
      const newNotification = {
        userId: user.uid,
        type: 'monthly_summary' as const,
        message,
        isRead: false,
        link: '/reports',
        timestamp: new Date().toISOString(),
        entityId,
        priority: 'medium' as const,
        metadata: {
          month: format(lastMonth, 'yyyy-MM'),
          totalIncome,
          totalExpenses,
          savings,
          savingsRate,
          topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
        }
      };
      batch.set(doc(notificationsColRef), newNotification);
      await batch.commit();
      console.log('Monthly summary notification created.');
    }

    localStorage.setItem(LAST_CHECKED_KEY, currentMonthKey);
  }, [user, firestore]);

  useEffect(() => {
    if (user && firestore) {
      createMonthlySummary();
    }
  }, [user, firestore, createMonthlySummary]);
}
