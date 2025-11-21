'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, type AppUser } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export function UsersTable() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `users`),
      orderBy('displayName', 'asc')
    );
  }, [firestore]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);
  
  const memoizedColumns = useMemo(() => columns, []);

  if (isUsersLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Visualize e gerencie todos os usuários cadastrados no sistema.</CardDescription>
      </CardHeader>
      <CardContent>
         <DataTable columns={memoizedColumns} data={usersData || []} />
      </CardContent>
    </Card>
  );
}
