
'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target, LogOut, UserCircle, LifeBuoy, ShieldCheck, PiggyBank, BarChart3, GraduationCap, Pin, PinOff, Files, Repeat, Clapperboard, ChevronDown, Home, Zap, FileText, HeartPulse } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';


const overviewMenuItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/income', label: 'Renda', icon: Landmark },
];

const planningMenuItems = [
  { href: '/debts', label: 'Dívidas', icon: Banknote },
  { href: '/goals', label: 'Metas & Reservas', icon: PiggyBank },
  { href: '/budgets', label: 'Limites de Gasto', icon: Files },
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
  const [isExpensesOpen, setIsExpensesOpen] = useState(
    pathname.startsWith('/expenses') || pathname.startsWith('/recurrences') || pathname.startsWith('/credit-cards')
  );


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
                 <Collapsible open={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/expenses') || pathname.startsWith('/recurrences') || pathname.startsWith('/credit-cards')}
                                tooltip={'Despesas'}
                                className="justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <CreditCard />
                                    <span>Despesas</span>
                                </div>
                                <ChevronDown className={cn("transition-transform", (state === "collapsed" || (state === "expanded" && !isExpensesOpen)) && "group-data-[collapsed]:hidden", isExpensesOpen && "rotate-180")} />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                    </SidebarMenuItem>
                     <CollapsibleContent className={cn("group-data-[collapsed]:hidden", state === "collapsed" ? "hidden" : "group-data-[collapsed]:hidden")}>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname === '/expenses'} tooltip={'Todos os Gastos'} onClick={handleMobileClick}>
                                <Link href="/expenses">
                                    <span>Todos os Gastos</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/housing')} tooltip={'Moradia'} onClick={handleMobileClick}>
                                <Link href="/expenses/housing">
                                    <span>Moradia</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/utilities')} tooltip={'Contas de Consumo'} onClick={handleMobileClick}>
                                <Link href="/expenses/utilities">
                                    <span>Contas de Consumo</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/taxes')} tooltip={'Impostos e Taxas'} onClick={handleMobileClick}>
                                <Link href="/expenses/taxes">
                                    <span>Impostos e Taxas</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/health')} tooltip={'Saúde e Bem-estar'} onClick={handleMobileClick}>
                                <Link href="/expenses/health">
                                    <span>Saúde & Bem-estar</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname === '/recurrences'} tooltip={'Contas Fixas'} onClick={handleMobileClick}>
                                <Link href="/recurrences">
                                    <span>Outras Contas Fixas</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/subscriptions')} tooltip={'Streams & Assinaturas'} onClick={handleMobileClick}>
                                <Link href="/expenses/subscriptions">
                                    <span>Streams & Assinaturas</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/credit-cards')} tooltip={'Cartões de Crédito'} onClick={handleMobileClick}>
                                <Link href="/credit-cards">
                                    <span>Cartões de Crédito</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </CollapsibleContent>
                </Collapsible>
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
