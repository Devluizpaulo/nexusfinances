'use client';

import { createContext, useMemo, type ReactNode } from 'react';
import { useUser } from '@/firebase';
import { defineAbilitiesFor } from './ability';
import type { AppAbility } from './ability';

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
    <AppAbilityContext.Provider value={ability}>
      {children}
    </AppAbilityContext.Provider>
  );
}
