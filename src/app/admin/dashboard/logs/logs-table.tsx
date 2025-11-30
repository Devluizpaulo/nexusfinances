'use client';

import { useMemo } from 'react';
import { type Log } from '@/lib/types';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useMemoFirebase } from '@/firebase';

interface LogsTableProps {
  logsData: Log[];
}

export function LogsTable({ logsData }: LogsTableProps) {
  const memoizedColumns = useMemoFirebase(() => columns, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs do Sistema</CardTitle>
        <CardDescription>Atividades recentes e eventos importantes do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
         <DataTable columns={memoizedColumns} data={logsData} />
      </CardContent>
    </Card>
  );
}
