"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { journeyLevels } from '@/lib/education-data';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Check, Trophy, Loader2 } from 'lucide-react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { EducationTrack } from '@/lib/types';
import { EducationTrackCard } from './EducationTrackCard';
import * as LucideIcons from 'lucide-react';


export function JourneyProgressCard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const educationTracksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'education'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: educationTracks, isLoading: areTracksLoading } = useCollection<EducationTrack>(educationTracksQuery);
  
  const completedTracks = useMemo(() => new Set(user?.completedTracks || []), [user?.completedTracks]);
  
  const { currentLevelIndex, progressPercentage } = useMemo(() => {
    const totalTracks = educationTracks?.length || 0;
    if (totalTracks === 0) {
        return { currentLevelIndex: 0, progressPercentage: 0 };
    }
    const completedCount = completedTracks.size;
    const progress = (completedCount / totalTracks) * 100;
    
    if (progress <= 20) return { currentLevelIndex: 0, progressPercentage: progress };
    if (progress <= 40) return { currentLevelIndex: 1, progressPercentage: progress };
    if (progress <= 60) return { currentLevelIndex: 2, progressPercentage: progress };
    if (progress < 100) return { currentLevelIndex: 3, progressPercentage: progress };
    return { currentLevelIndex: 4, progressPercentage: 100 };

  }, [completedTracks, educationTracks]);

  const isLoading = isUserLoading || areTracksLoading;

  if (isLoading) {
     return <Skeleton className="h-52 w-full" />;
  }
  
  const currentLevel = journeyLevels[currentLevelIndex];

  return (
     <Card className="overflow-hidden sticky top-20">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <CardTitle>Sua Jornada de Educação Financeira</CardTitle>
            <CardDescription>
              Aprenda, aplique e evolua sua saúde financeira.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Seu nível</span>
           <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white", currentLevel.colorClass)}>
            <currentLevel.icon className="h-4 w-4" />
            {currentLevel.level}
          </div>
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
