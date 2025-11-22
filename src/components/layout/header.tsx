'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, PanelLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../ui/sidebar';
import { ThemeToggle } from '../theme-toggle';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addMonths } from 'date-fns';

const getTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Painel';
    if (pathname.startsWith('/income')) return 'Renda';
    if (pathname.startsWith('/expenses')) return 'Despesas';
    if (pathname.startsWith('/debts')) return 'Dívidas';
    if (pathname.startsWith('/goals')) return 'Metas & Reservas';
    if (pathname.startsWith('/reports')) return 'Relatórios';
    if (pathname.startsWith('/profile')) return 'Perfil';
    if (pathname.startsWith('/support')) return 'Suporte';
    return 'xô planilhas';
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const { toggleSidebar } = useSidebar();
  const isDashboard = pathname.startsWith('/dashboard');
  const dashboardDate = isDashboard ? useDashboardDate() : null;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex w-full items-center gap-4">
        {/* Esquerda: título + botão sidebar mobile */}
        <div className="flex items-center gap-3 min-w-0">
          <Button onClick={toggleSidebar} variant="ghost" size="icon" className="md:hidden">
            <PanelLeft />
            <span className="sr-only">Alternar Barra Lateral</span>
          </Button>
          <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        </div>

        {/* Centro: seletor de mês do dashboard */}
        <div className="flex flex-1 justify-center">
          {dashboardDate && (
            <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
              <button
                type="button"
                onClick={() => dashboardDate.setSelectedDate(addMonths(dashboardDate.selectedDate, -1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-background/70 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 sm:px-2 font-medium capitalize">
                {format(dashboardDate.selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <button
                type="button"
                onClick={() => dashboardDate.setSelectedDate(addMonths(dashboardDate.selectedDate, 1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-background/70 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Direita: tema + notificações */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon">
            <Bell />
            <span className="sr-only">Notificações</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
