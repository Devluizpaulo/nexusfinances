'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, PiggyBank, BarChart3, GraduationCap, ShieldCheck, LifeBuoy, Home, Zap, FileText, HeartPulse, Repeat, WalletCards } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import Image from 'next/image';

const mainMenuItems = [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/income', label: 'Rendas', icon: Landmark },
    { href: '/expenses', label: 'Despesas', icon: CreditCard },
    { href: '/debts', label: 'Dívidas', icon: Banknote },
    { href: '/goals', label: 'Metas', icon: PiggyBank },
];

const secondaryMenuItems = [
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/education', label: 'Jornada Financeira', icon: GraduationCap },
    { href: '/health', label: 'Saúde', icon: HeartPulse },
];

const bottomMenuItems = [
    { href: '/support', label: 'Suporte', icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuItem = (item: typeof mainMenuItems[0]) => (
    <SidebarMenuItem key={item.href}>
        <SidebarMenuButton 
            asChild 
            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))} 
            tooltip={item.label} 
            onClick={handleMobileClick}
        >
            <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
            </Link>
        </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
            <Button variant="ghost" className="h-12 justify-start items-center gap-2 p-2 w-full" asChild>
                <Link href="/dashboard">
                    <div className="p-1 rounded-lg bg-white">
                        <Image src="/images/xoplanilhas_logo.png" alt="Logo Xô Planilhas" width={36} height={36} />
                    </div>
                    <span className={cn("text-lg font-semibold group-data-[state=collapsed]:hidden")}>Xô Planilhas</span>
                </Link>
            </Button>
        </SidebarHeader>
        
        <SidebarMenu className="flex-1">
            <SidebarGroup>
                <SidebarGroupLabel>Principal</SidebarGroupLabel>
                {mainMenuItems.map(renderMenuItem)}
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
                <SidebarGroupLabel>Análise</SidebarGroupLabel>
                {secondaryMenuItems.map(renderMenuItem)}
            </SidebarGroup>
            
            {user?.role === 'superadmin' && (
                <SidebarGroup>
                    <SidebarGroupLabel>Admin</SidebarGroupLabel>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip="Painel Admin" onClick={handleMobileClick}>
                            <Link href="/admin/dashboard">
                                <ShieldCheck className="text-destructive" />
                                <span>Painel Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>
            )}
        </SidebarMenu>
        
        <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
                {bottomMenuItems.map(renderMenuItem)}
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
}
