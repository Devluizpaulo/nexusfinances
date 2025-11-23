
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, DollarSign, Quote, BarChart3, Target, Wallet, Loader2, Sparkles, TrendingUp, ShieldCheck, Smartphone, CreditCard, PieChart, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import AdBanner from '@/components/ads/AdBanner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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


  // Efeito de gradiente animado
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      {/* Efeito de partículas no fundo */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm px-4 py-3 md:px-6 transition-all duration-300 hover:shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg group-hover:shadow-primary/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DollarSign className="h-5 w-5" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Xô Planilhas
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="font-medium hover:bg-primary/10 hover:text-primary"
              onClick={() => redirect('/login')}
            >
              Entrar
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/20 transition-all duration-300"
              onClick={() => redirect('/login')}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Ad container for verification */}
        <div style={{ display: 'none' }}>
            <AdBanner />
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-background pt-16 pb-24 md:pt-24 md:pb-32">
          {/* Elementos decorativos */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          
          <div className="container relative mx-auto grid grid-cols-1 items-center gap-12 px-4 md:grid-cols-2">
            <motion.div 
              className="relative z-10 text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                Transforme sua vida financeira
              </div>
              <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl lg:text-6xl">
                Controle financeiro <span className="text-primary">simples</span> e poderoso
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:mx-0">
                Diga adeus às planilhas e assuma o controle da sua vida financeira com uma ferramenta intuitiva, visual e feita para você.
              </p>
              
              <div className="mt-8 flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 md:justify-start">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleStart(); }} 
                  className="flex w-full max-w-md flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0"
                >
                  <div className="relative flex-1">
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="h-14 w-full rounded-xl border-2 border-primary/20 bg-background/50 px-5 text-base backdrop-blur-sm transition-all duration-300 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          type="submit"
                          size="lg"
                          className="h-10 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 font-medium text-white shadow-lg transition-all duration-300 hover:from-primary/90 hover:to-primary/70 hover:shadow-primary/20"
                        >
                          Começar Agora
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </form>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground">
                Cadastro rápido. Sem cartão de crédito. Cancele quando quiser.
              </p>
              
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-muted">
                      <div className="h-full w-full bg-muted-foreground/20" />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">+5.000</span> pessoas já estão no controle
                </div>
              </div>
            </motion.div>
            
            {heroImage && (
              <motion.div 
                className="relative h-80 w-full md:h-[32rem]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="absolute -right-4 -top-4 h-full w-full rounded-2xl bg-primary/10" />
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-2xl backdrop-blur-sm">
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover object-top"
                    data-ai-hint={heroImage.imageHint}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                </div>
                
                {/* Elementos flutuantes decorativos */}
                <motion.div 
                  className="absolute -left-4 top-1/2 hidden h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm md:flex"
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <TrendingUp className="h-8 w-8 text-primary" />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-4 right-8 hidden h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 backdrop-blur-sm md:flex"
                  animate={{
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.5
                  }}
                >
                  <ShieldCheck className="h-6 w-6 text-secondary" />
                </motion.div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative overflow-hidden py-20 md:py-28">
          {/* Elementos decorativos */}
          <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-20 bottom-1/4 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
          
          <div className="container relative mx-auto px-4">
            <motion.div 
              className="mx-auto max-w-4xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                Recursos Poderosos
              </span>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Tudo o que você precisa para o <span className="text-primary">controle financeiro</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Uma experiência completa para gerenciar seu dinheiro de forma simples e eficiente.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-16">
              {/* Feature 1 */}
              {feature1Image && (
                <motion.div 
                  className="grid grid-cols-1 items-center gap-12 md:grid-cols-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-xl backdrop-blur-sm">
                    <div className="absolute -right-4 -top-4 h-full w-full rounded-2xl bg-primary/5" />
                    <Image 
                      src={feature1Image.imageUrl} 
                      alt={feature1Image.description} 
                      fill 
                      className="object-cover object-top"
                      data-ai-hint={feature1Image.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  </div>
                  <div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold">Visão Clara e Intuitiva</h3>
                    <p className="mt-3 text-muted-foreground">
                      Com dashboards e gráficos intuitivos, você entende para onde seu dinheiro está indo em segundos. Visualize seus gastos por categoria, acompanhe receitas e despesas, e tome decisões mais inteligentes.
                    </p>
                    <ul className="mt-4 space-y-2">
                      {['Gráficos interativos', 'Visão mensal e anual', 'Análise de categorias', 'Relatórios detalhados'].map((item, i) => (
                        <li key={i} className="flex items-center text-muted-foreground">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Feature 2 */}
              {feature2Image && (
                <motion.div 
                  className="grid grid-cols-1 items-center gap-12 md:grid-cols-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="md:order-2 relative h-80 w-full overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-xl backdrop-blur-sm">
                    <div className="absolute -left-4 -top-4 h-full w-full rounded-2xl bg-secondary/5" />
                    <Image 
                      src={feature2Image.imageUrl} 
                      alt={feature2Image.description} 
                      fill 
                      className="object-cover object-top"
                      data-ai-hint={feature2Image.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  </div>
                  <div className="md:order-1">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold">Controle Total das Suas Finanças</h3>
                    <p className="mt-3 text-muted-foreground">
                      Registre rendas, despesas e dívidas em um só lugar. Organize tudo com categorias personalizadas e veja seu balanço em tempo real, com notificações para contas a pagar e receber.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <h4 className="mt-2 font-semibold">Contas Bancárias</h4>
                        <p className="mt-1 text-sm text-muted-foreground">Gerencie todas as suas contas em um só lugar</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
                        <Smartphone className="h-6 w-6 text-primary" />
                        <h4 className="mt-2 font-semibold">App Móvel</h4>
                        <p className="mt-1 text-sm text-muted-foreground">Acesse de qualquer lugar, a qualquer hora</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Feature 3 */}
              {feature3Image && (
                <motion.div 
                  className="grid grid-cols-1 items-center gap-12 md:grid-cols-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-border/50 bg-background/50 shadow-xl backdrop-blur-sm">
                    <div className="absolute -right-4 -top-4 h-full w-full rounded-2xl bg-primary/5" />
                    <Image 
                      src={feature3Image.imageUrl} 
                      alt={feature3Image.description} 
                      fill 
                      className="object-cover object-top"
                      data-ai-hint={feature3Image.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  </div>
                  <div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Target className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold">Metas Financeiras Inteligentes</h3>
                    <p className="mt-3 text-muted-foreground">
                      Crie objetivos de economia e investimento, acompanhe o progresso e veja suas metas se tornarem realidade mais rápido. Receba dicas personalizadas para alcançar seus objetivos.
                    </p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Economia Mensal</span>
                          <span className="text-muted-foreground">R$ 1.200 / R$ 2.000</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary/20">
                          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-primary/70" />
                        </div>
                        <p className="mt-1 text-right text-xs text-muted-foreground">60% concluído</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Fundo de Emergência</span>
                          <span className="text-muted-foreground">R$ 8.500 / R$ 15.000</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary/20">
                          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-primary to-primary/70" />
                        </div>
                        <p className="mt-1 text-right text-xs text-muted-foreground">40% concluído</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Destaques */}
            <motion.div 
              className="mt-24 grid gap-6 md:grid-cols-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Segurança em Primeiro Lugar</h3>
                <p className="mt-2 text-muted-foreground">Seus dados estão protegidos com criptografia de ponta a ponta.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PieChart className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Relatórios Detalhados</h3>
                <p className="mt-2 text-muted-foreground">Gere relatórios completos para análise detalhada das suas finanças.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Economia Inteligente</h3>
                <p className="mt-2 text-muted-foreground">Receba dicas personalizadas para economizar mais e melhor.</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="relative overflow-hidden py-20 md:py-28">
          {/* Elementos decorativos */}
          <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
          
          <div className="container relative mx-auto px-4">
            <motion.div 
              className="mx-auto max-w-4xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                Depoimentos
              </span>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Amado por quem trocou as <span className="text-primary">planilhas</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Veja o que nossos usuários estão dizendo sobre como o Xô Planilhas transformou suas vidas financeiras.
              </p>
            </motion.div>

            <motion.div 
              className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10" />
                <CardContent className="relative pt-8">
                  <Quote className="absolute -top-5 left-6 h-10 w-10 text-primary/10 transition-all group-hover:text-primary/20" />
                  <p className="relative text-muted-foreground">
                    Finalmente um app que não me faz sentir burro. Em 15 minutos eu já tinha cadastrado tudo e entendi para onde estava indo meu dinheiro. Economizei 30% no primeiro mês!
                  </p>
                  <div className="mt-6 flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                      <span className="text-lg font-medium">JS</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">João Silva</p>
                      <p className="text-sm text-muted-foreground">Freelancer • Usuário desde 2023</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10" />
                <CardContent className="relative pt-8">
                  <Quote className="absolute -top-5 left-6 h-10 w-10 text-primary/10 transition-all group-hover:text-primary/20" />
                  <p className="relative text-muted-foreground">
                    O calendário de vencimentos salvou meu mês. Eu sempre esquecia de pagar alguma conta. Agora, está tudo lá, bem visual. Nunca mais paguei multa por atraso!
                  </p>
                  <div className="mt-6 flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                      <span className="text-lg font-medium">MC</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Mariana Costa</p>
                      <p className="text-sm text-muted-foreground">Analista de Marketing • Usuária desde 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg md:col-span-2 lg:col-span-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10" />
                <CardContent className="relative pt-8">
                  <Quote className="absolute -top-5 left-6 h-10 w-10 text-primary/10 transition-all group-hover:text-primary/20" />
                  <p className="relative text-muted-foreground">
                    Eu e meu marido usamos para planejar nossas finanças juntos. A simplicidade para ver o progresso das nossas metas é incrível. Já conseguimos economizar para nossa viagem dos sonhos!
                  </p>
                  <div className="mt-6 flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                      <span className="text-lg font-medium">CP</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Carla Pereira</p>
                      <p className="text-sm text-muted-foreground">Empreendedora • Usuária desde 2023</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Estatísticas */}
            <motion.div 
              className="mt-20 grid grid-cols-2 gap-8 rounded-2xl border border-border/50 bg-background/50 p-8 backdrop-blur-sm md:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-primary md:text-5xl">+5.000</div>
                <p className="mt-2 text-sm text-muted-foreground">Usuários ativos</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary md:text-5xl">R$ 8,2M+</div>
                <p className="mt-2 text-sm text-muted-foreground">Economizados</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary md:text-5xl">4.9/5</div>
                <p className="mt-2 text-sm text-muted-foreground">Avaliação média</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary md:text-5xl">24/7</div>
                <p className="mt-2 text-sm text-muted-foreground">Suporte ativo</p>
              </div>
            </motion.div>
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
