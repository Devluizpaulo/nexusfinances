'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target, LogOut, UserCircle, LifeBuoy, ShieldCheck, PiggyBank, BarChart3, GraduationCap, Pin, PinOff, Files } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';


const mainMenuItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/income', label: 'Renda', icon: Landmark },
  { href: '/expenses', label: 'Despesas', icon: CreditCard },
  { href: '/debts', label: 'Dívidas', icon: Banknote },
  { href: '/goals', label: 'Reservas', icon: PiggyBank },
  { href: '/budgets', label: 'Orçamentos', icon: Files },
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
                <SidebarMenuButton onClick={togglePinned} tooltip={isPinned ? 'Desafixar menu' : 'Fixar menu'}>
                    {isPinned ? <PinOff/> : <Pin />}
                    <span>{isPinned ? 'Menu Flutuante' : 'Fixar Menu'}</span>
                </SidebarMenuButton>
            </div>
        </SidebarFooter>
    </Sidebar>
  );
}
