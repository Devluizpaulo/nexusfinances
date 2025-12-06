'use client';

import { useState } from 'react';
import { useFirestore, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Pen, Trash2, X } from "lucide-react"

interface RecurrenceCardActionsProps {
    recurrence: Recurrence;
    onEdit: () => void;
}

export function RecurrenceCardActions({ recurrence, onEdit }: RecurrenceCardActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const collectionName = recurrence.type === 'income' ? 'incomes' : 'expenses';
  const docRef = doc(firestore, `users/${user?.uid}/${collectionName}`, recurrence.id);

  const handleDelete = () => {
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Item recorrente excluído',
      description: `O modelo de recorrência "${recurrence.description}" foi removido.`,
    });
    setIsDeleteDialogOpen(false);
  };
  
  const handleStopRecurrence = () => {
      updateDocumentNonBlocking(docRef, { isRecurring: false });
      toast({
          title: 'Recorrência interrompida',
          description: `"${recurrence.description}" não será mais criada automaticamente.`,
      });
      setIsConfirmingStop(false);
  }

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo de recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o modelo de recorrência para "{recurrence.description}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmingStop} onOpenChange={setIsConfirmingStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interromper recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja parar a recorrência de "{recurrence.description}"? As transações futuras não serão mais criadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStopRecurrence}>
              Sim, interromper
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div onClick={stopPropagation}>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit()}>
                    <Pen className="mr-2 h-4 w-4" />
                    Editar
                </DropdownMenuItem>
                 {recurrence.isRecurring && (
                    <DropdownMenuItem onClick={() => setIsConfirmingStop(true)}>
                        <X className="mr-2 h-4 w-4" />
                        Interromper
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Modelo
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
