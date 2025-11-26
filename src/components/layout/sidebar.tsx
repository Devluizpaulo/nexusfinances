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
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, className: "text-sky-500" },
  { href: '/income', label: 'Renda', icon: Landmark, className: "text-emerald-500" },
];

const planningMenuItems = [
  { href: '/debts', label: 'Parcelamentos & Dívidas', icon: Banknote, className: "text-amber-500" },
  { href: '/goals', label: 'Metas & Reservas', icon: PiggyBank, className: "text-blue-500" },
  { href: '/budgets', label: 'Limites de Gasto', icon: Files, className: "text-violet-500" },
];

const analysisMenuItems = [
  { href: '/reports', label: 'Relatórios', icon: BarChart3, className: "text-indigo-500" },
  { href: '/education', label: 'Jornada Financeira', icon: GraduationCap, className: "text-teal-500" },
];

const secondaryMenuItems = [
    { href: '/support', label: 'Suporte', icon: LifeBuoy, className: "text-gray-500" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile, isPinned, togglePinned } = useSidebar();
  const { user } = useUser();
  const [isExpensesOpen, setIsExpensesOpen] = useState(
    pathname.startsWith('/expenses') || pathname.startsWith('/recurrences')
  );


  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuItems = (items: typeof overviewMenuItems) => (
    items.map((item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))} tooltip={item.label} onClick={handleMobileClick}>
                <Link href={item.href}>
                    <item.icon className={cn(item.className)} />
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
                                isActive={pathname.startsWith('/expenses') || pathname.startsWith('/recurrences')}
                                tooltip={'Despesas'}
                                className="justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <CreditCard className="text-red-500" />
                                    <span>Despesas</span>
                                </div>
                                <ChevronDown className={cn("transition-transform", state === "collapsed" ? "hidden" : "", isExpensesOpen && "rotate-180")} />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                    </SidebarMenuItem>
                     <CollapsibleContent className={cn("my-1 space-y-1", state === "collapsed" ? "hidden" : "")}>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname === '/expenses'} tooltip={'Todos os Gastos'} onClick={handleMobileClick}>
                                <Link href="/expenses">
                                    Todos os Gastos
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/credit-cards')} tooltip={'Cartões de Crédito'} onClick={handleMobileClick}>
                                <Link href="/credit-cards">
                                    Cartões de Crédito
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/housing')} tooltip={'Moradia'} onClick={handleMobileClick}>
                                <Link href="/expenses/housing">
                                    Moradia
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/utilities')} tooltip={'Contas de Consumo'} onClick={handleMobileClick}>
                                <Link href="/expenses/utilities">
                                    Contas de Consumo
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/taxes')} tooltip={'Impostos e Taxas'} onClick={handleMobileClick}>
                                <Link href="/expenses/taxes">
                                    Impostos e Taxas
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/health')} tooltip={'Saúde e Bem-estar'} onClick={handleMobileClick}>
                                <Link href="/expenses/health">
                                    Saúde & Bem-estar
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname.startsWith('/expenses/subscriptions')} tooltip={'Streams & Assinaturas'} onClick={handleMobileClick}>
                                <Link href="/expenses/subscriptions">
                                    Streams & Assinaturas
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem className="ml-5 border-l border-border pl-3">
                             <SidebarMenuButton asChild isActive={pathname === '/recurrences'} tooltip={'Contas Fixas'} onClick={handleMobileClick}>
                                <Link href="/recurrences">
                                    Outras Contas Fixas
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
                                    <ShieldCheck className="text-rose-500" />
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
                                <item.icon className={item.className} />
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
