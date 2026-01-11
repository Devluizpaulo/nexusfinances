
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
import { useBudgetWarningNotifications } from '@/hooks/use-budget-warning-notifications';
import { useDebtOverdueNotifications } from '@/hooks/use-debt-overdue-notifications';
import { useMonthlySummaryNotifications } from '@/hooks/use-monthly-summary-notifications';
import { useGoalMilestoneNotifications } from '@/hooks/use-goal-milestone-notifications';

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  
  // Custom hooks for background tasks and notifications
  useManageRecurrences(); // Creates recurring transactions monthly
  useUpcomingNotifications(); // Alerts for upcoming due dates (3 days)
  useCreditCardNotifications(); // Credit card closing/due date alerts (2 days)
  useBudgetWarningNotifications(); // Budget warnings at 80% and 100%
  useDebtOverdueNotifications(); // Overdue debt installment alerts
  useMonthlySummaryNotifications(); // Monthly financial summary
  useGoalMilestoneNotifications(); // Goal milestone achievements (25%, 50%, 75%, 90%)

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

  
