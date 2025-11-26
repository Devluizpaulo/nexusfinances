'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Star } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { SubscriptionPlan } from '@/lib/types';
import { PlanForm } from '@/components/monetization/plan-form';
import { PlanCard } from '@/components/monetization/plan-card';

export default function MonetizationPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const firestore = useFirestore();

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'subscriptionPlans'), orderBy('price', 'asc'));
  }, [firestore]);

  const { data: plansData, isLoading: arePlansLoading } = useCollection<SubscriptionPlan>(plansQuery);

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingPlan(null);
    setIsFormOpen(false);
  };

  return (
    <>
      <PlanForm isOpen={isFormOpen} onClose={handleCloseForm} plan={editingPlan} />

      <div className="flex items-center justify-between mb-6">
        <div/>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>


      {arePlansLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plansData && plansData.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plansData.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">Nenhum plano de assinatura encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Clique em "Novo Plano" para criar o primeiro plano de assinatura para seus usuários.
          </p>
          <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Primeiro Plano
          </Button>
        </div>
      )}
    </>
  );
}
