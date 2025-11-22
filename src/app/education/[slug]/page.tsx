
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { educationTracks } from '@/lib/education-data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HelpCircle, Target, BookCopy, Zap, Check, Lightbulb, Brain, HandHeart, Mountain } from 'lucide-react';
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

// Helper Functions
function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;

  const nodes = text.split(boldRegex).map((part, index) => {
    if (index % 2 !== 0) { // It's a bold part
      return <strong key={`bold-${index}`}>{part}</strong>;
    }
    
    return part.split(italicRegex).map((subPart, subIndex) => {
      if (subIndex % 2 !== 0) { // It's an italic part
        return <em key={`italic-${index}-${subIndex}`}>{subPart}</em>;
      }
      return subPart;
    });
  });

  return <>{nodes}</>;
}


// Sub-components for each module
const PsychologyModule = ({ content, onPointClick }: { content: EducationTrack['content']['psychology'], onPointClick: (point: any) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        Módulo 1: {content.title}
      </CardTitle>
      <CardDescription>Entenda os "porquês" por trás das suas ações financeiras.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {content.points.map((point, index) => (
        <button
          key={index}
          onClick={() => onPointClick(point)}
          className="flex w-full cursor-pointer items-start gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
        >
          <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-1" />
          <span>{parseMarkdown(point.title)}</span>
        </button>
      ))}
    </CardContent>
  </Card>
);

const PracticalExperiencesModule = ({ content, onExperienceClick }: { content: EducationTrack['content']['practicalExperiences'], onExperienceClick: (exp: any) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <HandHeart className="h-5 w-5 text-emerald-600" />
        Módulo 2: {content.title}
      </CardTitle>
      <CardDescription>Exercícios para conectar o aprendizado à sua vida real.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {content.experiences.map((exp, index) => (
        <button
          key={index}
          onClick={() => onExperienceClick(exp)}
          className="w-full cursor-pointer rounded-md border bg-muted/50 p-4 text-left transition-colors hover:bg-muted"
        >
          <p className="font-semibold text-sm">{exp.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
        </button>
      ))}
    </CardContent>
  </Card>
);

const MicroHabitsModule = ({ content }: { content: EducationTrack['content']['microHabits'] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5 text-sky-500" />
        Módulo 3: {content.title}
      </CardTitle>
      <CardDescription>Pequenas ações diárias para construir grandes mudanças.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {content.habits.map((habit, index) => (
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

const NarrativeModule = ({ content }: { content: EducationTrack['content']['narrative'] }) => (
  <Card className="bg-primary/5 border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Mountain className="h-5 w-5 text-primary" />
        Módulo 4: {content.title}
      </CardTitle>
      <CardDescription>Uma metáfora para guiar sua jornada.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground italic">{content.description}</p>
    </CardContent>
  </Card>
);

const ToolModule = ({ content }: { content: EducationTrack['content'] }) => {
  if (!content.tool) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-sky-500" />
          Módulo 5: Ferramenta na Prática
        </CardTitle>
        <CardDescription>Use esta ferramenta para tomar decisões melhores.</CardDescription>
      </CardHeader>
      <CardContent>
        <content.tool />
      </CardContent>
    </Card>
  );
};

const FinalQuizModule = ({ track, user }: { track: EducationTrack, user: any }) => {
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
          completedTracks: arrayUnion(track.slug)
        });
        toast({
          title: "Trilha Concluída!",
          description: `Parabéns! Você concluiu a trilha "${track.title}".`,
          className: "bg-emerald-100 border-emerald-300 text-emerald-800"
        });
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
                {q.options.map((opt, oIndex) => {
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
          <Button type="submit" disabled={isCompleted || showQuizResult || Object.keys(quizAnswers).length !== track.content.finalQuiz.questions.length}>
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

  const track = educationTracks.find((t) => t.slug === slug);

  if (!track) {
    notFound();
  }

  return (
    <>
      <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalContent?.title ? parseMarkdown(modalContent.title) : ''}</DialogTitle>
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

        <PsychologyModule content={track.content.psychology} onPointClick={setModalContent} />
        <PracticalExperiencesModule content={track.content.practicalExperiences} onExperienceClick={setModalContent} />
        <MicroHabitsModule content={track.content.microHabits} />
        <NarrativeModule content={track.content.narrative} />
        <ToolModule content={track.content} />
        <FinalQuizModule track={track} user={user} />
      </div>
    </>
  );
}
