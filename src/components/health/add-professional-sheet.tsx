

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthProfessional, HealthProvider } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do profissional é obrigatório.'),
  specialty: z.string().min(1, 'A especialidade é obrigatória.'),
  providerId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Insira um email válido.').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type ProfessionalFormValues = z.infer<typeof formSchema>;

type AddProfessionalSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  professional?: HealthProfessional | null;
  providers: HealthProvider[];
};

export function AddProfessionalSheet({ isOpen, onClose, professional, providers }: AddProfessionalSheetProps) {
  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      specialty: '',
      providerId: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (professional && isOpen) {
      form.reset(professional);
    } else {
      form.reset({
        name: '',
        specialty: '',
        providerId: '',
        phone: '',
        email: '',
        notes: '',
      });
    }
  }, [professional, isOpen, form]);

  const isEditing = !!professional;

  const onSubmit = async (values: ProfessionalFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }

    try {
      const dataToSave = { ...values, userId: user.uid };
      const collectionRef = collection(firestore, `users/${user.uid}/healthProfessionals`);

      if (isEditing) {
        const docRef = doc(collectionRef, professional!.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast({ title: 'Profissional atualizado!', description: `Os dados de ${values.name} foram salvos.` });
      } else {
        await addDoc(collectionRef, dataToSave);
        toast({ title: 'Profissional adicionado!', description: `${values.name} foi cadastrado com sucesso.` });
      }
      onClose();
    } catch (error) {
      console.error("Error saving health professional: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o profissional.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Profissional' : 'Adicionar Profissional'}</DialogTitle>
          <DialogDescription>
            Cadastre um profissional de saúde, como médico, dentista ou terapeuta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input placeholder="Ex: Dr. João Silva" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl><Input placeholder="Ex: Cardiologista, Psicólogo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa (Opcional)</FormLabel>
                   <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value || 'none'}
                   >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vincule a uma clínica ou academia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormControl><Input type="email" placeholder="contato@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl><Textarea placeholder="Horários, informações importantes, etc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || !user} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Profissional'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
