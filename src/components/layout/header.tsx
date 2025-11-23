'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, PanelLeft, ChevronLeft, ChevronRight, UserCircle, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../ui/sidebar';
import { ThemeToggle } from '../theme-toggle';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addMonths } from 'date-fns';
import { EducationLevelBadge } from '../education/EducationLevelBadge';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';


const getTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Painel';
    if (pathname.startsWith('/income')) return 'Renda';
    if (pathname.startsWith('/expenses')) return 'Despesas';
    if (pathname.startsWith('/debts')) return 'Dívidas';
    if (pathname.startsWith('/goals')) return 'Metas & Reservas';
    if (pathname.startsWith('/reports')) return 'Relatórios';
    if (pathname.startsWith('/education')) return 'Jornada Financeira'
    if (pathname.startsWith('/profile')) return 'Perfil';
    if (pathname.startsWith('/support')) return 'Suporte';
    return 'Xô Planilhas';
}

function UserMenu() {
    const { user } = useUser();
    const auth = useAuth();
    
     const handleSignOut = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };


    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Usuário';
        return displayName.split(' ')[0];
    }


    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.photoURL || undefined} alt="Avatar do usuário"/>
                        <AvatarFallback>{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel className='font-normal'>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getFirstName(user.displayName)}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                    <DropdownMenuItem>
                        <UserCircle className="mr-2" />
                        <span>Perfil & Configuração</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const { toggleSidebar, isPinned } = useSidebar();
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
          <EducationLevelBadge />
          <Button variant="ghost" size="icon">
            <Bell />
            <span className="sr-only">Notificações</span>
          </Button>
          {isPinned && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
