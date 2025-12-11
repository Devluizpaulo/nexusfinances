
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Building, Pencil, Phone, Trash2, User, Globe, Mail, MoreVertical } from 'lucide-react';
import type { HealthProfessional, HealthProvider } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HealthProviderCardProps {
  provider: HealthProvider;
  professionals: HealthProfessional[];
  onEditProvider: (provider: HealthProvider) => void;
  onEditProfessional: (professional: HealthProfessional) => void;
}

export function HealthProviderCard({ provider, professionals, onEditProvider, onEditProfessional }: HealthProviderCardProps) {
  const [isProviderDeleteDialogOpen, setIsProviderDeleteDialogOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<HealthProfessional | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const providerProfessionals = professionals.filter(p => p.providerId === provider.id);
  
  const handleDeleteProvider = async () => {
    if (!user) return;
    try {
        await deleteDoc(doc(firestore, `users/${user.uid}/healthProviders`, provider.id));
        toast({ title: "Empresa excluída", description: `"${provider.name}" foi removida.` });
    } catch (error) {
        console.error("Error deleting provider:", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover a empresa." });
    } finally {
        setIsProviderDeleteDialogOpen(false);
    }
  }
  
  const handleDeleteProfessional = async () => {
    if (!user || !professionalToDelete) return;
    try {
        await deleteDoc(doc(firestore, `users/${user.uid}/healthProfessionals`, professionalToDelete.id));
        toast({ title: "Profissional excluído", description: `"${professionalToDelete.name}" foi removido.` });
    } catch(error) {
        console.error("Error deleting professional:", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o profissional." });
    } finally {
        setProfessionalToDelete(null);
    }
  }

  return (
    <>
      <AlertDialog open={isProviderDeleteDialogOpen} onOpenChange={setIsProviderDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tem certeza que deseja excluir "{provider.name}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProvider} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
       <AlertDialog open={!!professionalToDelete} onOpenChange={() => setProfessionalToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Profissional?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tem certeza que deseja excluir "{professionalToDelete?.name}"? Esta ação não pode ser desfeita.
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
                    <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>{provider.name}</CardTitle>
                    <CardDescription>{provider.type}</CardDescription>
                </div>
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditProvider(provider)}><Pencil className="mr-2 h-4 w-4" />Editar Empresa</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsProviderDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Empresa</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
            {provider.address && <p className="text-muted-foreground">{provider.address}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {provider.phone && <a href={`tel:${provider.phone}`} className="flex items-center gap-1.5 text-primary hover:underline"><Phone className="h-3 w-3" /> {provider.phone}</a>}
                {provider.email && <a href={`mailto:${provider.email}`} className="flex items-center gap-1.5 text-primary hover:underline"><Mail className="h-3 w-3" /> {provider.email}</a>}
                {provider.website && <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><Globe className="h-3 w-3" /> Website</a>}
            </div>
        </CardContent>
        {providerProfessionals.length > 0 && (
          <CardFooter>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="professionals" className="border-b-0">
                <AccordionTrigger>
                  {providerProfessionals.length} profissional(is) encontrado(s)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {providerProfessionals.map(prof => (
                    <div key={prof.id} className="flex items-start justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                           <User className="h-4 w-4 text-muted-foreground mt-1" />
                           <div>
                                <p className="font-semibold">{prof.name}</p>
                                <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                                {prof.phone && <p className="text-xs text-muted-foreground">{prof.phone}</p>}
                           </div>
                        </div>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditProfessional(prof)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProfessionalToDelete(prof)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
