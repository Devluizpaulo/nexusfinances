'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthInsurance } from '@/lib/types';

const formSchema = z.object({
  operator: z.string().min(1, 'O nome da operadora é obrigatório.'),
  planName: z.string().min(1, 'O nome do plano é obrigatório.'),
  cardNumber: z.string().min(1, 'O número da carteirinha é obrigatório.'),
  emergencyContact: z.string().optional(),
});

type InsuranceFormValues = z.infer<typeof formSchema>;

type AddInsuranceSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  insurance?: HealthInsurance | null;
};

export function AddInsuranceSheet({ isOpen, onClose, insurance }: AddInsuranceSheetProps) {
  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operator: '',
      planName: '',
      cardNumber: '',
      emergencyContact: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (insurance && isOpen) {
      form.reset(insurance);
    } else {
      form.reset({
        operator: '',
        planName: '',
        cardNumber: '',
        emergencyContact: '',
      });
    }
  }, [insurance, isOpen, form]);

  const isEditing = !!insurance;

  const onSubmit = async (values: InsuranceFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }

    try {
      const dataToSave = { ...values, userId: user.uid };
      const collectionRef = collection(firestore, `users/${user.uid}/healthInsurances`);

      if (isEditing) {
        const docRef = doc(collectionRef, insurance!.id);
        setDocumentNonBlocking(docRef, dataToSave, { merge: true });
        toast({ title: 'Convênio atualizado!', description: 'Seus dados do convênio foram salvos.' });
      } else {
        addDocumentNonBlocking(collectionRef, dataToSave);
        toast({ title: 'Convênio adicionado!', description: 'Seu convênio foi cadastrado com sucesso.' });
      }
      onClose();
    } catch (error) {
      console.error("Error saving health insurance: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados do convênio.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Convênio' : 'Adicionar Convênio'}</DialogTitle>
          <DialogDescription>
            Insira os detalhes do seu plano de saúde para acesso rápido.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operadora</FormLabel>
                  <FormControl><Input placeholder="Ex: Amil, Bradesco Saúde" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="planName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano</FormLabel>
                  <FormControl><Input placeholder="Ex: Plano Executivo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Carteirinha</FormLabel>
                  <FormControl><Input placeholder="000.111.222-33" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato de Emergência (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ex: 0800 123 4567" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || !user} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Convênio'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
