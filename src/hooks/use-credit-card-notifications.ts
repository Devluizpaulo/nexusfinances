
'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, writeBatch, doc, addDoc, getDocs, where } from 'firebase/firestore';
import { startOfDay, addDays, differenceInDays, set, getMonth, addMonths, isBefore } from 'date-fns';
import type { CreditCard } from '@/lib/types';

const LAST_CHECKED_KEY = 'creditCardNotificationsLastChecked_v2';
const NOTIFICATION_WINDOW_DAYS = 2; // Notify 2 days in advance

export function useCreditCardNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  const cardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/creditCards`));
  }, [user, firestore]);
  const { data: cards } = useCollection<CreditCard>(cardsQuery);

  const checkCardNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return; // Ensure this only runs on the client
    if (!user || !firestore || !cards || cards.length === 0) return;

    const today = startOfDay(new Date());
    const todayStr = today.toISOString().split('T')[0];
    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);

    if (lastChecked === todayStr) {
      return; // Already checked today
    }
    
    console.log('Checking for credit card notifications...');

    const batch = writeBatch(firestore);
    let notificationCount = 0;
    const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

    for (const card of cards) {
      const currentMonth = getMonth(today);

      // --- Closing Date Notification ---
      const closingDateThisMonth = set(today, { date: card.closingDate });
      const daysUntilClose = differenceInDays(closingDateThisMonth, today);

      if (daysUntilClose >= 0 && daysUntilClose <= NOTIFICATION_WINDOW_DAYS) {
        const entityId = `card-close-${card.id}-${closingDateThisMonth.toISOString().split('T')[0]}`;
        const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
        const existingNotifs = await getDocs(existingNotifQuery);

        if (existingNotifs.empty) {
          const message = `A fatura do seu cartão ${card.name} fecha ${daysUntilClose === 0 ? 'hoje' : `em ${daysUntilClose} dia(s)`}.`;
          const newNotification = {
            userId: user.uid,
            type: 'credit_card_notification' as const,
            message,
            isRead: false,
            link: '/credit-cards',
            timestamp: new Date().toISOString(),
            entityId,
          };
          batch.set(doc(notificationsColRef), newNotification);
          notificationCount++;
        }
      }

      // --- Due Date Notification ---
      let dueDateThisMonth = set(today, { date: card.dueDate });
      // If due date is before closing date this month, it refers to next month's bill
      if (isBefore(dueDateThisMonth, closingDateThisMonth)) {
        dueDateThisMonth = addMonths(dueDateThisMonth, 1);
      }
      
      const daysUntilDue = differenceInDays(dueDateThisMonth, today);
      
      if (daysUntilDue >= 0 && daysUntilDue <= NOTIFICATION_WINDOW_DAYS) {
        const entityId = `card-due-${card.id}-${dueDateThisMonth.toISOString().split('T')[0]}`;
        const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
        const existingNotifs = await getDocs(existingNotifQuery);

        if (existingNotifs.empty) {
          const message = `A fatura do seu cartão ${card.name} vence ${daysUntilDue === 0 ? 'hoje' : `em ${daysUntilDue} dia(s)`}.`;
          const newNotification = {
            userId: user.uid,
            type: 'credit_card_notification' as const,
            message,
            isRead: false,
            link: '/credit-cards',
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
      console.log(`${notificationCount} credit card notifications created.`);
    }

    localStorage.setItem(LAST_CHECKED_KEY, todayStr);

  }, [user, firestore, cards]);

  useEffect(() => {
    // Only check if all dependencies are ready
    if (user && firestore && cards) {
      checkCardNotifications();
    }
  }, [user, firestore, cards, checkCardNotifications]);
}
