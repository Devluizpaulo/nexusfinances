'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, PiggyBank, BarChart3, GraduationCap, ShieldCheck, LifeBuoy, Home, Zap, FileText, HeartPulse, Repeat, WalletCards, History, List, LineChart, PieChart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import Image from 'next/image';

const navSections = [
    {
        label: 'Visão Geral',
        icon: LayoutDashboard,
        href: '/dashboard',
        subItems: [
            { href: '/dashboard', label: 'Resumo', icon: LineChart },
            { href: '/reports', label: 'Relatórios', icon: PieChart },
        ]
    },
    {
        label: 'Transações',
        icon: Landmark,
        href: '/transactions',
        subItems: [
            { href: '/income', label: 'Rendas', icon: Landmark },
            { href: '/expenses', label: 'Despesas', icon: CreditCard },
        ]
    },
    {
        label: 'Dívidas',
        icon: Banknote,
        href: '/debts',
        subItems: []
    },
    {
        label: 'Metas',
        icon: PiggyBank,
        href: '/goals',
        subItems: []
    },
    {
        label: 'Jornada',
        icon: GraduationCap,
        href: '/education',
        subItems: []
    },
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

  return (
    <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
            <Button variant="ghost" className="h-12 justify-start items-center gap-2 p-2 w-full" asChild>
                <Link href="/dashboard">
                    <div className="p-1.5 rounded-lg bg-background">
                        <Image src="/images/xoplanilhas_logo.png" alt="Logo Xô Planilhas" width={32} height={32} />
                    </div>
                    <span className={cn("text-lg font-semibold group-data-[state=collapsed]:hidden")}>Xô Planilhas</span>
                </Link>
            </Button>
        </SidebarHeader>
        
        <SidebarMenu className="flex-1">
            {navSections.map((section) => {
                const isActiveSection = pathname === section.href || (section.href !== '/dashboard' && pathname.startsWith(section.href));
                return (
                    <SidebarGroup key={section.href}>
                        <SidebarMenuItem>
                             <SidebarMenuButton 
                                asChild 
                                isActive={isActiveSection}
                                tooltip={section.label} 
                                onClick={handleMobileClick}
                            >
                                <Link href={section.href}>
                                    <section.icon />
                                    <span>{section.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {isActiveSection && section.subItems.length > 0 && (
                             <SidebarMenuSub>
                                {section.subItems.map(subItem => (
                                    <SidebarMenuSubItem key={subItem.href}>
                                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.href)} onClick={handleMobileClick}>
                                             <Link href={subItem.href}>
                                                <subItem.icon />
                                                <span>{subItem.label}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        )}
                    </SidebarGroup>
                )
            })}
            
            {user?.role === 'superadmin' && (
                <SidebarGroup>
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
                 {bottomMenuItems.map(item => (
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
        </SidebarFooter>
    </Sidebar>
  );
}
