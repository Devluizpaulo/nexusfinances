
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { EducationTrack, EducationModule as EducationModuleType } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InterestCalculator } from '@/components/education/InterestCalculator';
import { PayoffSimulator } from '@/components/education/PayoffSimulator';

const dynamicComponents: Record<string, React.ComponentType<any>> = {
  InterestCalculator,
  PayoffSimulator,
};

// Helper Functions
function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  
  return paragraphs.map((paragraph, pIndex) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex for bold and italic
    const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;
    let match;

    while ((match = regex.exec(paragraph)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(paragraph.substring(lastIndex, match.index));
      }

      // Handle bold
      if (match[1]) {
        parts.push(<strong key={`bold-${pIndex}-${match.index}`}>{match[2]}</strong>);
      }
      // Handle italic
      else if (match[3]) {
        parts.push(<em key={`italic-${pIndex}-${match.index}`}>{match[4]}</em>);
      }
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < paragraph.length) {
      parts.push(paragraph.substring(lastIndex));
    }
    
    return <p key={`p-${pIndex}`} className="mb-4 last:mb-0">{parts}</p>;
  });
}


// Sub-components for each module
const PsychologyModule = ({ content, onPointClick, readItems }: { content: any, onPointClick: (point: any) => void, readItems: Set<string> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LucideIcons.Brain className="h-5 w-5 text-primary" />
        {content.title}
      </CardTitle>
      <CardDescription>{content.subtitle}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {content.points.map((point: any, index: number) => (
        <button
          key={index}
          onClick={() => onPointClick(point)}
          className="flex w-full cursor-pointer items-start gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
        >
          <LucideIcons.Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-1" />
          <span className="flex-1">{point.title}</span>
          {readItems.has(point.title) && <LucideIcons.CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1" />}
        </button>
      ))}
    </CardContent>
  </Card>
);

const PracticalExperiencesModule = ({ content, onExperienceClick, readItems }: { content: any, onExperienceClick: (exp: any) => void, readItems: Set<string> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LucideIcons.HandHeart className="h-5 w-5 text-emerald-600" />
        {content.title}
      </CardTitle>
      <CardDescription>{content.subtitle}</CardDescription>
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
           {readItems.has(exp.title) && <LucideIcons.CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 ml-4 shrink-0" />}
        </button>
      ))}
    </CardContent>
  </Card>
);

const MicroHabitsModule = ({ content, checkedHabits, onHabitToggle }: { content: any, checkedHabits: Set<number>, onHabitToggle: (index: number) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LucideIcons.Target className="h-5 w-5 text-sky-500" />
        {content.title}
      </CardTitle>
      <CardDescription>{content.subtitle}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {content.habits.map((habit: string, index: number) => (
        <div key={index} className="flex items-start space-x-3 rounded-md border p-4">
          <Checkbox 
            id={`habit-${index}`} 
            className="mt-1" 
            checked={checkedHabits.has(index)}
            onCheckedChange={() => onHabitToggle(index)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor={`habit-${index}`} className="text-sm font-medium cursor-pointer">
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
        <LucideIcons.Mountain className="h-5 w-5 text-primary" />
        {content.title}
      </CardTitle>
      <CardDescription>{content.subtitle}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
        {parseMarkdown(content.description)}
      </div>
    </CardContent>
  </Card>
);

const ToolModule = ({ module }: { module: EducationModuleType }) => {
  if (!module.component) return null;
  const ToolComponent = module.component;

  if (!ToolComponent) {
    console.warn('Dynamic component not found on module.');
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LucideIcons.Zap className="h-5 w-5 text-sky-500" />
          {module.title}
        </CardTitle>
        <CardDescription>{module.subtitle}</CardDescription>
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
    
    if (correctAnswers / totalQuestions > 0.5) {
        if(!isCompleted) {
            const userDocRef = doc(firestore, 'users', user.uid);
            try {
              await updateDoc(userDocRef, {
                  completedTracks: arrayUnion(track.slug)
              });
              toast({
                title: "🎉 Trilha Concluída!",
                description: `Parabéns! Você concluiu a trilha "${track.title}".`,
                className: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-800/50 dark:border-emerald-700 dark:text-emerald-200"
              });
            } catch (error) {
              console.error("Error updating user document:", error);
               toast({
                variant: "destructive",
                title: "Erro ao salvar progresso",
                description: "Não foi possível registrar sua conquista. Tente novamente.",
              });
               return; // Stop execution if saving fails
            }
        }
        onQuizComplete();
    } else {
        toast({
            variant: "destructive",
            title: "Tente novamente!",
            description: `Você acertou ${correctAnswers} de ${totalQuestions}. É preciso acertar mais da metade para avançar.`,
        });
        // Do not call onQuizComplete()
    }
  };
  
  const allQuestionsAnswered = Object.keys(quizAnswers).length === module.questions.length;
  const answeredCount = Object.keys(quizAnswers).length;
  const totalQuestions = module.questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  return (
    <Card className="border-2">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <LucideIcons.Check className="h-5 w-5 text-white" />
            </div>
            {module.title}
          </CardTitle>
          <CardDescription className="mt-2 text-base">{module.subtitle}</CardDescription>
        </div>
        
        {/* Progress Bar */}
        {!showQuizResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso do Quiz</span>
              <span className="font-semibold">{answeredCount} / {totalQuestions} questões</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Result Banner */}
        {showQuizResult && (
          <div className="rounded-lg border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <LucideIcons.Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">Respostas Verificadas!</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Você acertou {module.questions.filter((q: any, idx: number) => quizAnswers[idx] === q.correctAnswer).length} de {totalQuestions} questões
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <form onSubmit={handleQuizSubmit}>
        <CardContent className="space-y-8">
          {module.questions.map((q: any, qIndex: number) => (
            <div key={qIndex} className="space-y-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                  {qIndex + 1}
                </div>
                <p className="font-medium text-base pt-1">{q.question}</p>
              </div>
              <RadioGroup
                onValueChange={(value) => setQuizAnswers(prev => ({ ...prev, [qIndex]: value }))}
                value={quizAnswers[qIndex]}
                disabled={showQuizResult}
                className="space-y-2 pl-11"
              >
                {q.options.map((opt: string, oIndex: number) => {
                   const isCorrect = q.correctAnswer === opt;
                   const isSelected = quizAnswers[qIndex] === opt;
                   
                   return (
                     <div
                      key={oIndex}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:shadow-sm",
                        !showQuizResult && "hover:border-blue-300 dark:hover:border-blue-700",
                        !showQuizResult && isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                        !showQuizResult && !isSelected && "border-slate-200 dark:border-slate-700",
                        showQuizResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-100 dark:shadow-green-900/20",
                        showQuizResult && !isCorrect && isSelected && "border-red-500 bg-red-50 dark:bg-red-900/20"
                      )}
                    >
                      <RadioGroupItem value={opt} id={`q${qIndex}-o${oIndex}`} className="shrink-0" />
                      <Label 
                        htmlFor={`q${qIndex}-o${oIndex}`} 
                        className={cn(
                          "font-normal cursor-pointer flex-1 text-base leading-relaxed",
                          showQuizResult && isCorrect && "font-medium text-green-900 dark:text-green-100",
                          showQuizResult && !isCorrect && isSelected && "text-red-900 dark:text-red-100"
                        )}
                      >
                        {opt}
                      </Label>
                      {showQuizResult && isCorrect && (
                        <div className="flex items-center gap-1 shrink-0">
                          <LucideIcons.Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">Correto</span>
                        </div>
                      )}
                      {showQuizResult && !isCorrect && isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <LucideIcons.X className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">Incorreto</span>
                        </div>
                      )}
                    </div>
                   );
                })}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-6">
          {!showQuizResult && !allQuestionsAnswered && (
            <div className="w-full rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📝 Responda todas as {totalQuestions} questões para verificar suas respostas
              </p>
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={isCompleted || !allQuestionsAnswered}
            className={cn(
              "w-full h-12 text-base font-semibold",
              isCompleted 
                ? "bg-emerald-600 hover:bg-emerald-700" 
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            )}
            size="lg"
          >
            {isCompleted ? (
              <>
                <LucideIcons.Trophy className="mr-2 h-5 w-5" />
                Trilha Concluída
              </>
            ) : (
              <>
                <LucideIcons.CheckCircle className="mr-2 h-5 w-5" />
                Verificar Respostas
              </>
            )}
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
  const firestore = useFirestore();
  const [modalContent, setModalContent] = useState<{ title: string; details: string; } | null>(null);
  const [readItems, setReadItems] = useState<Set<string>>(new Set());
  const [checkedHabits, setCheckedHabits] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('0');
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const trackDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'education', slug);
  }, [firestore, slug]);

  const { data: track, isLoading: isTrackLoading } = useDoc<EducationTrack>(trackDocRef);


  if (isTrackLoading) {
    return <div className="flex h-64 items-center justify-center"><LucideIcons.Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!track) {
    notFound();
  }
  
  const currentModuleIndex = parseInt(activeTab, 10);
  const currentModule = track.content.modules[currentModuleIndex];
  
  const isModuleCompleted = () => {
    if (!currentModule) return false;
    
    switch (currentModule.type) {
      case 'psychology':
        return currentModule.points?.every(p => readItems.has(p.title)) || false;
      case 'practicalExperiences':
        return currentModule.experiences?.every(e => readItems.has(e.title)) || false;
      case 'microHabits':
        return currentModule.habits?.every((_, index) => checkedHabits.has(index)) || false;
      case 'narrative':
      case 'tool':
        return true; // Auto-complete these modules
      case 'finalQuiz':
        return user?.completedTracks?.includes(track.slug) || false;
      default:
        return false;
    }
  };


  const handleMarkAsRead = () => {
    if (modalContent) {
      setReadItems(prev => new Set(prev).add(modalContent.title));
      setModalContent(null);
    }
  };
  
  const handleHabitToggle = (index: number) => {
    setCheckedHabits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    setIsLoadingNext(true);
    setCompletedModules(prev => new Set(prev).add(parseInt(activeTab, 10)));
    
    // Simulate loading and then advance
    setTimeout(() => {
        const nextTabIndex = parseInt(activeTab, 10) + 1;
        if (nextTabIndex < track.content.modules.length) {
            setActiveTab(String(nextTabIndex));
        }
        setIsLoadingNext(false);
    }, 500);
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

  const iconKey = track.icon as unknown as keyof typeof LucideIcons;
  const Icon = (LucideIcons as any)[iconKey] || LucideIcons.HelpCircle;

  const renderModule = (module: any, index: number) => {
    switch (module.type) {
      case 'psychology':
        return <PsychologyModule key={index} content={module} onPointClick={setModalContent} readItems={readItems} />;
      case 'practicalExperiences':
        return <PracticalExperiencesModule key={index} content={module} onExperienceClick={setModalContent} readItems={readItems} />;
      case 'microHabits':
        return <MicroHabitsModule key={index} content={module} checkedHabits={checkedHabits} onHabitToggle={handleHabitToggle} />;
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
  
  const canGoNext = isModuleCompleted();

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
                  <DialogTitle className="text-xl leading-snug">{modalContent?.title || ''}</DialogTitle>
                </div>
            </div>
            <Separator />
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert py-4">
            {parseMarkdown(modalContent?.details || '')}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleMarkAsRead}>
              <LucideIcons.Check className="mr-2 h-4 w-4" />
              Marcar como Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div/>
            <Button asChild variant="outline">
                <Link href="/education">Voltar para a Jornada</Link>
            </Button>
        </div>

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
                  {completedModules.has(index) && <LucideIcons.CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  <span>Módulo {index + 1}</span>
                </TabsTrigger>
             ))}
          </TabsList>
          {track.content.modules.map((module, index) => (
            <TabsContent key={index} value={String(index)} className="mt-6">
                {renderModule(module, index)}
                <div className="mt-6 flex justify-between">
                    <Button onClick={handlePrevious} disabled={currentModuleIndex === 0}>
                        <LucideIcons.ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                     {currentModuleIndex < track.content.modules.length -1 && (
                        <Button onClick={handleNext} disabled={!canGoNext || isLoadingNext}>
                            {isLoadingNext && <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Próximo <LucideIcons.ArrowRight className="ml-2 h-4 w-4" />
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
