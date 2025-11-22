'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ClientRoot() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      redirect('/dashboard');
    }
  }, [user, isUserLoading]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            Xô
          </div>
          <span className="text-sm font-semibold tracking-tight">xô planilhas</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => redirect('/login')}>
          Entrar
        </Button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Chega de planilhas. Organize seu dinheiro em um painel simples.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            O xô planilhas junta rendas, despesas, dívidas e metas em um só lugar. Sem fórmulas, sem abas confusas,
            só o que você precisa para saber para onde o dinheiro está indo.
          </p>

          <div className="grid gap-3 text-left sm:grid-cols-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>Resumo do mês com cartões claros de quanto entra, quanto sai e saldo.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>Calendário financeiro para ver vencimentos e recebimentos por dia.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>Metas de reserva e investimento com previsão de quando você chega lá.</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => redirect('/login')}>
              Começar agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => redirect('/login')}
            >
              Já uso planilhas, quero testar mesmo assim
            </button>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40 px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Um painel que fala a sua língua</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Veja em segundos quanto entrou, quanto saiu, o que vence no mês e como estão suas metas. É a visão que
              você tentava montar nas planilhas, pronta em um único lugar.
            </p>
          </div>
          <div className="flex-1">
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
              {/* Substitua o src abaixo por um print real do dashboard quando tiver a imagem pronta */}
              <img
                src="/dashboard-preview.png"
                alt="Visão geral do painel financeiro do xô planilhas"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RootPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <ClientRoot /> : null;
}
