
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, DollarSign, Quote, BarChart3, Target, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ClientRoot() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      redirect('/dashboard');
    }
  }, [user, isUserLoading]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Xô Planilhas</span>
          </Link>
          <Button variant="ghost" onClick={() => redirect('/login')}>
            Entrar
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="border-b py-20 text-center md:py-32">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Diga adeus às planilhas.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Assuma o controle da sua vida financeira com uma ferramenta simples, visual e feita para você. Chega de fórmulas e abas confusas.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" onClick={() => redirect('/login')}>
                Começar de graça
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
             <p className="mt-4 text-xs text-muted-foreground">
              Cadastro rápido. Sem cartão de crédito.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Tudo o que você precisa, sem a complicação</h2>
                    <p className="mt-4 text-muted-foreground">
                        Centralize suas finanças e tome decisões mais inteligentes.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Visão Clara</h3>
                        <p className="mt-2 text-muted-foreground">
                            Com dashboards e gráficos intuitivos, você entende para onde seu dinheiro está indo em segundos.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Controle Total</h3>
                        <p className="mt-2 text-muted-foreground">
                            Registre rendas, despesas e dívidas em um só lugar. Organize tudo com categorias personalizadas.
                        </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Target className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Metas Inteligentes</h3>
                        <p className="mt-2 text-muted-foreground">
                            Crie objetivos de economia e investimento, acompanhe o progresso e veja suas metas se tornarem realidade.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Amado por quem trocou as planilhas</h2>
                    <p className="mt-4 text-muted-foreground">
                        Veja o que nossos primeiros usuários estão dizendo.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                     <Card>
                        <CardContent className="pt-6">
                            <Quote className="h-6 w-6 text-muted-foreground/50" />
                            <p className="mt-4 italic">"Finalmente um app que não me faz sentir burro. Em 15 minutos eu já tinha cadastrado tudo. Adeus, planilha de 10 abas!"</p>
                        </CardContent>
                        <CardHeader className="flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                                <AvatarFallback>JS</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">João Silva</CardTitle>
                                <p className="text-sm text-muted-foreground">Freelancer</p>
                            </div>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardContent className="pt-6">
                            <Quote className="h-6 w-6 text-muted-foreground/50" />
                            <p className="mt-4 italic">"O calendário de vencimentos salvou meu mês. Eu sempre esquecia de pagar alguma conta. Agora, está tudo lá, bem visual."</p>
                        </CardContent>
                        <CardHeader className="flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026705d" />
                                <AvatarFallback>MR</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">Mariana Costa</CardTitle>
                                <p className="text-sm text-muted-foreground">Analista de Marketing</p>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                             <Quote className="h-6 w-6 text-muted-foreground/50" />
                            <p className="mt-4 italic">"Eu e meu marido usamos para planejar nossas finanças juntos. A simplicidade para ver o progresso das nossas metas é incrível."</p>
                        </CardContent>
                        <CardHeader className="flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026706d" />
                                <AvatarFallback>CP</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">Carla Pereira</CardTitle>
                                <p className="text-sm text-muted-foreground">Empreendedora</p>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-muted/50 py-16 md:py-24">
            <div className="container mx-auto max-w-3xl px-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Dúvidas Frequentes</h2>
                    <p className="mt-4 text-muted-foreground">
                        Respostas para as perguntas mais comuns.
                    </p>
                </div>
                <Accordion type="single" collapsible className="mt-8 w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>O Xô Planilhas é realmente gratuito?</AccordionTrigger>
                        <AccordionContent>
                            Sim! Oferecemos um plano gratuito robusto que inclui todas as funcionalidades essenciais para organizar sua vida financeira. No futuro, teremos planos pagos com recursos avançados, como sincronização bancária automática.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                        <AccordionContent>
                            A segurança é nossa prioridade máxima. Seus dados são criptografados e armazenados com segurança usando a infraestrutura do Google Firebase. Ninguém tem acesso às suas informações financeiras além de você.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Posso usar em múltiplos dispositivos?</AccordionTrigger>
                        <AccordionContent>
                            Sim! Por ser um aplicativo web, você pode acessar sua conta do Xô Planilhas em qualquer dispositivo com um navegador, seja no seu computador, tablet ou celular. Seus dados estarão sempre sincronizados.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

         {/* Final CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Pronto para simplificar suas finanças?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Junte-se a milhares de pessoas que abandonaram a complicação e encontraram a clareza financeira.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => redirect('/login')}>
                Criar minha conta gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
              <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Xô Planilhas. Todos os direitos reservados.
              </p>
              <div className="flex gap-4">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Termos</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacidade</Link>
              </div>
          </div>
      </footer>
    </div>
  );
}

export default function RootPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render a loader on the server and initial client render
  if (!isClient) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  // Once mounted on the client, render the actual component
  return <ClientRoot />;
}

// Helper components that were in the original page but might be useful
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

