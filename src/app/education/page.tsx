
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BookOpen, Check, Trophy, Loader2 } from 'lucide-react';
import { educationTracks, journeyLevels } from '@/lib/education-data';
import { useUser } from '@/firebase';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EducationTrackCard } from '@/components/education/EducationTrackCard';
import { Badge } from '@/components/ui/badge';

export default function EducationPage() {
  const { user, isUserLoading } = useUser();
  
  const completedTracks = useMemo(() => new Set(user?.completedTracks || []), [user?.completedTracks]);
  
  const upcomingTracks = useMemo(() => educationTracks.filter(track => !completedTracks.has(track.slug)), [completedTracks]);
  const finishedTracks = useMemo(() => educationTracks.filter(track => completedTracks.has(track.slug)), [completedTracks]);
  
  const { currentLevelIndex, progressPercentage } = useMemo(() => {
    const totalTracks = educationTracks.length;
    if (totalTracks === 0) {
        return { currentLevelIndex: 0, progressPercentage: 0 };
    }
    const completedCount = completedTracks.size;
    const progress = (completedCount / totalTracks) * 100;
    
    // Logic to determine level based on percentage of completed tracks
    if (progress <= 20) return { currentLevelIndex: 0, progressPercentage: progress }; // Beginner
    if (progress <= 40) return { currentLevelIndex: 1, progressPercentage: progress }; // Curious
    if (progress <= 60) return { currentLevelIndex: 2, progressPercentage: progress }; // Studious
    if (progress < 100) return { currentLevelIndex: 3, progressPercentage: progress }; // Knowledgeable
    return { currentLevelIndex: 4, progressPercentage: 100 }; // Expert

  }, [completedTracks]);


  const isLoading = isUserLoading;
  
  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Jornada da Saúde Financeira"
                description="Aprenda a lidar com suas finanças de forma leve, intuitiva e conquiste a tranquilidade."
            />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

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
                Aprender é o caminho. Veja seu progresso e o que falta para o próximo nível.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Seu nível de conhecimento</span>
            <Badge variant="secondary" className={cn('font-semibold', journeyLevels[currentLevelIndex].colorClass, 'text-white')}>
              {journeyLevels[currentLevelIndex].level}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mt-3 h-3" />
          <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
            {journeyLevels.map((item, index) => (
              <div key={item.level} className={cn(index <= currentLevelIndex ? 'font-semibold text-primary' : '')}>
                {item.level}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Seção de Próximas Missões */}
      {upcomingTracks.length > 0 && (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Próximas Missões</h2>
                <p className="text-sm text-muted-foreground">
                Continue sua jornada com estas trilhas de conhecimento.
                </p>
            </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTracks.map((track) => (
                <EducationTrackCard key={track.slug} track={track} isCompleted={false} />
              ))}
            </div>
        </div>
      )}

      {/* Seção de Conquistas */}
      {finishedTracks.length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                  <h2 className="text-xl font-semibold tracking-tight">Minhas Conquistas</h2>
                  <p className="text-sm text-muted-foreground">
                  Parabéns! Você já concluiu estas trilhas e ganhou conhecimento.
                  </p>
              </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {finishedTracks.map((track) => (
                  <EducationTrackCard key={track.slug} track={track} isCompleted={true} />
                ))}
              </div>
          </div>
      )}

    </div>
  );
}
