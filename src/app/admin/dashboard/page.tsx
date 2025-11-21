'use client';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

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
        description="Bem-vindo à área de administração do Nexus Finanças."
      />
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>
            Aqui você poderá gerenciar usuários, visualizar estatísticas e
            configurar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Funcionalidades de administração serão implementadas aqui.</p>
        </CardContent>
      </Card>
    </>
  );
}
