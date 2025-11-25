
'use client';

import { useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { startOfDay, isPast, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Debt, Installment } from '@/lib/types';

const LAST_NOTIFICATION_CHECK_KEY = 'notificationsLastCheck';
const CHECK_INTERVAL = 1000 * 60 * 60 * 4; // 4 horas

/**
 * Hook para gerar notificações do sistema do lado do cliente.
 * Atualmente, verifica e cria notificações para parcelas de dívidas vencidas.
 */
export function useNotificationGenerator() {
  const firestore = useFirestore();
  const { user } = useUser();

  const generateDebtNotifications = useCallback(async () => {
    if (!user || !firestore) return;

    try {
      // Consulta para buscar todas as parcelas não pagas do usuário
      const unpaidInstallmentsQuery = query(
        collectionGroup(firestore, 'installments'),
        where('userId', '==', user.uid),
        where('status', '==', 'unpaid')
      );

      const installmentsSnapshot = await getDocs(unpaidInstallmentsQuery);
      
      // Mapeia IDs de dívidas para buscar seus nomes
      const debtIds = new Set(installmentsSnapshot.docs.map(doc => doc.data().debtId));
      const debtNames: Record<string, string> = {};

      if (debtIds.size > 0) {
          const debtsQuery = query(collection(firestore, `users/${user.uid}/debts`), where('id', 'in', Array.from(debtIds)));
          const debtsSnapshot = await getDocs(debtsQuery);
          debtsSnapshot.forEach(doc => {
              debtNames[doc.id] = (doc.data() as Debt).name;
          });
      }

      // Consulta para buscar notificações de dívidas já existentes
      const existingDebtNotificationsQuery = query(
          collection(firestore, `users/${user.uid}/notifications`),
          where('type', '==', 'debt_due')
      );
      const existingNotificationsSnapshot = await getDocs(existingDebtNotificationsQuery);
      const notifiedInstallmentIds = new Set(existingNotificationsSnapshot.docs.map(doc => doc.data().entityId));

      const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

      for (const doc of installmentsSnapshot.docs) {
        const installment = { id: doc.id, ...doc.data() } as Installment;
        const dueDate = parseISO(installment.dueDate);
        
        // Verifica se a parcela está vencida e se já não foi notificada
        if (isPast(startOfDay(dueDate)) && !notifiedInstallmentIds.has(installment.id)) {
          const debtName = debtNames[installment.debtId] || 'Dívida';
          const formattedDate = format(dueDate, 'PPP', { locale: ptBR });
          
          const newNotification = {
            userId: user.uid,
            type: 'debt_due' as const,
            message: `A parcela ${installment.installmentNumber} de "${debtName}" venceu em ${formattedDate}.`,
            isRead: false,
            link: `/debts?debtId=${installment.debtId}`,
            timestamp: new Date().toISOString(),
            entityId: installment.id, // Liga a notificação à parcela específica
          };
          
          addDocumentNonBlocking(notificationsColRef, newNotification);
        }
      }

    } catch (error) {
      console.error('Erro ao gerar notificações de dívida:', error);
    }
  }, [user, firestore]);

  useEffect(() => {
    if (!user) return;

    const now = Date.now();
    const lastCheckStr = localStorage.getItem(LAST_NOTIFICATION_CHECK_KEY);
    const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;

    if (now - lastCheck > CHECK_INTERVAL) {
      generateDebtNotifications();
      localStorage.setItem(LAST_NOTIFICATION_CHECK_KEY, now.toString());
    }
  }, [user, generateDebtNotifications]);
}
