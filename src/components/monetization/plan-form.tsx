'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '../ui/currency-input';
import type { SubscriptionPlan } from '@/lib/types';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const formSchema = z.object({
  name: z.string().min(3, 'O nome do plano deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  features: z.array(z.string().min(1, 'A funcionalidade não pode estar em branco.')).min(1, 'Adicione pelo menos uma funcionalidade.'),
  paymentGatewayId: z.string().optional(),
  active: z.boolean().default(true),
});

type PlanFormValues = z.infer<typeof formSchema>;

type PlanFormProps = {
  isOpen: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
};

export function PlanForm({ isOpen, onClose, plan }: PlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      features: [''],
      paymentGatewayId: '',
      active: true,
    },
  });

  const { fields, append, remove } = useFieldArray<PlanFormValues, 'features', 'id'>({
    control: form.control,
    name: 'features',
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan && isOpen) {
      form.reset({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        features: plan.features.length > 0 ? plan.features : [''],
        paymentGatewayId: plan.paymentGatewayId || '',
        active: plan.active,
      });
    } else {
       form.reset({
        name: '',
        description: '',
        price: 0,
        features: [''],
        paymentGatewayId: '',
        active: true,
      });
    }
  }, [plan, isOpen, form]);
  
  const isEditing = !!plan;

  const onSubmit = async (values: PlanFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing) {
        const planRef = doc(firestore, 'subscriptionPlans', plan!.id);
        setDocumentNonBlocking(planRef, values, { merge: true });
        toast({ title: 'Plano atualizado!', description: `O plano "${values.name}" foi salvo.` });
      } else {
        const plansColRef = collection(firestore, 'subscriptionPlans');
        addDocumentNonBlocking(plansColRef, values);
        toast({ title: 'Plano criado!', description: `O plano "${values.name}" foi criado com sucesso.` });
      }
      onClose();
    } catch (error) {
      console.error("Error saving plan: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o plano. Tente novamente.',
      });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
          <DialogDescription>
            Defina os detalhes do plano de assinatura que será oferecido aos usuários.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano</FormLabel>
                  <FormControl><Input placeholder="Ex: Premium" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea placeholder="Uma breve descrição do que este plano oferece." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Mensal (R$)</FormLabel>
                  <FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <div>
              <Label>Funcionalidades Incluídas</Label>
              <div className="mt-2 space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                     <FormField
                        control={form.control}
                        name={`features.${index}`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl><Input placeholder="Ex: Sincronização bancária" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar funcionalidade
                </Button>
              </div>
            </div>
            <FormField control={form.control} name="paymentGatewayId" render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Gateway de Pagamento (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ex: pl_123abc..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <DialogDescription>
                            Se ativo, este plano estará visível para novos assinantes.
                        </DialogDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
             )}/>
            <DialogFooter>
                <Button type="submit" disabled={isSaving || !user} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Plano'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
