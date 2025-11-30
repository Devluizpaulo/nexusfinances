'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  DocumentData,
  QueryConstraint,
  FirestoreError,
} from 'firebase/firestore';
import { useUser } from '../auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase/index';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import type { WithId } from './use-collection';

interface UseUserSubcollectionOptions {
  constraints?: QueryConstraint[];
  listen?: boolean;
}

/**
 * Hook para buscar dados de uma subcoleção do usuário autenticado.
 *
 * @param subcollectionName - O nome da subcoleção (ex: 'incomes', 'expenses').
 * @param options - Opções para filtrar, ordenar e escutar em tempo real.
 * @returns Um objeto com `data`, `isLoading` e `error`.
 */
export function useUserSubcollection<T = DocumentData>(
  subcollectionName: string,
  options: UseUserSubcollectionOptions = {}
) {
  const { constraints = [], listen = true } = options;
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // O hook useMemoFirebase agora recebe as dependências diretamente
  const memoizedQuery = useMemoFirebase(() => {
    if (!user || !firestore) {
      return null;
    }

    const path = `users/${user.uid}/${subcollectionName}`;
    // A consulta é criada com as restrições (filtros/ordenação)
    return query(collection(firestore, path), ...constraints);
  }, [user, firestore, subcollectionName, constraints]); // Passamos o array de constraints como dependência


  useEffect(() => {
    if (!memoizedQuery) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);

    const handleSnapshot = (snapshot: DocumentData) => {
      const results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as WithId<T>));
      setData(results);
      setError(null);
      setIsLoading(false);
    };

    const handleError = (err: FirestoreError) => {
        const path = (memoizedQuery as any)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
    };

    if (listen) {
      const unsubscribe = onSnapshot(memoizedQuery, handleSnapshot, handleError);
      return () => unsubscribe();
    } else {
      getDocs(memoizedQuery).then(handleSnapshot).catch(handleError);
    }

  }, [memoizedQuery, listen]);

  return { data, isLoading, error };
}
