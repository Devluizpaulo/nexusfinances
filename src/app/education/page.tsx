'use client';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Banknote,
  BookOpen,
  ChevronRight,
  HeartHandshake,
  Landmark,
  PiggyBank,
  Receipt,
  Sparkles,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

const healthLevels = [
  { level: 'Desorganizado', color: 'bg-red-500' },
  { level: 'Razoável', color: 'bg-orange-500' },
  { level: 'Estável', color: 'bg-yellow-500' },
  { level: 'Forte', color: 'bg-sky-500' },
  { level: 'Saudável', color: 'bg-emerald-500' },
];

const debtTracks = [
  {
    title: 'Dívidas com Amigos e Família',
    description: 'Como lidar com empréstimos informais, preservar relações e criar acordos claros.',
    icon: HeartHandshake,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    href: '#',
  },
  {
    title: 'Cartão de Crédito: A Bola de Neve',
    description: 'Entenda os juros rotativos, o efeito bola de neve e como sair do ciclo vicioso.',
    icon: Banknote,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    href: '#',
  },
  {
    title: 'Financiamentos (Carro, Casa)',
    description: 'Aprenda sobre amortização, como antecipar parcelas e reduzir o custo total.',
    icon: Landmark,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    href: '#',
  },
  {
    title: 'Dívidas Bancárias (Cheque Especial)',
    description: 'Estratégias para negociar com o banco, sair do cheque especial e evitar taxas abusivas.',
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    href: '#',
  },
  {
    title: 'Contas do Dia a Dia',
    description: 'Técnicas para organizar e priorizar contas de consumo (água, luz) e evitar cortes.',
    icon: Receipt,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    href: '#',
  },
];

export default function EducationPage() {
  const currentLevelIndex = 2; // Exemplo: 'Estável'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jornada da Saúde Financeira"
        description="Aprenda a lidar com suas finanças de forma leve, intuitiva e conquiste a tranquilidade."
      />

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <CardTitle>Sua Jornada de Evolução</CardTitle>
              <CardDescription>
                A saúde financeira é um caminho. Veja seu progresso e o que falta para o próximo nível.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Seu nível atual</span>
            <Badge variant="secondary" className={cn('font-semibold', healthLevels[currentLevelIndex].color, 'text-white')}>
              {healthLevels[currentLevelIndex].level}
            </Badge>
          </div>
          <Progress value={(currentLevelIndex + 1) * 20} className="mt-3 h-3" />
          <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
            {healthLevels.map((item, index) => (
              <div key={item.level} className={cn(index <= currentLevelIndex ? 'font-semibold text-primary' : '')}>
                {item.level}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Trilhas de Conhecimento</h2>
            <p className="text-sm text-muted-foreground">
              Aprenda a lidar com cada tipo de dívida de forma prática e direcionada.
            </p>
          </div>
        </div>
        <Separator />
        <Carousel
          opts={{
            align: 'start',
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {debtTracks.map((track) => (
              <CarouselItem key={track.title} className="basis-full md:basis-1/2 lg:basis-1/3 pl-4">
                <Link href={track.href} className="group block h-full">
                  <Card
                    className={cn(
                      'flex h-full flex-col overflow-hidden border-2 transition-all group-hover:border-primary/80 group-hover:shadow-lg',
                      track.borderColor,
                    )}
                  >
                    <CardHeader
                      className={cn(
                        'flex flex-row items-center justify-between space-y-0',
                        track.bgColor,
                      )}
                    >
                      <CardTitle className="text-base font-bold">{track.title}</CardTitle>
                      <track.icon className={cn('h-6 w-6 shrink-0', track.color)} />
                    </CardHeader>
                    <CardContent className="flex-grow pt-4">
                      <p className="text-sm text-muted-foreground">{track.description}</p>
                    </CardContent>
                    <CardContent className="pt-2">
                       <div className="flex items-center justify-end text-xs font-semibold text-primary group-hover:underline">
                        Começar trilha
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4" />
          <CarouselNext className="-right-4" />
        </Carousel>
      </div>

       <Card className="border-accent bg-accent/20">
        <CardHeader>
           <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <CardTitle>Em Breve: Ferramentas e Missões</CardTitle>
            </div>
          <CardDescription>
            Estamos construindo ferramentas práticas para acelerar sua jornada.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="prose prose-sm max-w-full text-foreground/80">
                <ul>
                    <li><strong>Simulador de Quitação:</strong> Veja o impacto de antecipar parcelas.</li>
                    <li><strong>Calculadora de Juros:</strong> Entenda o custo real de uma dívida.</li>
                    <li><strong>Scripts de Negociação:</strong> Modelos prontos para conversar com credores.</li>
                    <li><strong>Missões Diárias:</strong> Pequenas vitórias para criar grandes hábitos.</li>
                </ul>
                <p>O objetivo é transformar conhecimento em ação e resultado real no seu bolso.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
