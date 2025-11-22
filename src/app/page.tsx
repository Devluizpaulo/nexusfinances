
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, DollarSign, Quote, BarChart3, Target, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function ClientRoot() {
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');

  const handleStart = () => {
    // Redirect to registration page with email pre-filled
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    redirect(`/login?${params.toString()}`);
  };


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

  const heroImage = PlaceHolderImages.find(p => p.id === 'lp-hero');
  const feature1Image = PlaceHolderImages.find(p => p.id === 'lp-feature-1');
  const feature2Image = PlaceHolderImages.find(p => p.id === 'lp-feature-2');
  const feature3Image = PlaceHolderImages.find(p => p.id === 'lp-feature-3');


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">xô planilhas</span>
          </Link>
          <Button variant="ghost" onClick={() => redirect('/login')}>
            Entrar
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative border-b bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-28">
            <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 md:grid-cols-2">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                      Diga adeus às planilhas.
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:mx-0">
                      Assuma o controle da sua vida financeira com uma ferramenta simples, visual e feita para você. Chega de fórmulas e abas confusas.
                    </p>
                    <div className="mt-8 flex justify-center md:justify-start">
                      <form onSubmit={(e) => { e.preventDefault(); handleStart(); }} className="flex w-full max-w-md flex-col items-center gap-2 sm:flex-row">
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            className="h-12 flex-1 rounded-lg px-4 text-base"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <Button
                            type="submit"
                            size="lg"
                            className="h-12 w-full bg-primary text-white hover:bg-primary/90 sm:w-auto"
                          >
                            Começar Agora
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </form>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Cadastro rápido. Sem cartão de crédito.
                    </p>
                </div>
                 {heroImage && (
                    <div className="relative h-64 w-full md:h-full">
                        <Image
                            src={heroImage.imageUrl}
                            alt={heroImage.description}
                            fill
                            className="rounded-xl object-cover shadow-2xl"
                            data-ai-hint={heroImage.imageHint}
                        />
                    </div>
                )}
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
                <div className="mt-16 grid gap-16">
                  {feature1Image && (
                    <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
                        <div className="relative h-64 w-full">
                             <Image src={feature1Image.imageUrl} alt={feature1Image.description} fill className="rounded-lg object-cover" data-ai-hint={feature1Image.imageHint} />
                        </div>
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-2xl font-semibold">Visão Clara</h3>
                            <p className="mt-2 text-muted-foreground">
                                Com dashboards e gráficos intuitivos, você entende para onde seu dinheiro está indo em segundos. Chega de decifrar tabelas.
                            </p>
                        </div>
                    </div>
                  )}
                   {feature2Image && (
                     <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
                        <div className="md:order-2 relative h-64 w-full">
                            <Image src={feature2Image.imageUrl} alt={feature2Image.description} fill className="rounded-lg object-cover" data-ai-hint={feature2Image.imageHint} />
                        </div>
                        <div className="md:order-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-2xl font-semibold">Controle Total</h3>
                            <p className="mt-2 text-muted-foreground">
                                Registre rendas, despesas e dívidas em um só lugar. Organize tudo com categorias personalizadas e veja seu balanço em tempo real.
                            </p>
                        </div>
                    </div>
                   )}
                   {feature3Image && (
                    <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
                        <div className="relative h-64 w-full">
                            <Image src={feature3Image.imageUrl} alt={feature3Image.description} fill className="rounded-lg object-cover" data-ai-hint={feature3Image.imageHint} />
                        </div>
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Target className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-2xl font-semibold">Metas Inteligentes</h3>
                            <p className="mt-2 text-muted-foreground">
                                Crie objetivos de economia e investimento, acompanhe o progresso e veja suas metas se tornarem realidade mais rápido.
                            </p>
                        </div>
                    </div>
                   )}
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
                        <AccordionTrigger>O xô planilhas é realmente gratuito?</AccordionTrigger>
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
                            Sim! Por ser um aplicativo web, você pode acessar sua conta do xô planilhas em qualquer dispositivo com um navegador, seja no seu computador, tablet ou celular. Seus dados estarão sempre sincronizados.
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
                  © {new Date().getFullYear()} xô planilhas. Todos os direitos reservados.
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
