
"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pen, Trash2, ShieldCheck, User } from "lucide-react"
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
import { doc, deleteDoc, updateDoc } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import type { AppUser } from "@/firebase"
import { logEvent } from "@/lib/logger"

interface DataTableRowActionsProps {
  row: Row<AppUser>
}

export function DataTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userToModify = row.original;
  const newRole = userToModify.role === 'superadmin' ? 'user' : 'superadmin';

  const resolveUserId = () => {
    return (userToModify as any).uid || (userToModify as any).id;
  };

  const handleDelete = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }
    
    const userId = resolveUserId();

    if (!userId) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: "ID do usuário não encontrado." });
      setIsDeleteDialogOpen(false);
      return;
    }

    if (user.uid === userId) {
      toast({ variant: "destructive", title: "Ação não permitida", description: "Você não pode excluir sua própria conta." });
      setIsDeleteDialogOpen(false);
      return;
    }

    const docRef = doc(firestore, `users`, userId);
    try {
        await deleteDoc(docRef);
        
        logEvent(firestore, {
            level: 'warn',
            message: `O usuário "${userToModify.displayName}" (ID: ${userId}) foi excluído.`,
            createdBy: user.uid,
            createdByName: user.displayName || 'Admin',
        });

        toast({
        title: "Usuário excluído",
        description: `O usuário "${userToModify.displayName}" foi removido.`,
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover o usuário.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
    }
  }
  
  const handleChangeRole = async () => {
     if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }
    
    const userId = (userToModify as any).uid || (userToModify as any).id;

    if (!userId) {
      toast({ variant: "destructive", title: "Erro ao alterar função", description: "ID do usuário não encontrado." });
      setIsRoleDialogOpen(false);
      return;
    }

    if (user.uid === userId) {
      toast({ variant: "destructive", title: "Ação não permitida", description: "Você não pode alterar sua própria função." });
      setIsRoleDialogOpen(false);
      return;
    }

    const docRef = doc(firestore, `users`, userId);
    try {
        await updateDoc(docRef, { role: newRole });
        logEvent(firestore, {
            level: 'info',
            message: `A função do usuário "${userToModify.displayName}" foi alterada para ${newRole}.`,
            createdBy: user.uid,
            createdByName: user.displayName || 'Admin',
        });
        toast({
          title: "Função Alterada",
          description: `O usuário "${userToModify.displayName}" agora é ${newRole}.`,
        });
    } catch (error) {
        console.error("Error changing role:", error);
        toast({ variant: "destructive", title: "Erro ao alterar função", description: "Não foi possível realizar a operação." });
    } finally {
        setIsRoleDialogOpen(false)
    }
  }

  const handleSetStatus = async (newStatus: 'active' | 'inactive' | 'blocked') => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }

    const userId = resolveUserId();

    if (!userId) {
      toast({ variant: "destructive", title: "Erro ao atualizar status", description: "ID do usuário não encontrado." });
      return;
    }

    if (user.uid === userId) {
      toast({ variant: "destructive", title: "Ação não permitida", description: "Você não pode alterar o seu próprio status." });
      return;
    }

    const docRef = doc(firestore, `users`, userId);
    try {
        await updateDoc(docRef, { status: newStatus });
        logEvent(firestore, {
          level: 'info',
          message: `O status do usuário "${userToModify.displayName}" foi atualizado para ${newStatus}.`,
          createdBy: user.uid,
          createdByName: user.displayName || 'Admin',
        });
        toast({
          title: "Status atualizado",
          description: `O usuário "${userToModify.displayName}" agora está ${newStatus}.`,
        });
    } catch (error) {
        console.error("Error setting status:", error);
        toast({ variant: "destructive", title: "Erro ao atualizar status", description: "Não foi possível realizar a operação." });
    }
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário
              e todos os seus dados associados do Firestore. A exclusão da conta de autenticação requer uma Cloud Function.
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

      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Função</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja alterar a função de &quot;{userToModify.displayName}&quot; para {newRole}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole}>
              Confirmar
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
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuItem disabled>
            <Pen className="mr-2 h-3.5 w-3.5" />
            Editar Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
            {newRole === 'superadmin' ? (
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            ) : (
                <User className="mr-2 h-3.5 w-3.5" />
            )}
            Alterar para {newRole}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSetStatus('active')}>
            Ativar usuário
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSetStatus('inactive')}>
            Desativar usuário
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSetStatus('blocked')}>
            Bloquear usuário
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Excluir Usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
