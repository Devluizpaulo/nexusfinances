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
    return query(collection(firestore, `users`), orderBy('registrationDate', 'desc'));
  }, [firestore]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);

  const { totalUsers, newUsersLast30Days } = useMemo(() => {
    if (!usersData) return { totalUsers: 0, newUsersLast30Days: 0 };
    
    const totalUsers = usersData.length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newUsersLast30Days = usersData.filter(u => {
      if (!u.registrationDate) return false;
      
      // Firestore Timestamps can be objects, so we need to convert them
      const creationDate = (u.registrationDate as any).toDate ? (u.registrationDate as any).toDate() : new Date(u.registrationDate as string);
      
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
           <div className="grid gap-4 md:grid-cols-2">
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
                Atividades recentes e eventos importantes do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Funcionalidades de logs serão implementadas aqui.</p>
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
              <CardTitle>Monetização com Assinaturas</CardTitle>
              <CardDescription>
                Gerencie planos e visualize o status das assinaturas.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="prose prose-sm max-w-full text-foreground/80">
                <p>A integração com um gateway de pagamento como o Mercado Pago requer uma arquitetura de backend segura para funcionar corretamente.</p>
                <p>
                  Os próximos passos para implementar esta funcionalidade seriam:
                </p>
                <ol>
                  <li>
                    <strong>Configurar o Backend com Cloud Functions:</strong>
                    <ul>
                      <li>Criar uma função para gerar uma "preferência de pagamento" na API do Mercado Pago quando um usuário decide assinar.</li>
                      <li>Criar uma outra função (webhook) para receber notificações do Mercado Pago (ex: pagamento aprovado, assinatura cancelada).</li>
                      <li>Essa função de webhook seria responsável por atualizar o status da assinatura do usuário no Firestore (ex: `role: 'premium'`).</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Desenvolver a Interface do Usuário:</strong>
                    <ul>
                        <li>Nesta aba, criar uma interface para você, administrador, cadastrar e editar os planos de assinatura (ex: nome do plano, preço, ID do Mercado Pago).</li>
                        <li>Na área do usuário, criar uma página onde ele possa ver os planos, clicar em "Assinar" e ser redirecionado para o checkout do Mercado Pago.</li>
                    </ul>
                  </li>
                   <li>
                    <strong>Atualizar Regras de Segurança:</strong>
                    <ul>
                        <li>Modificar o <code>firestore.rules</code> para proteger funcionalidades premium, permitindo acesso apenas a usuários com o status de assinante ativo.</li>
                    </ul>
                  </li>
                </ol>
                <p>Esta abordagem garante que o processamento de pagamentos seja seguro e que o status dos usuários seja atualizado de forma confiável.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
