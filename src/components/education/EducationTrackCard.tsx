'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EducationTrack } from '@/lib/types';

interface EducationTrackCardProps {
  track: EducationTrack;
  isCompleted: boolean;
}

export function EducationTrackCard({ track, isCompleted }: EducationTrackCardProps) {
  const Icon = (LucideIcons as any)[track.icon] || LucideIcons.HelpCircle;
  
  return (
    <Link href={`/education/${track.slug}`} className="group block h-full">
      <Card
        className={cn(
          'flex h-full flex-col overflow-hidden border-2 transition-all group-hover:border-primary/80 group-hover:shadow-md',
          isCompleted 
            ? 'border-green-200 bg-green-50/30 dark:border-green-800/50 dark:bg-green-900/10'
            : track.borderColor
        )}
      >
        <CardHeader
          className={cn(
            'flex flex-row items-start justify-between space-y-0',
             isCompleted ? 'bg-green-50/50 dark:bg-green-900/20' : track.bgColor
          )}
        >
          <div className="flex-grow">
            <CardTitle className="text-base font-bold">{track.title}</CardTitle>
          </div>
          <Icon className={cn('h-6 w-6 shrink-0', isCompleted ? 'text-green-600' : track.color)} />
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <p className="text-sm text-muted-foreground">{track.description}</p>
        </CardContent>
        <CardFooter className="flex w-full items-center justify-between pt-2">
            {isCompleted ? (
                 <Badge variant="secondary" className="flex items-center gap-1.5 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    <LucideIcons.CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Concluída</span>
                </Badge>
            ) : (
                <Badge variant="outline" className="font-medium">Começar</Badge>
            )}
             <div className="flex w-full items-center justify-end text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Ver trilha
                <LucideIcons.ChevronRight className="ml-1 h-4 w-4" />
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

    