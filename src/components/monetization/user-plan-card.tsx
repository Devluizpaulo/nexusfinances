
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap } from 'lucide-react';
import type { SubscriptionPlan } from '@/lib/types';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserPlanCardProps {
  plan: SubscriptionPlan;
}

export function UserPlanCard({ plan }: UserPlanCardProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };
  
  const handleSubscribe = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Você precisa estar logado",
            description: "Faça login para assinar um plano."
        });
        return;
    }

    setIsRedirecting(true);
    
    try {
        const response = await fetch('/api/payments/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ planId: plan.id, userId: user.uid, userEmail: user.email }),
        });

        const data = await response.json();

        if (!response.ok || !data.checkoutUrl) {
            throw new Error(data.error || 'Falha ao iniciar o pagamento.');
        }
        
        // Redireciona o usuário para a página de checkout do Mercado Pago
        window.location.href = data.checkoutUrl;

    } catch (error: any) {
        console.error("Payment error:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Assinar",
            description: error.message || "Não foi possível iniciar o processo de pagamento. Tente novamente."
        });
        setIsRedirecting(false);
    }
  }

  const isCurrentPlan = user?.subscription?.planId === plan.id;
  const isFreePlan = plan.price === 0;

  return (
    <Card className={cn(
        "flex flex-col transition-all",
        isCurrentPlan && "border-2 border-primary shadow-lg"
    )}>
      {isCurrentPlan && (
        <Badge className="absolute -top-2 right-4">Seu Plano</Badge>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-baseline gap-2">
            {isFreePlan ? (
                <span className="text-4xl font-bold">Grátis</span>
            ) : (
                <>
                    <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-muted-foreground">/mês</span>
                </>
            )}
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
      <CardFooter>
        <Button 
            className="w-full"
            onClick={handleSubscribe}
            disabled={isRedirecting || isCurrentPlan || isFreePlan}
        >
            {isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCurrentPlan ? 'Plano Atual' : 'Assinar Agora'}
        </Button>
      </CardFooter>
    </Card>
  );
}
