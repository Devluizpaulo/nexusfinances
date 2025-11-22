
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, Trophy, Loader2 } from 'lucide-react';
import { journeyLevels } from '@/lib/education-data';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EducationTrackCard } from '@/components/education/EducationTrackCard';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { collection, query, orderBy } from 'firebase/firestore';
import type { EducationTrack } from '@/lib/types';
import * as LucideIcons from 'lucide-react';

function JourneyProgressCard({ isLoading, currentLevelIndex, progressPercentage }: { isLoading: boolean, currentLevelIndex: number, progressPercentage: number }) {
  if (isLoading) {
     return <Skeleton className="h-52 w-full" />;
  }

  return (
     <Card className="overflow-hidden sticky top-20">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <CardTitle>Sua Jornada</CardTitle>
            <CardDescription>
              Veja seu progresso e o que falta para o próximo nível.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Seu nível</span>
          <Badge variant="secondary" className={cn('font-semibold', journeyLevels[currentLevelIndex].colorClass, 'text-white')}>
            {journeyLevels[currentLevelIndex].level}
          </Badge>
        </div>
        <Progress value={progressPercentage} className="mt-3 h-3" />
        <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
          {journeyLevels.map((item, index) => (
            <div key={item.level} className={cn('truncate', index <= currentLevelIndex ? 'font-semibold text-primary' : '')}>
              {item.level}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


export default function EducationPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const educationTracksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'education'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: educationTracks, isLoading: areTracksLoading } = useCollection<EducationTrack>(educationTracksQuery);
  
  const completedTracks = useMemo(() => new Set(user?.completedTracks || []), [user?.completedTracks]);
  
  const upcomingTracks = useMemo(() => (educationTracks || []).filter(track => !completedTracks.has(track.slug)), [educationTracks, completedTracks]);
  const finishedTracks = useMemo(() => (educationTracks || []).filter(track => completedTracks.has(track.slug)), [educationTracks, completedTracks]);
  
  const { currentLevelIndex, progressPercentage } = useMemo(() => {
    const totalTracks = educationTracks?.length || 0;
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

  }, [completedTracks, educationTracks]);


  const isLoading = isUserLoading || areTracksLoading;
  
  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Jornada da Saúde Financeira"
                description="Aprenda a lidar com suas finanças de forma leve, intuitiva e conquiste a tranquilidade."
            />
            <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
              <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              </div>
              <Skeleton className="h-52 w-full hidden lg:block" />
            </div>
        </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Jornada da Saúde Financeira"
        description="Aprenda a lidar com suas finanças de forma leve, intuitiva e conquiste a tranquilidade."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Próximas Missões</h2>
             {upcomingTracks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {upcomingTracks.map((track) => (
                        <EducationTrackCard key={track.slug} track={track} isCompleted={false} />
                    ))}
                </div>
            ) : (
                <Card className="col-span-full flex h-64 flex-col items-center justify-center text-center">
                    <CardHeader>
                        <CardTitle>Parabéns, Expert!</CardTitle>
                        <CardDescription>Você concluiu todas as trilhas disponíveis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Continue aplicando o conhecimento e fique de olho para novas trilhas no futuro!</p>
                    </CardContent>
                </Card>
            )}
        </div>
         <aside className="space-y-6">
            <JourneyProgressCard isLoading={isLoading} currentLevelIndex={currentLevelIndex} progressPercentage={progressPercentage} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Conquistas</CardTitle>
                    <CardDescription className="text-sm">Trilhas que você já completou.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {finishedTracks.length > 0 ? (
                        finishedTracks.map((track) => {
                          const Icon = (LucideIcons as any)[track.icon] || LucideIcons.HelpCircle;
                          return (
                            <Link href={`/education/${track.slug}`} key={track.slug} className="group flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", track.bgColor)}>
                                    <Icon className={cn("h-5 w-5", track.color)} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{track.title}</p>
                                </div>
                                <Check className="h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          )
                        })
                    ) : (
                         <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
                            <p>Suas conquistas aparecerão aqui quando você completar sua primeira trilha.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </aside>
      </div>
    </>
  );
}

    