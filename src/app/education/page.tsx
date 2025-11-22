
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <div key={item.level} className={cn(index <= currentLevelIndex ? 'font-semibold text-primary' : '')}>
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

      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
                <TabsTrigger value="upcoming">Próximas Missões</TabsTrigger>
                <TabsTrigger value="completed">Conquistas</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-6">
                {upcomingTracks.length > 0 ? (
                     <div className="grid gap-4 md:grid-cols-2">
                        {upcomingTracks.map((track) => (
                            <EducationTrackCard key={track.slug} track={track} isCompleted={false} />
                        ))}
                    </div>
                ) : (
                    <Card className="col-span-full mt-6 flex h-64 flex-col items-center justify-center text-center">
                        <CardHeader>
                            <CardTitle>Parabéns, Expert!</CardTitle>
                            <CardDescription>Você concluiu todas as trilhas disponíveis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Continue aplicando o conhecimento e fique de olho para novas trilhas no futuro!</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
                {finishedTracks.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {finishedTracks.map((track) => (
                            <EducationTrackCard key={track.slug} track={track} isCompleted={true} />
                        ))}
                    </div>
                ) : (
                     <Card className="col-span-full mt-6 flex h-64 flex-col items-center justify-center text-center">
                        <CardHeader>
                            <CardTitle>Nenhuma conquista ainda</CardTitle>
                            <CardDescription>Comece sua primeira missão para desbloquear suas conquistas.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <p className="text-sm text-muted-foreground">Cada trilha concluída é um passo em direção à sua tranquilidade financeira.</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        </Tabs>
         <aside className="hidden lg:block">
          <JourneyProgressCard isLoading={isLoading} currentLevelIndex={currentLevelIndex} progressPercentage={progressPercentage} />
        </aside>
      </div>
    </>
  );
}

