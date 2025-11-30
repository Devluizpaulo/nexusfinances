
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthInsurance } from '@/lib/types';
import { Separator } from '../ui/separator';

const dependentSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  cardNumber: z.string().optional(),
});

const formSchema = z.object({
  type: z.enum(['Saúde', 'Odontológico']),
  operator: z.string().min(1, 'O nome da operadora é obrigatório.'),
  planName: z.string().min(1, 'O nome do plano é obrigatório.'),
  cardNumber: z.string().min(1, 'O número da carteirinha é obrigatório.'),
  emergencyContact: z.string().optional(),
  dependents: z.array(dependentSchema).optional(),
});

type InsuranceFormValues = z.infer<typeof formSchema>;

type AddInsuranceSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  insurance?: HealthInsurance | null;
};

export function AddInsuranceSheet({ isOpen, onClose, insurance }: AddInsuranceSheetProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'Saúde',
      operator: '',
      planName: '',
      cardNumber: '',
      emergencyContact: '',
      dependents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dependents',
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (insurance && isOpen) {
      form.reset({
        ...insurance,
        dependents: insurance.dependents || [],
      });
    } else {
      form.reset({
        type: 'Saúde',
        operator: '',
        planName: '',
        cardNumber: '',
        emergencyContact: '',
        dependents: [],
      });
    }
  }, [insurance, isOpen, form]);

  const isEditing = !!insurance?.id;

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

  const handleDelete = () => {
    if (!user || !isEditing) return;
    deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/healthInsurances`, insurance.id));
    toast({ title: "Convênio removido", description: "As informações do convênio foram excluídas." });
    onClose();
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir Convênio?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir as informações deste convênio? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Convênio' : 'Adicionar Convênio'}</DialogTitle>
            <DialogDescription>
              Insira os detalhes do seu plano para acesso rápido.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Plano</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                        <SelectItem value="Odontológico">Odontológico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Nº da Carteirinha (Titular)</FormLabel>
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
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Dependentes</FormLabel>
                  <Button type="button" size="sm" variant="ghost" onClick={() => append({ name: '', cardNumber: '' })} className="text-primary">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-start border p-2 rounded-md">
                      <FormField
                        control={form.control}
                        name={`dependents.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nome</FormLabel>
                            <FormControl><Input {...field} placeholder="Nome do dependente" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`dependents.${index}.cardNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Carteirinha</FormLabel>
                            <FormControl><Input {...field} placeholder="Número (opcional)" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)} className="mt-6">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {fields.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Nenhum dependente adicionado.</p>}
                </div>

              </div>


              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
                  {isEditing ? (
                    <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                      Excluir Convênio
                    </Button>
                  ) : <div></div>}
                  <Button type="submit" disabled={form.formState.isSubmitting || !user}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Salvar Alterações' : 'Salvar Convênio'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
