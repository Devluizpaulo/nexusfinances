
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Edit, Loader2, Trash2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/lib/types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PlanCardProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
}

export function PlanCard({ plan, onEdit }: PlanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const handleToggleActive = async (active: boolean) => {
    if (!user) return;
    setIsToggling(true);
    const planRef = doc(firestore, 'subscriptionPlans', plan.id);
    await updateDoc(planRef, { active });
    toast({
      title: `Plano ${active ? 'ativado' : 'desativado'}`,
      description: `O plano "${plan.name}" agora está ${active ? 'visível' : 'oculto'} para os usuários.`,
    });
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    const planRef = doc(firestore, 'subscriptionPlans', plan.id);
    await deleteDoc(planRef);
    toast({
      title: 'Plano excluído!',
      description: `O plano "${plan.name}" foi removido com sucesso.`,
    });
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o plano &quot;{plan.name}&quot;. Os usuários
              inscritos neste plano não serão afetados imediatamente, mas o plano não estará mais disponível para novas
              assinaturas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{plan.name}</CardTitle>
            <Badge variant={plan.active ? 'default' : 'secondary'}>{plan.active ? 'Ativo' : 'Inativo'}</Badge>
          </div>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          <ul className="space-y-2 text-sm">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Disponível para usuários</span>
            <Switch checked={plan.active} onCheckedChange={handleToggleActive} disabled={isToggling} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onEdit(plan)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
