
'use client';

import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardDateProvider } from '@/context/dashboard-date-context';
import { RecurringSummaryDialog } from '@/components/dashboard/recurring-summary-dialog';
import { useManageRecurrences } from '@/hooks/useManageRecurrences';
import { useNotificationGenerator } from '@/hooks/useNotificationGenerator';


export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  // const { newlyCreatedTransactions, clearNewlyCreatedTransactions } = useManageRecurrences();
  useNotificationGenerator(); // Gera notificações de sistema

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardDateProvider>
       {/* <RecurringSummaryDialog 
        transactions={newlyCreatedTransactions}
        onClose={clearNewlyCreatedTransactions}
      /> */}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/20">
            <div className="mx-auto max-w-8xl p-4 lg:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardDateProvider>
  );
}
