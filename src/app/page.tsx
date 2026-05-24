'use client';

import { useEffect, useRef, useState } from 'react';
import { redirect } from 'next/navigation';
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
  Zap,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LandingHeader } from '@/components/landing-header';
import { PremiumBackground } from '@/components/premium-effects';
import { DashboardPreview } from '@/components/dashboard-preview';
import { MobileMockup } from '@/components/mobile-mockup';

// ---------- static data ----------

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

const howItWorks = [
  {
    step: '01',
    title: 'Conecte sua rotina financeira',
    description: 'Adicione rendas, despesas, cartões e dívidas em menos de 2 minutos. Sem planilha, sem fórmula.',
    icon: Wallet,
  },
  {
    step: '02',
    title: 'Acompanhe gastos e metas',
    description: 'O painel organiza tudo automaticamente: categorias, alertas de vencimento e progresso das suas metas.',
    icon: BarChart3,
  },
  {
    step: '03',
    title: 'Receba clareza instantânea',
    description: 'Entenda onde seu dinheiro está e o que fazer com ele. Sem abas abertas, sem culpa no final do mês.',
    icon: Zap,
  },
];

// ---------- hooks ----------

function useSectionReveal(rootMargin = '-60px') {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    el.classList.add('section-hidden');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove('section-hidden');
          el.classList.add('section-visible');
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}

// ---------- component ----------

