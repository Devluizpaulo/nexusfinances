'use client';

import { notFound, useParams } from 'next/navigation';
import { educationTracks } from '@/lib/education-data';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertCircle, Target, BookCopy, Zap, HelpCircle, Check, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function EducationTrackPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  const track = educationTracks.find((t) => t.slug === slug);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);

  if (!track) {
    notFound();
  }

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowQuizResult(true);

    const correctAnswers = track.content.finalQuiz.questions.filter(
      (q, index) => quizAnswers[index] === q.correctAnswer
    ).length;
    const totalQuestions = track.content.finalQuiz.questions.length;

    toast({
        title: "Resultado do Quiz",
        description: `Você acertou ${correctAnswers} de ${totalQuestions} perguntas!`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader title={track.title}>
        <Button asChild variant="outline">
           <Link href="/education">Voltar para a Jornada</Link>
        </Button>
      </PageHeader>
      
      <div className="prose prose-sm sm:prose-base max-w-none text-foreground dark:prose-invert prose-headings:text-foreground">
        <p className="lead !text-lg !text-muted-foreground">{track.content.introduction}</p>
      </div>

      {/* Módulo 1: Diagnóstico */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Módulo 1: Diagnóstico Rápido
              </CardTitle>
              <CardDescription>Responda para entender sua situação atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {track.content.diagnostic.questions.map((q, index) => (
                  <div key={index} className="flex items-start space-x-3 rounded-md border p-4">
                     <Checkbox id={`diag-${index}`} className="mt-1" />
                     <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`diag-${index}`} className="text-sm font-medium">
                           {q}
                        </Label>
                    </div>
                  </div>
              ))}
          </CardContent>
      </Card>
      
      {/* Módulo 2: O Conceito */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Módulo 2: O Conceito-Chave
              </CardTitle>
              <CardDescription>Uma forma simples de entender o problema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
              <h3 className="font-semibold">{track.content.metaphor.title}</h3>
              <p className="text-sm text-muted-foreground">{track.content.metaphor.description}</p>
          </CardContent>
      </Card>
      
      {/* Módulo 3: Plano de Ação */}
      <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Módulo 3: Plano de Ação (Checklist)
                </CardTitle>
                <CardDescription>Marque cada passo concluído e sinta o progresso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {track.content.actionSteps.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 rounded-md border p-4">
                         <Checkbox id={`step-${index}`} className="mt-1" />
                         <div className="grid gap-1.5 leading-none">
                            <Label htmlFor={`step-${index}`} className="text-sm font-semibold">
                               {step.title}
                            </Label>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
        
      {/* Módulo 4: Exemplos Práticos */}
      <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookCopy className="h-5 w-5 text-emerald-600" />
                    Módulo 4: Exemplos Práticos
                </CardTitle>
                <CardDescription>Veja como isso se aplica na vida real.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {track.content.examples.map((example, index) => (
                     <div key={index} className="p-4 rounded-md bg-muted/50 border">
                        <p className="font-semibold text-sm">{example.scenario}</p>
                        <p className="text-sm text-muted-foreground mt-1">{example.consequence}</p>
                     </div>
                 ))}
            </CardContent>
        </Card>

       {/* Módulo 5: Ferramenta */}
       {track.tool && (
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-sky-500" />
                    Módulo 5: Ferramenta na Prática
                </CardTitle>
                 <CardDescription>Use esta ferramenta para tomar decisões melhores.</CardDescription>
            </CardHeader>
            <CardContent>
                <track.tool />
            </CardContent>
        </Card>
       )}
       
       {/* Módulo 6: Quiz Final */}
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Módulo 6: Teste seu Conhecimento
                </CardTitle>
                 <CardDescription>Valide o que você aprendeu e ganhe pontos.</CardDescription>
            </CardHeader>
             <form onSubmit={handleQuizSubmit}>
                <CardContent className="space-y-6">
                    {track.content.finalQuiz.questions.map((q, qIndex) => (
                        <div key={qIndex}>
                            <p className="font-medium text-sm mb-2">{qIndex + 1}. {q.question}</p>
                            <RadioGroup
                                onValueChange={(value) => setQuizAnswers(prev => ({ ...prev, [qIndex]: value }))}
                                value={quizAnswers[qIndex]}
                                disabled={showQuizResult}
                            >
                                {q.options.map((opt, oIndex) => (
                                    <div 
                                        key={oIndex} 
                                        className={cn(
                                            "flex items-center space-x-2 rounded-md border p-3",
                                            showQuizResult && (q.correctAnswer === opt ? 'border-green-400 bg-green-50' : (quizAnswers[qIndex] === opt ? 'border-red-400 bg-red-50' : ''))
                                        )}
                                    >
                                        <RadioGroupItem value={opt} id={`q${qIndex}-o${oIndex}`} />
                                        <Label htmlFor={`q${qIndex}-o${oIndex}`} className="font-normal">{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={showQuizResult || Object.keys(quizAnswers).length !== track.content.finalQuiz.questions.length}>
                        Verificar Respostas
                    </Button>
                </CardFooter>
             </form>
        </Card>
    </div>
  );
}
