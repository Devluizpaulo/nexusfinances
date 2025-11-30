'use client';

import { useMemo } from 'react';
import { type AppUser } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useMemoFirebase } from '@/firebase';

interface UsersTableProps {
  usersData: AppUser[];
}

export function UsersTable({ usersData }: UsersTableProps) {
  const memoizedColumns = useMemoFirebase(() => columns, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Visualize e gerencie todos os usuários cadastrados no sistema.</CardDescription>
      </CardHeader>
      <CardContent>
         <DataTable columns={memoizedColumns} data={usersData} />
      </CardContent>
    </Card>
  );
}
