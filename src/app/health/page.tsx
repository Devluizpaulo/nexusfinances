'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building, User, Heart, Shield, Loader2, Hospital, Tooth } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { HealthInsurance, HealthProfessional, HealthProvider } from '@/lib/types';
import { AddProviderSheet } from '@/components/health/add-provider-sheet';
import { AddProfessionalSheet } from '@/components/health/add-professional-sheet';
import { AddInsuranceSheet } from '@/components/health/add-insurance-sheet';
import { HealthProviderCard } from '@/components/health/health-provider-card';
import { Separator } from '@/components/ui/separator';

export default function HealthPage() {
  const [isProviderSheetOpen, setIsProviderSheetOpen] = useState(false);
  const [isProfessionalSheetOpen, setIsProfessionalSheetOpen] = useState(false);
  const [isInsuranceSheetOpen, setIsInsuranceSheetOpen] = useState(false);

  const [editingProvider, setEditingProvider] = useState<HealthProvider | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<HealthProfessional | null>(null);
  const [editingInsurance, setEditingInsurance] = useState<HealthInsurance | null>(null);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const providersQuery = useMemoFirebase(() => 
    !user ? null : query(collection(firestore, `users/${user.uid}/healthProviders`), orderBy('name', 'asc'))
  , [firestore, user]);
  
  const professionalsQuery = useMemoFirebase(() => 
    !user ? null : query(collection(firestore, `users/${user.uid}/healthProfessionals`), orderBy('name', 'asc'))
  , [firestore, user]);

  const insurancesQuery = useMemoFirebase(() => 
    !user ? null : query(collection(firestore, `users/${user.uid}/healthInsurances`))
  , [firestore, user]);

  const { data: providersData, isLoading: isProvidersLoading } = useCollection<HealthProvider>(providersQuery);
  const { data: professionalsData, isLoading: isProfessionalsLoading } = useCollection<HealthProfessional>(professionalsQuery);
  const { data: insurancesData, isLoading: isInsuranceLoading } = useCollection<HealthInsurance>(insurancesQuery);

  const { healthPlan, dentalPlan } = useMemo(() => {
    if (!insurancesData) return { healthPlan: null, dentalPlan: null };
    return {
      healthPlan: insurancesData.find(i => i.type === 'Saúde') || null,
      dentalPlan: insurancesData.find(i => i.type === 'Odontológico') || null,
    };
  }, [insurancesData]);
  
  const handleEditProvider = (provider: HealthProvider) => {
    setEditingProvider(provider);
    setIsProviderSheetOpen(true);
  };
  
  const handleEditProfessional = (professional: HealthProfessional) => {
    setEditingProfessional(professional);
    setIsProfessionalSheetOpen(true);
  }

  const handleEditInsurance = (insurance: HealthInsurance | null) => {
    setEditingInsurance(insurance);
    setIsInsuranceSheetOpen(true);
  }

  const isLoading = isUserLoading || isProvidersLoading || isProfessionalsLoading || isInsuranceLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddProviderSheet 
        isOpen={isProviderSheetOpen}
        onClose={() => { setIsProviderSheetOpen(false); setEditingProvider(null); }}
        provider={editingProvider}
      />
       <AddProfessionalSheet 
        isOpen={isProfessionalSheetOpen}
        onClose={() => { setIsProfessionalSheetOpen(false); setEditingProfessional(null); }}
        professional={editingProfessional}
        providers={providersData || []}
      />
       <AddInsuranceSheet
        isOpen={isInsuranceSheetOpen}
        onClose={() => { setIsInsuranceSheetOpen(false); setEditingInsurance(null); }}
        insurance={editingInsurance}
      />

      <div className="space-y-8">
        <PageHeader
          title="Saúde & Bem-Estar"
          description="Sua agenda centralizada de contatos de saúde, convênios e profissionais."
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsProviderSheetOpen(true)}>
              <Building className="mr-2 h-4 w-4" />
              Adicionar Empresa
            </Button>
            <Button onClick={() => setIsProfessionalSheetOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Adicionar Profissional
            </Button>
          </div>
        </PageHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Plano de Saúde</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEditInsurance(healthPlan)}>
                  {healthPlan ? 'Editar' : 'Adicionar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {healthPlan ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Operadora / Plano</p>
                    <p className="font-semibold">{healthPlan.operator} / {healthPlan.planName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nº da Carteirinha (Titular)</p>
                    <p className="font-semibold">{healthPlan.cardNumber}</p>
                  </div>
                   {healthPlan.dependents && healthPlan.dependents.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Dependentes</p>
                        <div className="space-y-1 mt-1">
                          {healthPlan.dependents.map(dep => (
                            <p key={dep.name} className="text-xs">
                              <span className="font-medium">{dep.name}:</span> {dep.cardNumber || 'N/D'}
                            </p>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Nenhum plano de saúde cadastrado.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tooth className="h-5 w-5 text-primary" />
                  <CardTitle>Plano Odontológico</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEditInsurance(dentalPlan)}>
                  {dentalPlan ? 'Editar' : 'Adicionar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dentalPlan ? (
                <div className="space-y-3 text-sm">
                   <div>
                    <p className="text-muted-foreground">Operadora / Plano</p>
                    <p className="font-semibold">{dentalPlan.operator} / {dentalPlan.planName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nº da Carteirinha (Titular)</p>
                    <p className="font-semibold">{dentalPlan.cardNumber}</p>
                  </div>
                   {dentalPlan.dependents && dentalPlan.dependents.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Dependentes</p>
                         <div className="space-y-1 mt-1">
                          {dentalPlan.dependents.map(dep => (
                            <p key={dep.name} className="text-xs">
                              <span className="font-medium">{dep.name}:</span> {dep.cardNumber || 'N/D'}
                            </p>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Nenhum plano odontológico cadastrado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="space-y-4">
          {providersData && providersData.length > 0 ? (
            providersData.map(provider => (
              <HealthProviderCard 
                key={provider.id} 
                provider={provider} 
                professionals={professionalsData || []}
                onEditProvider={handleEditProvider}
                onEditProfessional={handleEditProfessional}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
                <Hospital className="h-10 w-10 text-muted-foreground mb-4"/>
                <h3 className="text-lg font-semibold">Sua agenda de saúde está vazia</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Comece adicionando uma empresa (clínica, academia) ou um profissional de saúde para organizar seus contatos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
