'use client';

import { createContext, useMemo } from 'react';
import { useUser } from '@/firebase';
import { defineAbilitiesFor } from './ability';
import { AbilityContext } from '@casl/react';
import type { AppAbility } from './ability';
import type { ReactNode } from 'react';

// Crie o contexto do CASL específico para o seu AppAbility
export const AppAbilityContext = createContext<AppAbility>(undefined!);

interface AbilityProviderProps {
  children: ReactNode;
}

export function AbilityProvider({ children }: AbilityProviderProps) {
  const { user } = useUser();

  // As habilidades são recalculadas sempre que o objeto do usuário muda.
  const ability = useMemo(() => defineAbilitiesFor(user), [user]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