function ClientRoot() {
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');

  // section refs
  const beforeAfterRef = useSectionReveal();
  const howRef = useSectionReveal();
  const featuresRef = useSectionReveal();
  const dashboardRef = useSectionReveal();
  const benefitsRef = useSectionReveal();
  const testimonialsRef = useSectionReveal();

  // Stagger observer — activates .visible on .stagger-card elements
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.stagger-card'));
    if (prefersReduced) {
      cards.forEach((c) => c.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user) redirect('/dashboard');
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <PremiumBackground />
      <LandingHeader />
      <main>

        {/* ─── HERO ─── */}
        <section className="relative border-b border-white/10">
          <div className="container mx-auto grid min-h-[calc(100vh-5rem)] grid-cols-1 items-center gap-10 px-4 py-14 md:grid-cols-[1fr_1fr] md:py-16 lg:gap-16">

            {/* Left: copy */}
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-sm font-medium text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Controle financeiro sem planilha quebrando
              </div>

              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                <span className="hero-gradient-text">Chega de planilha.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Controle gastos, cartões, dívidas e metas em um único painel — com clareza instantânea e sem depender de Excel.
              </p>

              <form
                onSubmit={(e) => { e.preventDefault(); handleStart(); }}
                className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              >
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="h-12 rounded-lg border-slate-700 bg-slate-950/70 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" className="h-12 shrink-0 rounded-lg px-6">
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-4 flex flex-col gap-1 text-sm text-slate-400">
                <p>✓ Sem cartão de crédito</p>
                <p>✓ Comece grátis em menos de 2 minutos</p>
              </div>

              {/* Stagger insight chips */}
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  { icon: BarChart3, label: 'Painel em tempo real' },
                  { icon: Calendar, label: 'Alertas de vencimento' },
                  { icon: Target, label: 'Metas com progresso' },
                ].map((chip, i) => (
                  <div
                    key={chip.label}
                    className="stagger-card inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300 backdrop-blur"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <chip.icon className="h-3.5 w-3.5 text-cyan-300" />
                    {chip.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: desktop + mobile mockup composition */}
            <div className="relative flex items-center justify-center min-h-[480px] md:min-h-[560px]">
              {/* Desktop preview — glass card backdrop */}
              <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden">
                <DashboardPreview animate={false} />
              </div>

              {/* Mobile mockup — floating in front */}
              <div className="absolute -right-4 bottom-0 z-10 hidden sm:block">
                <MobileMockup />
              </div>

              {/* Ambient glow behind */}
              <div
                className="absolute -z-10 h-64 w-64 rounded-full glow-breathing pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
                  top: '20%',
                  left: '30%',
                }}
              />
              <div
                className="absolute -z-10 h-48 w-48 rounded-full glow-breathing pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)',
                  bottom: '10%',
                  right: '5%',
                  animationDelay: '2s',
                }}
              />
            </div>
          </div>
        </section>

        {/* ─── BEFORE / AFTER ─── */}
        <section id="before-after" className="py-24 md:py-32 bg-gradient-to-b from-transparent via-slate-950/30 to-transparent">
          <div ref={beforeAfterRef} className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">A transformação</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                Veja a diferença entre planejamento e caos.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-8 backdrop-blur">
                <h3 className="text-lg font-bold text-red-300 mb-6">Seu sistema atual</h3>
                <ul className="space-y-4 text-slate-300">
                  {[
                    '14 planilhas diferentes para acompanhar',
                    'Gastos perdidos ou categorizados errado',
                    'Cartão de crédito bagunçado',
                    'Sem visão clara do mês',
                    'Metas vagas e sem acompanhamento',
                    'Dívidas espalhadas, sem controle',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 backdrop-blur">
                <h3 className="text-lg font-bold text-emerald-300 mb-6">Com Xô Planilhas</h3>
                <ul className="space-y-4 text-slate-300">
                  {[
                    'Um painel único e centralizado',
                    'Categorização automática e inteligente',
                    'Faturas e alertas de vencimento',
                    'Visão instantânea do seu mês',
                    'Metas com progresso visual',
                    'Controle total de dívidas e fluxo',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="py-24 md:py-32">
          <div ref={howRef} className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Em 3 passos</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                Do caos à clareza. Simples assim.
              </h2>
            </div>

            <div className="relative grid gap-8 md:grid-cols-3 max-w-4xl">
              {/* Connector line — desktop only */}
              <div className="absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-gradient-to-r from-cyan-500/30 via-emerald-500/30 to-transparent md:block" />

              {howItWorks.map((step, i) => (
                <div key={step.step} className="relative flex flex-col gap-4">
                  {/* Number badge */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <span className="text-5xl font-black leading-none hero-gradient-text opacity-80">
                        {step.step}
                      </span>
                      <div className="absolute -inset-2 -z-10 rounded-full blur-xl opacity-20"
                        style={{ background: i === 0 ? 'rgba(6,182,212,0.5)' : i === 1 ? 'rgba(16,185,129,0.5)' : 'rgba(99,102,241,0.5)' }}
                      />
                    </div>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <step.icon className="h-5 w-5 text-cyan-300" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-100">{step.title}</h3>
                  <p className="text-sm leading-6 text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" className="py-24 md:py-32">
          <div ref={featuresRef} className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Produto completo</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                Da visão geral aos painéis específicos, tudo fica encontrável.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                A navegação foi pensada para quem consulta o app repetidamente: menos enfeite, mais clareza, ações previsíveis e dados com prioridade.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((feature, i) => (
                <div
                  key={feature.title}
                  className="stagger-card group rounded-xl border border-white/10 bg-card/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-cyan-500/15 group-hover:text-cyan-300">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-4 rounded-xl border border-white/10 bg-slate-900/45 p-5 md:grid-cols-4">
              {[
                ['Painel em tempo real', 'veja seus dados ao registrar'],
                ['Controle automático', 'metas, alertas e comparativos'],
                ['Acesso em qualquer lugar', 'web, tablet e celular'],
                ['Educação financeira', 'trilhas, desafios e simulações'],
              ].map(([value, label]) => (
                <div key={value} className="border-white/10 md:border-l md:first:border-l-0 md:pl-5 md:first:pl-0">
                  <p className="text-base font-bold text-slate-50">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── DASHBOARD PREVIEW ─── */}
        <section id="live-dashboard" className="py-24 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/8 via-transparent to-emerald-500/8 blur-3xl glow-breathing pointer-events-none" />
          <div ref={dashboardRef} className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mb-16">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Veja em ação</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                Um painel que responde perguntas que você nem fez
              </h2>
              <p className="mt-4 text-base text-slate-400 leading-7">
                Saldo, gastos por categoria, alertas e progresso das metas — tudo em um olhar. Assim parece o seu controle financeiro daqui pra frente.
              </p>
            </div>

            <div className="max-w-3xl">
              <DashboardPreview animate className="shadow-2xl shadow-black/40" />
            </div>
          </div>
        </section>

        {/* ─── BENEFITS ─── */}
        <section id="benefits" className="border-y border-white/10 bg-slate-950/45 py-24 md:py-32">
          <div ref={benefitsRef} className="container mx-auto grid gap-16 px-4 md:grid-cols-[0.8fr_1.2fr]">
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

        {/* ─── TESTIMONIALS ─── */}
        <section id="testimonials" className="py-24 md:py-32 bg-slate-950/30">
          <div ref={testimonialsRef} className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Quem já usa</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">Pessoas reais, resultados reais</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: 'Marina S.', role: 'Autônoma', text: 'Finalmente consegui visualizar onde meu dinheiro está indo. Antes eram 5 planilhas diferentes.' },
                { name: 'Carlos M.', role: 'Salariado', text: 'Os alertas de dívida e as metas automáticas mudaram meu jeito de poupar. Simples demais.' },
                { name: 'Ana L.', role: 'Microempresária', text: 'Não preciso mais pedir ajuda. Tudo está em um lugar, entendo meu fluxo em 2 minutos.' },
              ].map((testimonial) => (
                <div key={testimonial.name} className="rounded-xl border border-white/10 bg-card/70 p-6 backdrop-blur">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-slate-200 leading-7 mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-slate-50">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="py-24 md:py-32">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold tracking-normal mb-6">Dúvidas Frequentes</h2>
            <Accordion type="single" collapsible className="mt-6 w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Preciso entender de finanças para usar?</AccordionTrigger>
                <AccordionContent>
                  Não. O app foi desenhado para qualquer pessoa. Tem uma jornada de educação dentro do produto com dicas e simulações que ajudam você a entender melhor suas finanças enquanto usa.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Funciona bem no celular?</AccordionTrigger>
                <AccordionContent>
                  Sim, é totalmente otimizado para mobile. Você registra gastos, vê suas metas e recebe alertas pelo navegador do seu celular sem limitações.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Consigo controlar cartão de crédito e dívidas?</AccordionTrigger>
                <AccordionContent>
                  Sim. Você registra cartões, faturas, dívidas parceladas e o app acompanha vencimentos, envia alertas e mostra o impacto no seu fluxo de caixa.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Quanto tempo leva para começar?</AccordionTrigger>
                <AccordionContent>
                  Menos de 2 minutos. Você cria a conta, adiciona uma renda e uma despesa, e o painel já começa a mostrar seus dados. Sem complicação.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-emerald-500/15 blur-3xl glow-breathing pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-cyan-500/15 p-12 text-center backdrop-blur-xl">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 border border-primary/30 mb-6">
                <PiggyBank className="h-8 w-8 text-cyan-300" />
              </div>
              <h2 className="text-4xl font-bold tracking-normal">
                Pronto para trocar a planilha por{' '}
                <span className="hero-gradient-text">um painel vivo?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
                Comece com seus registros principais e deixe o app organizar a visão do mês para você. Menos de 2 minutos.
              </p>
              <Button size="lg" asChild className="mt-8 rounded-lg h-12 px-8 text-base">
                <Link href="/login">
                  Criar minha conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-6 text-sm text-slate-400">Sem cartão de crédito. Sem compromisso.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-12 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <p className="font-semibold text-slate-100 mb-2">Xô Planilhas</p>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()}. Controle financeiro sem complicação.</p>
          </div>
          <div className="flex gap-8">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-emerald-300 transition">Termos</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-emerald-300 transition">Privacidade</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-emerald-300 transition">LGPD</Link>
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
