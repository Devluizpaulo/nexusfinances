'use client';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useUser, useMemoFirebase, type AppUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { UsersTable } from './users/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { subDays } from 'date-fns';
import type { Log, EducationTrack } from '@/lib/types';
import { LogsTable } from './logs/logs-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'education' | 'logs' | 'monetization'>('overview');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `users`), orderBy('registrationDate', 'desc'));
  }, [firestore]);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `logs`), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const tracksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'education'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);
  const { data: logsData, isLoading: isLogsLoading } = useCollection<Log>(logsQuery);
  const { data: tracks, isLoading: isTracksLoading } = useCollection<EducationTrack>(tracksQuery);

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

  const isLoading = isUsersLoading || isLogsLoading || isTracksLoading;

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
        description="Gerencie usuários, conteúdo educacional, logs e mais."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b pb-2">
        <Button
          variant={activeSection === 'overview' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('overview')}
        >
          Visão Geral
        </Button>
        <Button
          variant={activeSection === 'users' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('users')}
        >
          Usuários
        </Button>
        <Button
          variant={activeSection === 'education' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('education')}
        >
          Educação
        </Button>
        <Button
          variant={activeSection === 'logs' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('logs')}
        >
          Logs
        </Button>
        <Button
          variant={activeSection === 'monetization' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('monetization')}
        >
          Monetização
        </Button>
      </div>

      {activeSection === 'overview' && (
        <section className="space-y-4 animate-in fade-in-50">
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
           <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
              <CardDescription>Últimos 5 eventos importantes do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <LogsTable logsData={logsData?.slice(0, 5) || []} />
            </CardContent>
          </Card>
        </section>
      )}

      {activeSection === 'users' && (
        <section className="space-y-4 animate-in fade-in-50">
          <UsersTable usersData={usersData || []} />
        </section>
      )}

      {activeSection === 'education' && (
        <section className="space-y-4 animate-in fade-in-50">
           <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Conteúdo Educacional</CardTitle>
                <CardDescription>
                  Adicione, edite e organize as trilhas da Jornada Financeira.
                </CardDescription>
              </div>
               <Button asChild>
                <Link href="/admin/education/new">Nova trilha</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isTracksLoading ? (
                 <div className="flex h-40 items-center justify-center">
                   <Loader2 className="h-6 w-6 animate-spin" />
                 </div>
              ) : (
                <div className="space-y-2">
                  {tracks && tracks.length > 0 ? (
                    tracks.map(track => (
                      <Card key={track.slug}>
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="space-y-1">
                            <span className="font-semibold">{track.title}</span>
                            <p className="text-sm text-muted-foreground">{track.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Ordem: {track.order}</Badge>
                            {/* Futuro botão de editar */}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                     <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                        <h3 className="text-lg font-semibold">Nenhuma trilha encontrada</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Clique em "Nova trilha" para criar a primeira jornada de aprendizado.
                        </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {activeSection === 'logs' && (
        <section className="space-y-4 animate-in fade-in-50">
          <LogsTable logsData={logsData || []} />
        </section>
      )}

      {activeSection === 'monetization' && (
        <section className="space-y-6 animate-in fade-in-50">
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
                <p>Esta abordagem permite uma integração limpa e gerenciável de anúncios em seu aplicativo, abrindo um novo canal de monetização.</p>
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
        </section>
      )}
    </>
  );
}
