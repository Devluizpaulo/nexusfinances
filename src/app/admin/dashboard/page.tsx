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
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'education' | 'logs' | 'subscriptions'>('overview');

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
          variant={activeSection === 'subscriptions' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('subscriptions')}
        >
          Assinaturas
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

      {activeSection === 'subscriptions' && (
        <section className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Assinaturas</CardTitle>
              <CardDescription>
                Crie, edite e gerencie os planos de assinatura disponíveis para os usuários.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    A interface para gerenciar planos de assinatura está disponível em uma página dedicada.
                </p>
            </CardContent>
            <CardContent>
                <Button asChild>
                    <Link href="/monetization">Gerenciar Planos</Link>
                </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </>
  );
}

    