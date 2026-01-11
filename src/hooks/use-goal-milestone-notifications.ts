'use client';

import { useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import type { Goal } from '@/lib/types';

const LAST_CHECKED_KEY = 'goalMilestonesLastChecked_v2';
const MILESTONES = [25, 50, 75, 90]; // Percentage milestones to notify

/**
 * Hook to create notifications when goals reach important milestones.
 * Notifies at 25%, 50%, 75%, and 90% progress.
 * Checks daily to avoid spamming.
 */
export function useGoalMilestoneNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Get all active goals
  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [user, firestore]);
  const { data: goals } = useCollection<Goal>(goalsQuery);

  const checkMilestones = useCallback(async () => {
    if (!user || !firestore || !goals || goals.length === 0) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastChecked = localStorage.getItem(LAST_CHECKED_KEY);

    if (lastChecked === todayStr) {
      return; // Already checked today
    }

    console.log('Checking goal milestones...');

    const batch = writeBatch(firestore);
    let notificationCount = 0;
    const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

    for (const goal of goals) {
      if (goal.targetAmount <= 0) continue; // Skip invalid goals

      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      
      // Check each milestone
      for (const milestone of MILESTONES) {
        // Only notify if we've passed the milestone but not completed (100%)
        if (progress >= milestone && progress < 100) {
          const entityId = `goal-milestone-${goal.id}-${milestone}`;
          const existingNotifQuery = query(notificationsColRef, where('entityId', '==', entityId));
          const existingNotifs = await getDocs(existingNotifQuery);

          if (existingNotifs.empty) {
            const remaining = goal.targetAmount - goal.currentAmount;
            const emoji = milestone >= 75 ? '🎯' : milestone >= 50 ? '📈' : '🌱';
            
            const message = `${emoji} Meta "${goal.name}" atingiu ${milestone}%! Faltam apenas R$ ${remaining.toFixed(2)} para concluir.`;
            const newNotification = {
              userId: user.uid,
              type: 'goal_milestone' as const,
              message,
              isRead: false,
              link: '/goals',
              timestamp: new Date().toISOString(),
              entityId,
              priority: 'low' as const,
              metadata: {
                goalId: goal.id,
                goalName: goal.name,
                milestone,
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                progress,
              }
            };
            batch.set(doc(notificationsColRef), newNotification);
            notificationCount++;
          }
        }
      }
    }

    if (notificationCount > 0) {
      await batch.commit();
      console.log(`${notificationCount} goal milestone notifications created.`);
    }

    localStorage.setItem(LAST_CHECKED_KEY, todayStr);
  }, [user, firestore, goals]);

  useEffect(() => {
    if (user && firestore && goals) {
      checkMilestones();
    }
  }, [user, firestore, goals, checkMilestones]);
}
