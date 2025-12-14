
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Challenge52Weeks } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { SetupChallenge } from '@/components/challenges/setup-challenge';
import { ChallengeProgress } from '@/components/challenges/challenge-progress';
import { Loader2 } from 'lucide-react';

export default function ChallengesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const activeChallengeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/challenges52weeks`),
      where('status', '==', 'active'),
      limit(1)
    );
  }, [user, firestore]);

  const { data: challenges, isLoading: isChallengesLoading } = useCollection<Challenge52Weeks>(activeChallengeQuery);

  const activeChallenge = challenges?.[0];
  const isLoading = isUserLoading || isChallengesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Desafio das 52 Semanas"
        description="Poupe dinheiro de forma divertida e consistente, um pouco a cada semana."
      />
      {activeChallenge ? (
        <ChallengeProgress challenge={activeChallenge} />
      ) : (
        <SetupChallenge />
      )}
    </div>
  );
}
