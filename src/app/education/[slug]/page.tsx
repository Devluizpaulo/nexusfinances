
'use client';

import { notFound, useParams } from 'next/navigation';
import { educationTracks } from '@/lib/education-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HelpCircle, Target, BookCopy, Zap, Check, Lightbulb, Brain, HandHeart, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React, { useState, useEffect } from 'react';
import { doc, arrayUnion } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)|(\*.*?\*)/g);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function EducationTrackPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [modalContent, setModalContent] = useState<{ title: string; details: string; } | null>(null);

  const track = educationTracks.find((t) => t.slug === slug);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  
  const isCompleted = user?.completedTracks?.includes(slug) || false;

  useEffect(() => {
    if (isCompleted) {
        setShowQuizResult(true);
    }
  }, [isCompleted]);

  if (!track) {
    notFound();
  }

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para salvar seu progresso.'});
        return;
    }

    setShowQuizResult(true);

    const correctAnswers = track.content.finalQuiz.questions.filter(
      (q, index) => quizAnswers[index] === q.correctAnswer
    ).length;
    const totalQuestions = track.content.finalQuiz.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    toast({
        title: "Resultado do Quiz",
        description: `Você acertou ${correctAnswers} de ${totalQuestions} perguntas!`,
    });

    if (score > 50 && !isCompleted) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            updateDocumentNonBlocking(userDocRef, {
                completedTracks: arrayUnion(slug)
            });
            toast({
                title: "Trilha Concluída!",
                description: `Parabéns! Você concluiu a trilha "${track.title}".`,
                className: "bg-emerald-100 border-emerald-300 text-emerald-800"
            });
        } catch (error) {
            console.error("Error updating user progress:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar seu progresso. Tente novamente.'});
        }
    }
  };

  return (
    <>
      <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{modalContent?.title}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                {parseMarkdown(modalContent?.details || '')}
            </div>
        </DialogContent>
      </Dialog>


      <div className="space-y-8">
        <PageHeader title={track.title}>
          <Button asChild variant="outline">
            <Link href="/education">Voltar para a Jornada</Link>
          </Button>
        </PageHeader>
        
        <div className="prose prose-sm sm:prose-base max-w-none text-foreground dark:prose-invert prose-headings:text-foreground">
          <p className="lead !text-lg !text-muted-foreground">{track.content.introduction}</p>
        </div>

        {/* Módulo 1: Psicologia */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Módulo 1: {track.content.psychology.title}
                </CardTitle>
                <CardDescription>Entenda os "porquês" por trás das suas ações financeiras.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {track.content.psychology.points.map((point, index) => (
                    <button 
                        key={index}
                        onClick={() => setModalContent(point)}
                        className="flex w-full cursor-pointer items-start gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-1" />
                      <span>{parseMarkdown(point.title)}</span>
                    </button>
                ))}
            </CardContent>
        </Card>
        
        {/* Módulo 2: Experiências Práticas */}
        <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <HandHeart className="h-5 w-5 text-emerald-600" />
                      Módulo 2: {track.content.practicalExperiences.title}
                  </CardTitle>
                  <CardDescription>Exercícios para conectar o aprendizado à sua vida real.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  {track.content.practicalExperiences.experiences.map((exp, index) => (
                      <button 
                          key={index}
                          onClick={() => setModalContent(exp)}
                          className="w-full cursor-pointer rounded-md border bg-muted/50 p-4 text-left transition-colors hover:bg-muted"
                        >
                          <p className="font-semibold text-sm">{exp.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                      </button>
                  ))}
              </CardContent>
          </Card>
        
        {/* Módulo 3: Micro-hábitos */}
        <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-sky-500" />
                      Módulo 3: {track.content.microHabits.title}
                  </CardTitle>
                  <CardDescription>Pequenas ações diárias para construir grandes mudanças.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                  {track.content.microHabits.habits.map((habit, index) => (
                      <div key={index} className="flex items-start space-x-3 rounded-md border p-4">
                          <Checkbox id={`habit-${index}`} className="mt-1" />
                          <div className="grid gap-1.5 leading-none">
                              <Label htmlFor={`habit-${index}`} className="text-sm font-medium">
                                {parseMarkdown(habit)}
                              </Label>
                          </div>
                      </div>
                  ))}
              </CardContent>
          </Card>
          
        {/* Módulo 4: Narrativa */}
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mountain className="h-5 w-5 text-primary" />
                    Módulo 4: {track.content.narrative.title}
                </CardTitle>
                <CardDescription>Uma metáfora para guiar sua jornada.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">{track.content.narrative.description}</p>
            </CardContent>
        </Card>

        {/* Módulo 5: Ferramenta (Opcional) */}
        {track.content.tool && (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-sky-500" />
                      Módulo 5: Ferramenta na Prática
                  </CardTitle>
                  <CardDescription>Use esta ferramenta para tomar decisões melhores.</CardDescription>
              </CardHeader>
              <CardContent>
                  <track.content.tool />
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
                                              "flex items-center space-x-2 rounded-md border p-3 transition-colors",
                                              showQuizResult && (q.correctAnswer === opt ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : (quizAnswers[qIndex] === opt ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''))
                                          )}
                                      >
                                          <RadioGroupItem value={opt} id={`q${qIndex}-o${oIndex}`} />
                                          <Label htmlFor={`q${qIndex}-o${oIndex}`} className="font-normal cursor-pointer">{opt}</Label>
                                      </div>
                                  ))}
                              </RadioGroup>
                          </div>
                      ))}
                  </CardContent>
                  <CardFooter>
                      <Button type="submit" disabled={isCompleted || showQuizResult || Object.keys(quizAnswers).length !== track.content.finalQuiz.questions.length}>
                          {isCompleted ? 'Trilha Concluída' : 'Verificar Respostas'}
                      </Button>
                  </CardFooter>
              </form>
          </Card>
      </div>
    </>
  );
}
