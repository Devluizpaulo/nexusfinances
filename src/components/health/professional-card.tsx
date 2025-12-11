
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Building, Pencil, Phone, Trash2, User, Mail, MoreVertical } from 'lucide-react';
import type { HealthProfessional, HealthProvider } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface ProfessionalCardProps {
  professional: HealthProfessional;
  providers: HealthProvider[];
  onEdit: (professional: HealthProfessional) => void;
}

export function ProfessionalCard({ professional, providers, onEdit }: ProfessionalCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const provider = providers.find(p => p.id === professional.providerId);
  
  const handleDeleteProfessional = async () => {
    if (!user) return;
    try {
        await deleteDoc(doc(firestore, `users/${user.uid}/healthProfessionals`, professional.id));
        toast({ title: "Profissional excluído", description: `"${professional.name}" foi removido.` });
    } catch(error) {
        console.error("Error deleting professional:", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o profissional." });
    } finally {
        setIsDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Profissional?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tem certeza que deseja excluir &quot;{professional.name}&quot;? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProfessional} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>{professional.name}</CardTitle>
                    <CardDescription>{professional.specialty}</CardDescription>
                </div>
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(professional)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
            {provider && (
                <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                    <Building className="h-3 w-3" />
                    {provider.name}
                </Badge>
            )}
            <div className="flex flex-col gap-1 text-muted-foreground">
                {professional.phone && <a href={`tel:${professional.phone}`} className="flex items-center gap-1.5 text-primary hover:underline"><Phone className="h-3 w-3" /> {professional.phone}</a>}
                {professional.email && <a href={`mailto:${professional.email}`} className="flex items-center gap-1.5 text-primary hover:underline"><Mail className="h-3 w-3" /> {professional.email}</a>}
            </div>
             {professional.notes && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground">Observações</p>
                    <p className="text-xs">{professional.notes}</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
