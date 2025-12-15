
'use client';

import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardDateProvider } from '@/context/dashboard-date-context';
import { useManageRecurrences } from '@/hooks/use-manage-recurrences';
import { useUpcomingNotifications } from '@/hooks/use-upcoming-notifications';
import { useCreditCardNotifications } from '@/hooks/use-credit-card-notifications';

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  
  // Custom hooks for background tasks
  useManageRecurrences();
  useUpcomingNotifications();
  useCreditCardNotifications();

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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardDateProvider>
  );
}

  
