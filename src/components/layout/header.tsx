'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, PanelLeft, ChevronLeft, ChevronRight, UserCircle, LogOut, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../ui/sidebar';
import { ThemeToggle } from '../theme-toggle';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addMonths } from 'date-fns';
import { EducationLevelBadge } from '../education/EducationLevelBadge';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
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
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';


const getTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Painel';
    if (pathname.startsWith('/income/salary')) return 'Renda: Salário';
    if (pathname.startsWith('/income/freelancer')) return 'Renda: Freelancer';
    if (pathname.startsWith('/income')) return 'Renda';
    if (pathname.startsWith('/expenses/housing')) return 'Despesas: Moradia';
    if (pathname.startsWith('/expenses/utilities')) return 'Despesas: Contas de Consumo';
    if (pathname.startsWith('/expenses/taxes')) return 'Despesas: Impostos e Taxas';
    if (pathname.startsWith('/expenses/health')) return 'Despesas: Saúde & Bem-estar';
    if (pathname.startsWith('/expenses/subscriptions')) return 'Despesas: Streams & Assinaturas';
    if (pathname.startsWith('/expenses')) return 'Despesas';
    if (pathname.startsWith('/recurrences')) return 'Contas Fixas';
    if (pathname.startsWith('/debts')) return 'Parcelamentos & Dívidas';
    if (pathname.startsWith('/goals')) return 'Metas & Reservas';
    if (pathname.startsWith('/budgets')) return 'Limites de Gasto';
    if (pathname.startsWith('/reports')) return 'Relatórios';
    if (pathname.startsWith('/education')) return 'Jornada Financeira'
    if (pathname.startsWith('/profile')) return 'Perfil & Configurações';
    if (pathname.startsWith('/support')) return 'Suporte & FAQ';
    if (pathname.startsWith('/monetization')) return 'Monetização';
    if (pathname.startsWith('/admin')) return 'Painel do Administrador';
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

function NotificationsMenu() {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `users/${user.uid}/notifications`),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
    }, [user, firestore]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const handleMarkAsRead = (notificationId: string) => {
        if (!user) return;
        const notificationRef = doc(firestore, `users/${user.uid}/notifications`, notificationId);
        updateDocumentNonBlocking(notificationRef, { isRead: true });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
                ) : notifications && notifications.length > 0 ? (
                    notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
                            <Link href={notification.link || '#'}>
                                <div className="flex items-start gap-3 py-2">
                                     {!notification.isRead && (
                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                    )}
                                    <div className={cn("flex-grow", notification.isRead && "pl-4")}>
                                        <p className="text-sm">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                             {formatDistanceToNow(parseISO(notification.timestamp as string), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto px-2 py-1 text-xs"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id)
                                            }}
                                        >
                                            Marcar como lida
                                        </Button>
                                    )}
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <Mail className="h-8 w-8 text-muted-foreground/50"/>
                        <p>Sua caixa de entrada está vazia.</p>
                        <p className="text-xs">Novas notificações aparecerão aqui.</p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
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
          <div className="flex flex-col">
            <h1 className="truncate text-base font-semibold sm:text-lg">{title.split(':')[0]}</h1>
            {title.includes(':') && (
                <p className="text-xs text-muted-foreground truncate">{title.split(':')[1]}</p>
            )}
          </div>
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
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
