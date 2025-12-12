
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Recurrence, Transaction } from '@/lib/types';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { ElementType } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { columns as recurrenceColumns } from './list-columns';

interface SubscriptionColumnProps {
  categoryConfig: {
    id: 'media' | 'software' | 'services';
    title: string;
    icon: ElementType;
  };
  subscriptions: Recurrence[];
  viewMode: 'card' | 'list';
  onEdit: (transaction: Transaction) => void;
}

export function SubscriptionColumn({ categoryConfig, subscriptions, viewMode, onEdit }: SubscriptionColumnProps) {
  const { title, icon: Icon } = categoryConfig;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">{title}</h2>
        <span className="text-sm text-muted-foreground">({subscriptions.length})</span>
      </div>
      
      {subscriptions.length > 0 ? (
        viewMode === 'card' ? (
          <div className="space-y-4">
            {subscriptions.map(item => (
              <RecurrenceCard key={item.id} recurrence={item} onEdit={() => onEdit(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border">
            <DataTable 
              columns={recurrenceColumns({ onEdit })} 
              data={subscriptions}
            />
          </div>
        )
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <h3 className="font-semibold text-sm text-muted-foreground">Nenhuma assinatura aqui</h3>
        </div>
      )}
    </div>
  );
}
