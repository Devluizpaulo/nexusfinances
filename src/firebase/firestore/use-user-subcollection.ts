'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Query,
  DocumentData,
  QueryConstraint,
  FirestoreError,
} from 'firebase/firestore';
import { useUser } from '../auth/use-user';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export type WithId<T> = T & { id: string };

interface UseUserSubcollectionOptions {
  filters?: QueryConstraint[];
  orderBy?: [string, 'asc' | 'desc'];
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
  const { filters = [], orderBy: orderByConfig, listen = true } = options;
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const memoizedQuery = useMemo(() => {
    if (!user || !firestore) {
      return null;
    }

    const path = `users/${user.uid}/${subcollectionName}`;
    const constraints: QueryConstraint[] = [...filters];
    
    if (orderByConfig) {
      constraints.push(orderBy(orderByConfig[0], orderByConfig[1]));
    }
    
    return query(collection(firestore, path), ...constraints);
  }, [user, firestore, subcollectionName, JSON.stringify(filters), JSON.stringify(orderByConfig)]);


  useEffect(() => {
    if (!memoizedQuery) {
      setIsLoading(false);
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

// Helper para getDocs, caso seja necessário futuramente
import { getDocs } from 'firebase/firestore';
