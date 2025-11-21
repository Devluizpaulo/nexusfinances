'use client';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from './users/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();

  if (user && user.role !== 'superadmin') {
     toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
    });
    return redirect('/dashboard');
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
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>
                Métricas e estatísticas gerais do aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Funcionalidades de visão geral serão implementadas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <UsersTable />
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
