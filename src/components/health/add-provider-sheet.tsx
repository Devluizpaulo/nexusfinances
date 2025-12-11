'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, addDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthProvider } from '@/lib/types';

const providerTypes = ["Academia", "Clínica", "Consultório", "Estúdio", "Centro Terapêutico", "Outro"];

const formSchema = z.object({
  name: z.string().min(1, 'O nome da empresa é obrigatório.'),
  type: z.string().min(1, 'O tipo é obrigatório.'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Insira um email válido.').optional().or(z.literal('')),
  website: z.string().url('Insira uma URL válida.').optional().or(z.literal('')),
});

type ProviderFormValues = z.infer<typeof formSchema>;

type AddProviderSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  provider?: HealthProvider | null;
};

export function AddProviderSheet({ isOpen, onClose, provider }: AddProviderSheetProps) {
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      address: '',
      phone: '',
      email: '',
      website: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (provider && isOpen) {
      form.reset(provider);
    } else {
      form.reset({
        name: '',
        type: '',
        address: '',
        phone: '',
        email: '',
        website: '',
      });
    }
  }, [provider, isOpen, form]);

  const isEditing = !!provider;

  const onSubmit = async (values: ProviderFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }

    try {
      const dataToSave = { ...values, userId: user.uid };
      const collectionRef = collection(firestore, `users/${user.uid}/healthProviders`);

      if (isEditing) {
        const docRef = doc(collectionRef, provider!.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast({ title: 'Empresa atualizada!', description: `Os dados de ${values.name} foram salvos.` });
      } else {
        await addDoc(collectionRef, dataToSave);
        toast({ title: 'Empresa adicionada!', description: `${values.name} foi cadastrada com sucesso.` });
      }
      onClose();
    } catch (error) {
      console.error("Error saving health provider: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a empresa.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Empresa' : 'Adicionar Empresa de Saúde'}</DialogTitle>
          <DialogDescription>
            Cadastre uma clínica, academia, consultório ou outro local de serviço.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl><Input placeholder="Ex: Clínica Bem Viver" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de local" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providerTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl><Input placeholder="Rua, número, bairro..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="contato@empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl><Input placeholder="https://www.empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || !user} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
