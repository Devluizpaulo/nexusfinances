"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pen, Trash2 } from "lucide-react"
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
import { useFirestore, useUser, deleteDocumentNonBlocking } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import type { AppUser } from "@/firebase"

interface DataTableRowActionsProps {
  row: Row<AppUser>
}

export function DataTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userToDelete = row.original;

  const handleDelete = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }
    
    if (user.uid === userToDelete.uid) {
      toast({ variant: "destructive", title: "Ação não permitida", description: "Você não pode excluir sua própria conta." });
      return;
    }

    const docRef = doc(firestore, `users`, userToDelete.uid);
    deleteDocumentNonBlocking(docRef);

    toast({
      title: "Usuário excluído",
      description: `O usuário "${userToDelete.displayName}" foi removido.`,
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário
              e todos os seus dados associados.
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
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem disabled>
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
