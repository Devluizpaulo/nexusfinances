'use client';

import { useMemo } from 'react';
import { useUser } from '@/firebase';
import { educationTracks, journeyLevels } from '@/lib/education-data';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button, buttonVariants } from '../ui/button';
import Link from 'next/link';

export function EducationLevelBadge() {
  const { user, isUserLoading } = useUser();

  const completedTracksCount = useMemo(() => user?.completedTracks?.length || 0, [user?.completedTracks]);

  const { currentLevel } = useMemo(() => {
    const totalTracks = educationTracks.length;
    if (totalTracks === 0) {
      return { currentLevel: journeyLevels[0] };
    }

    const progress = (completedTracksCount / totalTracks) * 100;
    
    if (progress <= 20) return { currentLevel: journeyLevels[0] }; // Iniciante
    if (progress <= 40) return { currentLevel: journeyLevels[1] }; // Curioso
    if (progress <= 60) return { currentLevel: journeyLevels[2] }; // Estudioso
    if (progress < 100) return { currentLevel: journeyLevels[3] }; // Entendido
    return { currentLevel: journeyLevels[4] }; // Expert
  }, [completedTracksCount]);

  if (isUserLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!user) {
    return null;
  }
  
  const Icon = currentLevel.icon;

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href="/education" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-10 w-10")}>
                    <Icon className={cn("h-5 w-5", currentLevel.colorClass)} />
                    <span className="sr-only">Nível da Jornada de Evolução</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-semibold">Nível: {currentLevel.level}</p>
                <p className="text-xs text-muted-foreground">Clique para ver sua jornada.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
