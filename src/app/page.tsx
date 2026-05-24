'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LandingHeader } from '@/components/landing-header';
import { PremiumBackground } from '@/components/premium-effects';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const highlights = [
  { label: 'Receitas, despesas e dívidas no mesmo fluxo', icon: Wallet },
  { label: 'Alertas de vencimento e metas acompanháveis', icon: Calendar },
  { label: 'Relatórios claros para decidir sem planilhas', icon: BarChart3 },
];

const benefits = [
  'Cadastro rápido, sem cartão',
  'Organização por categorias',
  'Visão mensal e anual',
  'Jornada de educação financeira',
];

const featureCards = [
  {
    title: 'Painel que responde perguntas reais',
    description: 'Veja saldo do mês, entradas, saídas, taxa de poupança e tendências sem caçar números em abas diferentes.',
    icon: BarChart3,
  },
  {
    title: 'Rotina financeira com menos atrito',
    description: 'Registre renda, despesa, dívida ou meta pelo mesmo botão de ação, com vencimentos e recorrências no radar.',
    icon: Wallet,
  },
  {
    title: 'Metas com progresso visível',
    description: 'Transforme reservas e objetivos em acompanhamento simples, com contribuições e marcos fáceis de entender.',
    icon: Target,
  },
  {
    title: 'Aprendizado dentro do produto',
    description: 'Trilhas, desafios e simulações ajudam a melhorar decisões sem sair do contexto dos seus dados.',
    icon: GraduationCap,
  },
];

function ClientRoot() {
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      redirect('/dashboard');
    }
  }, [user]);

  const handleStart = () => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    redirect(`/login?${params.toString()}`);
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const heroImage = PlaceHolderImages.find((p) => p.id === 'lp-hero');

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <PremiumBackground />
      <LandingHeader />
      <main>
        <section className="relative border-b border-white/10">
          <div className="container mx-auto grid min-h-[calc(100vh-5rem)] grid-cols-1 items-center gap-10 px-4 py-10 md:grid-cols-[0.95fr_1.05fr] md:py-14">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
                <Sparkles className="h-4 w-4" />
                Controle financeiro sem planilha quebrando
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-normal text-slate-50 md:text-6xl">
                Xô Planilhas
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                Organize entradas, gastos, dívidas, cartões e metas em uma experiência única, clara e pronta para o dia a dia.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleStart(); }} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="h-12 rounded-lg border-slate-700 bg-slate-950/70 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" className="h-12 shrink-0 rounded-lg px-6">
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                {benefits.slice(0, 3).map((benefit) => (
                  <span key={benefit} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover object-top opacity-95"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {highlights.map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-slate-900/80 p-3 backdrop-blur">
                      <item.icon className="h-5 w-5 text-cyan-300" />
                      <p className="mt-2 text-sm font-medium leading-snug text-slate-100">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Produto completo</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">Da visão geral aos painéis específicos, tudo fica encontrável.</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                A navegação foi pensada para quem consulta o app repetidamente: menos enfeite, mais clareza, ações previsíveis e dados com prioridade.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((feature) => (
                <div key={feature.title} className="rounded-lg border border-white/10 bg-card/70 p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-4 rounded-lg border border-white/10 bg-slate-900/45 p-5 md:grid-cols-4">
              {[
                ['+5.000', 'usuários organizando a rotina'],
                ['R$ 8,2M+', 'acompanhados em metas e economia'],
                ['24/7', 'alertas e acesso pelo navegador'],
                ['4 módulos', 'planejamento, gastos, metas e educação'],
              ].map(([value, label]) => (
                <div key={value} className="border-white/10 md:border-l md:first:border-l-0 md:pl-5 md:first:pl-0">
                  <p className="text-3xl font-bold text-slate-50">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="border-y border-white/10 bg-slate-950/45 py-16">
          <div className="container mx-auto grid gap-10 px-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <ShieldCheck className="h-8 w-8 text-emerald-300" />
              <h2 className="mt-4 text-3xl font-bold">Feito para virar hábito.</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                O app reúne registros, vencimentos, metas e aprendizado em um fluxo que reduz retrabalho e melhora a tomada de decisão.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/70 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold tracking-normal">Dúvidas Frequentes</h2>
            <Accordion type="single" collapsible className="mt-6 w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>O Xô Planilhas é gratuito?</AccordionTrigger>
                <AccordionContent>
                  Sim. O plano gratuito inclui funcionalidades essenciais para organizar sua vida financeira. Recursos avançados podem ser oferecidos em planos pagos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Meus dados ficam seguros?</AccordionTrigger>
                <AccordionContent>
                  Os dados são armazenados na infraestrutura do Firebase e ficam associados à sua conta autenticada.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Posso acessar de outros dispositivos?</AccordionTrigger>
                <AccordionContent>
                  Sim. Como é um app web, você acessa pelo navegador no computador, tablet ou celular.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-8 text-center">
              <PiggyBank className="mx-auto h-9 w-9 text-cyan-300" />
              <h2 className="mt-4 text-3xl font-bold tracking-normal">Pronto para trocar a planilha por um painel vivo?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Comece com seus registros principais e deixe o app organizar a visão do mês para você.
              </p>
              <Button size="lg" asChild className="mt-6 rounded-lg">
                <Link href="/login">
                  Criar minha conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Xô Planilhas. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Termos</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacidade</Link>
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

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <ClientRoot />;
}
