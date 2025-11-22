'use client';

import { notFound, useParams } from 'next/navigation';
import { educationTracks } from '@/lib/education-data';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Target, BookCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EducationTrackPage() {
  const params = useParams();
  const slug = params.slug as string;

  const track = educationTracks.find((t) => t.slug === slug);

  if (!track) {
    notFound();
  }

  const ToolComponent = track.content.tool;

  return (
    <div className="space-y-8">
      <PageHeader title={track.title}>
        <Button asChild variant="outline">
           <Link href="/education">Voltar para a Jornada</Link>
        </Button>
      </PageHeader>
      
      <div className="prose prose-sm sm:prose-base max-w-none text-foreground dark:prose-invert prose-h3:font-semibold prose-h3:tracking-tight prose-headings:text-foreground">
        <p className="lead !text-lg !text-muted-foreground">{track.content.introduction}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Metáfora: {track.content.metaphor.title}
                </CardTitle>
                <CardDescription>Uma forma simples de entender o problema.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{track.content.metaphor.description}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Plano de Ação
                </CardTitle>
                <CardDescription>Passos práticos para você começar agora.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {track.content.actionSteps.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {index + 1}
                            </span>
                            <span className="flex-1">{step.title}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookCopy className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Detalhes do Plano de Ação</h2>
                <p className="text-sm text-muted-foreground">
                Entenda o porquê de cada passo e como executá-lo.
                </p>
            </div>
        </div>
        <div className="space-y-6 rounded-lg border p-6">
            {track.content.actionSteps.steps.map((step, index) => (
                <div key={index}>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
            ))}
        </div>
      </div>
      
       {ToolComponent && (
        <div className="pt-4">
            <ToolComponent />
        </div>
       )}

    </div>
  );
}
