'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building, User, Shield, Loader2, Hospital, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { HealthInsurance, HealthProfessional, HealthProvider } from '@/lib/types';
import { AddProviderSheet } from '@/components/health/add-provider-sheet';
import { AddProfessionalSheet } from '@/components/health/add-professional-sheet';
import { AddInsuranceSheet } from '@/components/health/add-insurance-sheet';
import { HealthProviderCard } from '@/components/health/health-provider-card';
import { ProfessionalCard } from '@/components/health/professional-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const ToothIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.34 2.846a1.28 1.28 0 0 1 2.39.735l.053.138 1.25 5.01a1.28 1.28 0 0 0 2.388-.734 1.28 1.28 0 0 1 2.39.735l.054.138 1.05 4.197a1.28 1.28 0 0 1-2.022 1.34l-.11-.09-2.73-2.73a1.28 1.28 0 0 0-1.815 0l-2.73 2.73a1.28 1.28 0 0 1-2.021-1.34l-.11-.09 1.05-4.197a1.28 1.28 0 0 1 2.39-.735 1.28 1.28 0 0 0 2.388-.734l1.25-5.01a1.28 1.28 0 0 1-2.022-1.34L11.15 1.5a1.28 1.28 0 0 1-.7-1.235 1.28 1.28 0 0 0-2.56 0 1.28 1.28 0 0 1-.7 1.235l-1.81 1.81a1.28 1.28 0 0 1-2.022 1.34z" />
    <path d="M21 13a8 8 0 1 1-15.059-4.941" />
  </svg>
);


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

  const handleEditInsurance = (insurance: HealthInsurance | null, type: 'Saúde' | 'Odontológico') => {
    setEditingInsurance(insurance ?? { type } as HealthInsurance);
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
          title="Central de Saúde"
          description="Sua agenda centralizada de convênios, profissionais e empresas de saúde."
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsProviderSheetOpen(true)}>
              <Building className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
            <Button onClick={() => setIsProfessionalSheetOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Novo Profissional
            </Button>
          </div>
        </PageHeader>
        
        <Tabs defaultValue="plans" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plans">Meus Convênios</TabsTrigger>
                <TabsTrigger value="professionals">Profissionais</TabsTrigger>
                <TabsTrigger value="providers">Empresas e Clínicas</TabsTrigger>
            </TabsList>

            {/* Aba de Convênios */}
            <TabsContent value="plans" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Plano de Saúde</CardTitle>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleEditInsurance(healthPlan, 'Saúde')}>
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
                            <ToothIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Plano Odontológico</CardTitle>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleEditInsurance(dentalPlan, 'Odontológico')}>
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
            </TabsContent>

            {/* Aba de Profissionais */}
            <TabsContent value="professionals" className="mt-6">
                <div className="space-y-4">
                {professionalsData && professionalsData.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {professionalsData.map(professional => (
                            <ProfessionalCard 
                                key={professional.id}
                                professional={professional}
                                providers={providersData || []}
                                onEdit={handleEditProfessional}
                            />
                        ))}
                    </div>
                ) : (
                    <Card>
                    <CardContent className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
                        <Stethoscope className="h-10 w-10 text-muted-foreground mb-4"/>
                        <h3 className="text-lg font-semibold">Sua lista de profissionais está vazia</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Adicione seus médicos, dentistas, terapeutas e outros profissionais de saúde para ter os contatos sempre à mão.
                        </p>
                    </CardContent>
                    </Card>
                )}
                </div>
            </TabsContent>

            {/* Aba de Empresas */}
            <TabsContent value="providers" className="mt-6">
                 <div className="space-y-4">
                {providersData && providersData.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                    {providersData.map(provider => (
                    <HealthProviderCard 
                        key={provider.id} 
                        provider={provider} 
                        professionals={professionalsData || []}
                        onEditProvider={handleEditProvider}
                        onEditProfessional={handleEditProfessional}
                    />
                    ))}
                    </div>
                ) : (
                    <Card>
                    <CardContent className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
                        <Hospital className="h-10 w-10 text-muted-foreground mb-4"/>
                        <h3 className="text-lg font-semibold">Nenhuma empresa de saúde cadastrada</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Adicione clínicas, hospitais, academias e outros locais que você frequenta.
                        </p>
                    </CardContent>
                    </Card>
                )}
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
