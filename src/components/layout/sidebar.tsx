
'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target, LogOut, UserCircle, LifeBuoy, ShieldCheck, PiggyBank, BarChart3, GraduationCap, Pin, PinOff, Files, Repeat } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';


const overviewMenuItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/income', label: 'Renda', icon: Landmark },
  { href: '/expenses', label: 'Despesas', icon: CreditCard },
];

const planningMenuItems = [
  { href: '/debts', label: 'Dívidas', icon: Banknote },
  { href: '/goals', label: 'Metas & Reservas', icon: PiggyBank },
  { href: '/budgets', label: 'Limites de Gasto', icon: Files },
  { href: '/recurrences', label: 'Recorrências', icon: Repeat },
];

const analysisMenuItems = [
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/education', label: 'Jornada Financeira', icon: GraduationCap },
];

const secondaryMenuItems = [
    { href: '/support', label: 'Suporte', icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile, isPinned, togglePinned } = useSidebar();
  const { user } = useUser();

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuItems = (items: typeof overviewMenuItems) => (
    items.map((item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label} onClick={handleMobileClick}>
                <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    ))
  );

  return (
    <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className={cn("transition-transform duration-200", state === "collapsed" && "p-1")}>
            <Button variant="ghost" className="h-12 w-full justify-start items-center gap-2 px-3">
                 <div className="p-2.5 rounded-lg bg-primary text-primary-foreground">
                    <DollarSign className="size-5" />
                </div>
                <span className={cn("text-lg font-semibold", state === "collapsed" && "hidden")}>Xô Planilhas</span>
            </Button>
        </SidebarHeader>
        <SidebarMenu className="flex-1">
            <SidebarGroup>
                <SidebarGroupLabel>Visão Geral</SidebarGroupLabel>
                {renderMenuItems(overviewMenuItems)}
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
                <SidebarGroupLabel>Planejamento</SidebarGroupLabel>
                {renderMenuItems(planningMenuItems)}
            </SidebarGroup>
            
            <SidebarSeparator />

            <SidebarGroup>
                <SidebarGroupLabel>Análise</SidebarGroupLabel>
                 {renderMenuItems(analysisMenuItems)}
            </SidebarGroup>


             {user?.role === 'superadmin' && (
                <>
                    <SidebarSeparator />
                    <SidebarGroup>
                         <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip="Painel Admin" onClick={handleMobileClick}>
                                <Link href="/admin/dashboard">
                                    <ShieldCheck />
                                    <span>Painel Admin</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarGroup>
                </>
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
                <SidebarMenuButton onClick={togglePinned} tooltip={isPinned ? 'Desafixar menu' : 'Fixar menu'}>
                    {isPinned ? <PinOff/> : <Pin />}
                    <span>{isPinned ? 'Menu Flutuante' : 'Fixar Menu'}</span>
                </SidebarMenuButton>
            </div>
        </SidebarFooter>
    </Sidebar>
  );
}
