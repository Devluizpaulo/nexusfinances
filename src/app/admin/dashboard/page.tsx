'use client';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useUser, useMemoFirebase, type AppUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from './users/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Users, UserPlus, DollarSign, Activity, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { subDays } from 'date-fns';

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `users`), orderBy('metadata.creationTime', 'desc'));
  }, [firestore]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);

  const { totalUsers, newUsersLast30Days } = useMemo(() => {
    if (!usersData) return { totalUsers: 0, newUsersLast30Days: 0 };
    
    const totalUsers = usersData.length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newUsersLast30Days = usersData.filter(u => {
      if (!u.metadata?.creationTime) return false;
      const creationDate = new Date(u.metadata.creationTime);
      return creationDate > thirtyDaysAgo;
    }).length;

    return { totalUsers, newUsersLast30Days };
  }, [usersData]);

  if (user && user.role !== 'superadmin') {
    toast({
      variant: "destructive",
      title: "Acesso Negado",
      description: "Você não tem permissão para acessar esta página.",
    });
    return redirect('/dashboard');
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);

  if (isUsersLoading) {
     return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Painel do Administrador"
        description="Gerencie usuários, visualize estatísticas e configure o sistema."
      />
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
          <TabsTrigger value="monetization">Monetização</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total de Usuários"
                value={formatNumber(totalUsers)}
                icon={Users}
                description="Total de usuários cadastrados na plataforma."
              />
              <KpiCard
                title="Novos Cadastros"
                value={`+${formatNumber(newUsersLast30Days)}`}
                icon={UserPlus}
                description="Novos usuários nos últimos 30 dias."
              />
              <KpiCard
                title="Receita (Placeholder)"
                value="R$ 0,00"
                icon={DollarSign}
                description="Receita total gerada (funcionalidade futura)."
              />
              <KpiCard
                title="Usuários Ativos (Placeholder)"
                value="0"
                icon={Activity}
                description="Usuários ativos na última semana (funcionalidade futura)."
              />
            </div>
        </TabsContent>
        <TabsContent value="users">
          <UsersTable usersData={usersData || []} />
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Atividades recentes e eventos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Funcionalidades de logs serão implementadas aqui. Isso exigirá um sistema de backend para registrar eventos importantes, como logins, falhas e modificações de dados.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Tickets de Suporte</CardTitle>
              <CardDescription>
                Gerencie as solicitações de suporte dos usuários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Funcionalidades de suporte serão implementadas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monetization">
          <Card>
            <CardHeader>
              <CardTitle>Monetização</CardTitle>
              <CardDescription>
                Gerencie planos, assinaturas e pagamentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Funcionalidades de monetização serão implementadas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
