'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Star } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { SubscriptionPlan } from '@/lib/types';
import { PlanForm } from '@/components/monetization/plan-form';
import { PlanCard } from '@/components/monetization/plan-card';
import { PageHeader } from '@/components/page-header';

export default function MonetizationPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const { user } = useUser();

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

  if (user && user.role !== 'superadmin') {
    return (
        <div className="flex h-full items-center justify-center">
            <p>Acesso negado.</p>
        </div>
    )
  }

  return (
    <>
      <PlanForm isOpen={isFormOpen} onClose={handleCloseForm} plan={editingPlan} />
      <PageHeader
        title="Gerenciamento de Planos"
        description="Crie e edite os planos de assinatura disponíveis para os usuários."
      >
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </PageHeader>


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
