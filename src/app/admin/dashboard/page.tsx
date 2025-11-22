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
import type { Log } from '@/lib/types';
import { LogsTable } from './logs/logs-table';

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `users`), orderBy('registrationDate', 'desc'));
  }, [firestore]);
  
  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `logs`), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);
  const { data: logsData, isLoading: isLogsLoading } = useCollection<Log>(logsQuery);

  const { totalUsers, newUsersLast30Days } = useMemo(() => {
    if (!usersData) return { totalUsers: 0, newUsersLast30Days: 0 };
    
    const totalUsers = usersData.length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newUsersLast30Days = usersData.filter(u => {
      if (!u.registrationDate) return false;
      
      // Firestore Timestamps can be objects, so we need to convert them
      const creationDate = (u.registrationDate as Timestamp).toDate ? (u.registrationDate as Timestamp).toDate() : new Date(u.registrationDate as string);
      
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
  
  const isLoading = isUsersLoading || isLogsLoading;

  if (isLoading) {
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="education">Educação</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="monetization">Monetização</TabsTrigger>
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
         <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Conteúdo Educacional</CardTitle>
              <CardDescription>
                Informações sobre como o conteúdo da "Jornada Financeira" é gerenciado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-full text-foreground/80">
                <h4>Abordagem Atual: Conteúdo Dinâmico no Firestore</h4>
                <p>O conteúdo das trilhas de educação agora é gerenciado através da coleção <code>/education</code> no Firestore. Esta abordagem dinâmica oferece muito mais flexibilidade do que o conteúdo estático anterior.</p>
                
                <h5>Vantagens da nova abordagem:</h5>
                <ul>
                  <li><strong>Flexibilidade:</strong> O conteúdo pode ser atualizado a qualquer momento sem a necessidade de um novo deploy do aplicativo.</li>
                  <li><strong>Escalabilidade:</strong> Facilita a adição de novas trilhas e módulos no futuro.</li>
                  <li><strong>Gerenciamento Centralizado:</strong> Todo o conteúdo educacional fica em um único local, facilitando a gestão.</li>
                </ul>

                <h5>Como atualizar o conteúdo:</h5>
                <p>Atualmente, a atualização do conteúdo deve ser feita diretamente no Firestore. Administradores podem acessar o Console do Firebase para editar, adicionar ou remover documentos na coleção <code>/education</code>.</p>
                
                <h4 className="mt-6">Evolução Futura: CMS Integrado</h4>
                <p>
                  O próximo passo lógico é construir uma interface de gerenciamento (CMS) aqui mesmo, nesta aba. Isso permitirá que administradores criem e editem as trilhas de forma visual e intuitiva, sem precisar acessar o Firebase diretamente. Esta funcionalidade será desenvolvida em uma fase posterior do projeto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <LogsTable logsData={logsData || []} />
        </TabsContent>
        <TabsContent value="monetization">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monetização com Anúncios</CardTitle>
                <CardDescription>
                  Um guia para integrar anúncios em seu aplicativo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-full text-foreground/80">
                  <p>A monetização com anúncios, através de serviços como o Google AdSense, é uma forma eficaz de gerar receita. O processo envolve alguns passos-chave:</p>
                  <ol>
                    <li>
                      <strong>Configurar uma Conta de Anúncios:</strong>
                      <ul>
                        <li>Primeiro, você precisa se inscrever em uma rede de anúncios, como o Google AdSense. Após a aprovação, você receberá um "ID de editor" e snippets de código para colocar em seu site.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Criar um Componente de Anúncio:</strong>
                      <ul>
                        <li>No seu projeto Next.js, é uma boa prática criar um componente React (ex: <code>components/ads/AdBanner.tsx</code>). Este componente irá conter o script fornecido pelo AdSense e será responsável por carregar o anúncio.</li>
                        <li>É importante ter cuidado para que o script não afete negativamente o desempenho da página. O uso de <code>next/script</code> pode ajudar a otimizar o carregamento.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Adicionar os Anúncios à Interface:</strong>
                      <ul>
                          <li>Com o componente criado, você pode decidir onde exibir os anúncios. Lugares comuns incluem a barra lateral, o rodapé ou entre seções de conteúdo.</li>
                          <li>Por exemplo, você poderia adicionar o componente de anúncio dentro do <code>AuthenticatedLayout</code> para que ele apareça em todas as páginas para usuários logados.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Gerenciar `ads.txt`:</strong>
                      <ul>
                          <li>As redes de publicidade exigem que você adicione um arquivo <code>ads.txt</code> na raiz do seu site para verificar a autenticidade dos vendedores de anúncios. Você pode adicionar este arquivo à pasta <code>public/</code> do seu projeto Next.js.</li>
                      </ul>
                    </li>
                  </ol>
                  <p>Essa abordagem permite uma integração limpa e gerenciável de anúncios em seu aplicativo, abrindo um novo canal de monetização.</p>
                </div>
              </CardContent>
            </Card>
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
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

    