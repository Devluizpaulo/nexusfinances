"use client"

import * as React from "react"
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
import { useState, useCallback } from "react"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/lib/types"

interface DataTableRowActionsProps {
  row: Row<Transaction>
  onEdit: (transaction: Transaction) => void;
}

export function DataTableRowActions({ row, onEdit }: DataTableRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const transaction = row.original;
  const collectionName = 'expenses';

  const handleUpdateStatus = useCallback(async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }
    const docRef = doc(firestore, `users/${user.uid}/${collectionName}`, transaction.id);
    try {
        await updateDoc(docRef, { status: "paid" });
        toast({
          title: "Transação atualizada!",
          description: `A transação "${transaction.description}" foi marcada como paga.`,
        });
    } catch (e) {
        console.error("Error updating transaction status:", e);
        toast({ variant: "destructive", title: "Erro ao atualizar", description: "Não foi possível marcar a despesa como paga." });
    }
  }, [user, firestore, collectionName, transaction.id, transaction.description, toast]);

  const handleDelete = useCallback(async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }

    setIsDeleting(true);
    const docRef = doc(firestore, `users/${user.uid}/${collectionName}`, transaction.id);
    try {
        await deleteDoc(docRef);
        toast({
            title: "Transação excluída",
            description: `A transação "${transaction.description}" foi removida.`,
        });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover a transação.",
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
    }
  }, [user, firestore, collectionName, transaction.id, transaction.description, toast]);

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação
              e removerá os dados de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
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
