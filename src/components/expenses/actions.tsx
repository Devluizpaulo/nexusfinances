"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pen, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useState } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/lib/types"

interface DataTableRowActionsProps {
  row: Row<Transaction>
  onEdit: (transaction: Transaction) => void;
}

export function DataTableRowActions({ row, onEdit }: DataTableRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const transaction = row.original;
  const collectionName = 'expenses';

  const handleUpdateStatus = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }
    const docRef = doc(firestore, `users/${user.uid}/${collectionName}`, transaction.id);
    updateDocumentNonBlocking(docRef, { status: "paid" });
    toast({
      title: "Transação atualizada!",
      description: `A transação foi marcada como paga.`,
    });
  }

  const handleDelete = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }

    const docRef = doc(firestore, `users/${user.uid}/${collectionName}`, transaction.id);
    deleteDocumentNonBlocking(docRef);

    toast({
      title: "Transação excluída",
      description: `A transação "${transaction.description}" foi removida.`,
    });
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação
              e removerá os dados de nossos servidores.
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
           {transaction.status === 'pending' && (
            <>
              <DropdownMenuItem onClick={handleUpdateStatus}>
                <CheckCircle className="mr-2 h-3.5 w-3.5" />
                Marcar como Paga
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <Pen className="mr-2 h-3.5 w-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
