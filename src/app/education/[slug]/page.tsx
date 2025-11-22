
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { educationTracks } from '@/lib/education-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Lightbulb, Brain, HandHeart, Mountain, Target, Zap, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { doc, arrayUnion } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import type { EducationTrack } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Helper Functions
function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  
  return paragraphs.map((paragraph, pIndex) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;

    const nodes = paragraph.split(boldRegex).map((part, index) => {
      if (index % 2 !== 0) { // It's a bold part
        return <strong key={`bold-${pIndex}-${index}`}>{part}</strong>;
      }
      
      const parts = part.split(italicRegex).map((subPart, subIndex) => {
        if (subIndex % 2 !== 0) { // It's an italic part
          return <em key={`italic-${pIndex}-${index}-${subIndex}`}>{subPart}</em>;
        }
        return subPart;
      });
      return <React.Fragment key={`part-${pIndex}-${index}`}>{parts}</React.Fragment>;
    });

    return <p key={`p-${pIndex}`} className="mb-4 last:mb-0">{nodes}</p>;
  });
}


// Sub-components for each module
const PsychologyModule = ({ content, onPointClick, readItems }: { content: any, onPointClick: (point: any) => void, readItems: Set<string> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        Módulo 1: {content.title}
      </CardTitle>
      <CardDescription>Entenda os "porquês" por trás das suas ações financeiras.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {content.points.map((point: any, index: number) => (
        <button
          key={index}
          onClick={() => onPointClick(point)}
          className="flex w-full cursor-pointer items-start gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
        >
          <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-1" />
          <span className="flex-1">{parseMarkdown(point.title)}</span>
          {readItems.has(point.title) && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1" />}
        </button>
      ))}
    </CardContent>
  </Card>
);

const PracticalExperiencesModule = ({ content, onExperienceClick, readItems }: { content: any, onExperienceClick: (exp: any) => void, readItems: Set<string> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <HandHeart className="h-5 w-5 text-emerald-600" />
        Módulo 2: {content.title}
      </CardTitle>
      <CardDescription>Exercícios para conectar o aprendizado à sua vida real.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {content.experiences.map((exp: any, index: number) => (
        <button
          key={index}
          onClick={() => onExperienceClick(exp)}
          className="w-full cursor-pointer rounded-md border bg-muted/50 p-4 text-left transition-colors hover:bg-muted flex items-start justify-between"
        >
          <div className="flex-1">
            <p className="font-semibold text-sm">{exp.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
          </div>
           {readItems.has(exp.title) && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 ml-4 shrink-0" />}
        </button>
      ))}
    </CardContent>
  </Card>
);

const MicroHabitsModule = ({ content }: { content: any }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5 text-sky-500" />
        Módulo 3: {content.title}
      </CardTitle>
      <CardDescription>Pequenas ações diárias para construir grandes mudanças.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {content.habits.map((habit: string, index: number) => (
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
);

const NarrativeModule = ({ content }: { content: any }) => (
  <Card className="bg-primary/5 border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Mountain className="h-5 w-5 text-primary" />
        Módulo 4: {content.title}
      </CardTitle>
      <CardDescription>Uma metáfora para guiar sua jornada.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
        {parseMarkdown(content.description)}
      </div>
    </CardContent>
  </Card>
);

const ToolModule = ({ module }: { module: any }) => {
  if (!module.component) return null;
  const ToolComponent = module.component;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-sky-500" />
          Módulo 5: {module.title}
        </CardTitle>
        <CardDescription>Use esta ferramenta para tomar decisões melhores.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToolComponent />
      </CardContent>
    </Card>
  );
};

const FinalQuizModule = ({ module, track, user, onQuizComplete }: { module: any, track: EducationTrack, user: any, onQuizComplete: () => void }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const isCompleted = user?.completedTracks?.includes(track.slug) || false;

  useEffect(() => {
    if (isCompleted) {
      setShowQuizResult(true);
    }
  }, [isCompleted]);

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para salvar seu progresso.' });
      return;
    }

    setShowQuizResult(true);

    const correctAnswers = module.questions.filter(
      (q: any, index: number) => quizAnswers[index] === q.correctAnswer
    ).length;
    const totalQuestions = module.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    toast({
      title: "Resultado do Quiz",
      description: `Você acertou ${correctAnswers} de ${totalQuestions} perguntas!`,
    });

    if (score > 50 && !isCompleted) {
      const userDocRef = doc(firestore, 'users', user.uid);
      try {
        updateDocumentNonBlocking(userDocRef, {
          completedTracks: arrayUnion(track.slug)
        });
        toast({
          title: "Trilha Concluída!",
          description: `Parabéns! Você concluiu a trilha "${track.title}".`,
          className: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-800/50 dark:border-emerald-700 dark:text-emerald-200"
        });
        onQuizComplete();
      } catch (error) {
        console.error("Error updating user progress:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar seu progresso. Tente novamente.' });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          Módulo {module.questions ? '6' : 'Final'}: {module.title}
        </CardTitle>
        <CardDescription>Valide o que você aprendeu e ganhe pontos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleQuizSubmit}>
        <CardContent className="space-y-6">
          {module.questions.map((q: any, qIndex: number) => (
            <div key={qIndex}>
              <p className="font-medium text-sm mb-2">{qIndex + 1}. {q.question}</p>
              <RadioGroup
                onValueChange={(value) => setQuizAnswers(prev => ({ ...prev, [qIndex]: value }))}
                value={quizAnswers[qIndex]}
                disabled={showQuizResult}
              >
                {q.options.map((opt: string, oIndex: number) => {
                   const isCorrect = q.correctAnswer === opt;
                   const isSelected = quizAnswers[qIndex] === opt;
                   
                   return (
                     <div
                      key={oIndex}
                      className={cn(
                        "flex items-center space-x-2 rounded-md border p-3 transition-colors",
                         showQuizResult && isCorrect && "border-green-400 bg-green-50 dark:bg-green-900/20",
                         showQuizResult && !isCorrect && isSelected && "border-red-400 bg-red-50 dark:bg-red-900/20"
                      )}
                    >
                      <RadioGroupItem value={opt} id={`q${qIndex}-o${oIndex}`} />
                      <Label htmlFor={`q${qIndex}-o${oIndex}`} className="font-normal cursor-pointer flex-1">{opt}</Label>
                      {showQuizResult && isCorrect && <Check className="h-5 w-5 text-green-500" />}
                    </div>
                   );
                })}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isCompleted || showQuizResult || Object.keys(quizAnswers).length !== module.questions.length}>
            {isCompleted ? 'Trilha Concluída' : 'Verificar Respostas'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};


// Main Page Component
export default function EducationTrackPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useUser();
  const [modalContent, setModalContent] = useState<{ title: string; details: string; } | null>(null);
  const [readItems, setReadItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('0');
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());

  const track = educationTracks.find((t) => t.slug === slug);

  if (!track) {
    notFound();
  }

  const handleMarkAsRead = () => {
    if (modalContent) {
      setReadItems(prev => new Set(prev).add(modalContent.title));
      setModalContent(null);
    }
  };

  const handleNext = () => {
    setCompletedModules(prev => new Set(prev).add(parseInt(activeTab, 10)));
    const nextTabIndex = parseInt(activeTab, 10) + 1;
    if (nextTabIndex < track.content.modules.length) {
      setActiveTab(String(nextTabIndex));
    }
  };

  const handlePrevious = () => {
    const prevTabIndex = parseInt(activeTab, 10) - 1;
    if (prevTabIndex >= 0) {
      setActiveTab(String(prevTabIndex));
    }
  };

  const isFinalQuizCompleted = user?.completedTracks?.includes(track.slug) || false;
  if(isFinalQuizCompleted && !completedModules.has(track.content.modules.length - 1)) {
    const allModules = new Set(track.content.modules.map((_, i) => i));
    setCompletedModules(allModules);
  }

  const Icon = track.icon;

  const renderModule = (module: any, index: number) => {
    switch (module.type) {
      case 'psychology':
        return <PsychologyModule key={index} content={module} onPointClick={setModalContent} readItems={readItems} />;
      case 'practicalExperiences':
        return <PracticalExperiencesModule key={index} content={module} onExperienceClick={setModalContent} readItems={readItems} />;
      case 'microHabits':
        return <MicroHabitsModule key={index} content={module} />;
      case 'narrative':
        return <NarrativeModule key={index} content={module} />;
      case 'tool':
        return <ToolModule key={index} module={module} />;
      case 'finalQuiz':
        return <FinalQuizModule key={index} module={module} track={track} user={user} onQuizComplete={handleNext}/>;
      default:
        return null;
    }
  };

  const currentModuleIndex = parseInt(activeTab, 10);
  const isLastModule = currentModuleIndex === track.content.modules.length - 1;

  return (
    <>
      <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start gap-4 mb-4">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", track.bgColor)}>
                    <Icon className={cn("h-7 w-7", track.color)} />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl leading-snug">{modalContent?.title ? parseMarkdown(modalContent.title) : ''}</DialogTitle>
                </div>
            </div>
            <Separator />
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert py-4">
            {parseMarkdown(modalContent?.details || '')}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleMarkAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Marcar como Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <PageHeader title={track.title}>
          <Button asChild variant="outline">
            <Link href="/education">Voltar para a Jornada</Link>
          </Button>
        </PageHeader>

        <div className="prose prose-sm sm:prose-base max-w-none text-foreground dark:prose-invert prose-headings:text-foreground">
          <div className="lead !text-lg !text-muted-foreground">{parseMarkdown(track.content.introduction)}</div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
             {track.content.modules.map((module, index) => (
                <TabsTrigger
                  key={index}
                  value={String(index)}
                  disabled={index > completedModules.size && index !== 0 && !isFinalQuizCompleted}
                  className="flex gap-2"
                >
                  {completedModules.has(index) && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  <span>Módulo {index + 1}</span>
                </TabsTrigger>
             ))}
          </TabsList>
          {track.content.modules.map((module, index) => (
            <TabsContent key={index} value={String(index)} className="mt-6">
                {renderModule(module, index)}
                <div className="mt-6 flex justify-between">
                    <Button onClick={handlePrevious} disabled={currentModuleIndex === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                     {currentModuleIndex < track.content.modules.length -1 && module.type !== 'finalQuiz' && (
                        <Button onClick={handleNext}>
                            Próximo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}

    