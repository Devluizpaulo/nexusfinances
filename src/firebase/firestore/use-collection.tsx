
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  optimisticDelete: (id: string, collectionPath: string) => Promise<void>;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isPending, startTransition] = useTransition();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        
        startTransition(() => {
            setData(results);
            setError(null);
            setIsLoading(false);
        });
      },
      (error: FirestoreError) => {
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);
  
  const optimisticDelete = useCallback(async (id: string, collectionPath: string) => {
    if (!data) return;

    const originalData = [...data];
    const itemToDelete = data.find(item => item.id === id);

    // Optimistic UI update
    const updatedData = data.filter(item => item.id !== id);
    setData(updatedData);

    try {
        const docRef = doc(firestore, collectionPath, id);
        await deleteDoc(docRef);
        // On successful deletion, the `onSnapshot` listener will automatically provide the source of truth.
        // We don't need to manually set the state again.
    } catch (err) {
        console.error("Failed to delete document:", err);
        // Rollback on error
        setData(originalData);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: `Não foi possível remover o item. O estado foi restaurado.`,
        });
    }
  }, [data, firestore, toast]);

  
  if (process.env.NODE_ENV === 'development' && memoizedTargetRefOrQuery && !(memoizedTargetRefOrQuery as any).__memo) {
    console.warn('useCollection was called with a query or reference that was not created with useMemoFirebase. This can lead to performance issues and bugs.', memoizedTargetRefOrQuery);
  }
  
  return { data, isLoading: isLoading || isPending, error, optimisticDelete };
}
