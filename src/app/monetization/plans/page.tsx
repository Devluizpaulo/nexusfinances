
'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { SubscriptionPlan } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { UserPlanCard } from '@/components/monetization/user-plan-card';

export default function PlansPage() {
  const firestore = useFirestore();

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'subscriptionPlans'), 
        where('active', '==', true),
        orderBy('price', 'asc')
    );
  }, [firestore]);

  const { data: plansData, isLoading: arePlansLoading } = useCollection<SubscriptionPlan>(plansQuery);

  return (
    <>
      <PageHeader
        title="Nossos Planos"
        description="Escolha o plano que melhor se adapta às suas necessidades e desbloqueie todo o potencial do Xô Planilhas."
      />

      {arePlansLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plansData && plansData.length > 0 ? (
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plansData.map((plan) => (
            <UserPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">Nenhum plano disponível no momento</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Estamos preparando novidades incríveis. Volte em breve!
          </p>
        </div>
      )}
    </>
  );
}
