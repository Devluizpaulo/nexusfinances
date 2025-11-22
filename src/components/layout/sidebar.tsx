'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target, LogOut, UserCircle, LifeBuoy, ShieldCheck, PiggyBank, BarChart3, GraduationCap, Pin, PinOff } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const mainMenuItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/income', label: 'Renda', icon: Landmark },
  { href: '/expenses', label: 'Despesas', icon: CreditCard },
  { href: '/debts', label: 'Dívidas', icon: Banknote },
  { href: '/goals', label: 'Reservas', icon: PiggyBank },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/education', label: 'Jornada Financeira', icon: GraduationCap },
];

const secondaryMenuItems = [
    { href: '/support', label: 'Suporte', icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile, isPinned, togglePinned } = useSidebar();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
  };

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getFirstName = (displayName: string | null | undefined) => {
    if (!displayName) return 'Usuário';
    return displayName.split(' ')[0];
  }

  const renderUserContent = () => {
    if (isUserLoading) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-md bg-secondary">
                 <Loader2 className="size-9 animate-spin" />
                 <div className={cn("flex flex-col", state === "collapsed" && "hidden")}>
                    <span className="font-semibold text-sm">Carregando...</span>
                </div>
            </div>
        )
    }

    if(user && !isPinned) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn("w-full justify-start items-center gap-3 p-2 h-auto", state === "collapsed" && "px-2 w-auto h-12 justify-center")}>
                        <Avatar className="size-9">
                            <AvatarImage src={user?.photoURL || undefined} alt="Avatar do usuário"/>
                            <AvatarFallback>{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className={cn("flex flex-col items-start overflow-hidden", state === "collapsed" && "hidden")}>
                            <span className="font-semibold text-sm truncate">{getFirstName(user?.displayName)}</span>
                            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
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

    return null;
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className={cn("transition-transform duration-200", state === "collapsed" && "p-1")}>
            <Button variant="ghost" className="h-12 w-full justify-start items-center gap-2 px-3">
                 <div className="p-2.5 rounded-lg bg-primary text-primary-foreground">
                    <DollarSign className="size-5" />
                </div>
                <span className={cn("text-lg font-semibold", state === "collapsed" && "hidden")}>xô planilhas</span>
            </Button>
        </SidebarHeader>
        <SidebarMenu className="flex-1">
            {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label} onClick={handleMobileClick}>
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
             {user?.role === 'superadmin' && (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip="Painel Admin" onClick={handleMobileClick}>
                        <Link href="/admin/dashboard">
                            <ShieldCheck />
                            <span>Painel Admin</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
        <SidebarFooter className={cn("flex flex-col gap-1 transition-transform duration-200 p-2", state === "collapsed" && "p-1")}>
            <SidebarMenu>
                 {secondaryMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label} onClick={handleMobileClick}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
            <SidebarSeparator />
            
            <div className="flex flex-col gap-2">
                {renderUserContent()}
                <SidebarMenuButton onClick={togglePinned} tooltip={isPinned ? 'Desafixar menu' : 'Fixar menu'}>
                    {isPinned ? <PinOff/> : <Pin />}
                    <span>{isPinned ? 'Menu Flutuante' : 'Fixar Menu'}</span>
                </SidebarMenuButton>
            </div>
        </SidebarFooter>
    </Sidebar>
  );
}
