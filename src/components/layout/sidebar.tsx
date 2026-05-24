
'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarGroup, SidebarMenuSubItem, SidebarMenuSubButton, SidebarContent } from '@/components/ui/sidebar';
import { ShieldCheck, LifeBuoy, Search, Bell, Settings, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import Image from 'next/image';
import { navSections } from '@/lib/nav-config';
import { motion, AnimatePresence } from 'framer-motion';

const getSectionColor = (label: string) => {
  const colors: Record<string, string> = {
    'Dashboard': 'from-blue-500 to-cyan-400',
    'Rendas': 'from-emerald-500 to-teal-400',
    'Despesas': 'from-rose-500 to-orange-400',
    'Dívidas': 'from-amber-500 to-yellow-600',
    'Cartões': 'from-indigo-500 to-purple-400',
    'Orçamentos': 'from-fuchsia-500 to-pink-400',
    'Saúde': 'from-red-400 to-rose-300',
    'Metas': 'from-sky-500 to-blue-400',
    'Desafios': 'from-yellow-400 to-amber-500',
    'Jornada': 'from-violet-500 to-indigo-400',
  };
  return colors[label] || 'from-slate-500 to-slate-400';
};

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-white/5 bg-slate-950/80 backdrop-blur-md text-slate-200"
    >
        <SidebarHeader className="py-4 px-3.5 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between group-data-[state=collapsed]:justify-center">
                <Link href="/dashboard" className="flex items-center gap-2 group/logo outline-none">
                    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
                        <Image src="/images/xoplanilhas_logo.png" alt="Logo" fill className="object-contain p-1" />
                    </div>
                    <span className="text-base font-bold tracking-normal text-slate-100 group-data-[state=collapsed]:hidden">Xô Planilhas</span>
                </Link>
                <div className="group-data-[state=collapsed]:hidden flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-200">
                        <Bell className="h-4 w-4" />
                     </Button>
                </div>
            </div>

            {/* Quick Search Bar */}
            <div className="group-data-[state=collapsed]:hidden relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Busca rápida..." 
                    className="h-9 w-full rounded-lg border border-white/5 bg-slate-900/40 pl-9 pr-4 text-xs text-slate-300 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/30 placeholder:text-slate-500"
                />
            </div>
        </SidebarHeader>
        
        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden pt-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
            <SidebarMenu className="px-3 space-y-1">
                {navSections.map((section, idx) => {
                    const isActiveSection = pathname === section.href || (section.href !== '/dashboard' && pathname.startsWith(section.href));
                    const sectionColor = getSectionColor(section.label);
                    
                    return (
                        <motion.div
                            key={section.href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <SidebarGroup className="p-0">
                                <SidebarMenuItem>
                                    <SidebarMenuButton 
                                        asChild 
                                        isActive={isActiveSection}
                                        tooltip={section.label} 
                                        onClick={handleMobileClick}
                                        className="group h-10 w-full rounded-lg p-2 transition-all duration-200 hover:bg-slate-900/40 data-[active=true]:bg-slate-900/60 outline-none"
                                    >
                                        <Link href={section.href} className="flex items-center gap-3 w-full">
                                            <div className={cn(
                                              "relative flex h-7.5 w-7.5 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-all duration-200",
                                              isActiveSection 
                                                ? `bg-gradient-to-br ${sectionColor} shadow-sm` 
                                                : "bg-slate-900/50 border border-white/5 text-slate-400 group-hover:border-white/10 group-hover:text-slate-100 group-hover:bg-slate-800/40"
                                            )}>
                                              <section.icon className={cn(
                                                "relative z-10 h-3.5 w-3.5 transition-all duration-200",
                                                isActiveSection ? "text-white" : "group-hover:scale-110"
                                              )} />
                                            </div>
                                            
                                            <span className={cn(
                                                "hidden text-xs font-medium tracking-normal transition-colors duration-200 group-data-[state=expanded]:inline-flex",
                                                isActiveSection ? "text-slate-200" : "text-slate-400 group-hover:text-slate-200"
                                            )}>
                                              {section.label}
                                            </span>

                                            {isActiveSection && (
                                                <motion.div 
                                                    layoutId="activeIndicator"
                                                    className="absolute right-0.5 h-4 w-[2px] rounded-full bg-cyan-400" 
                                                />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                
                                <AnimatePresence>
                                    {isActiveSection && section.subItems && section.subItems.length > 0 && (
                                         <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mb-1 ml-5 mt-1 flex flex-col gap-0.5 border-l border-white/5 pl-3"
                                         >
                                            {section.subItems.map(subItem => (
                                                <SidebarMenuSubItem key={subItem.href}>
                                                    <SidebarMenuSubButton
                                                      asChild
                                                      isActive={pathname === subItem.href}
                                                      onClick={handleMobileClick}
                                                      className="h-7.5 rounded-lg text-[11px] text-slate-500 transition-all duration-200 hover:bg-slate-900/40 hover:text-slate-200 data-[active=true]:font-medium data-[active=true]:text-cyan-400"
                                                    >
                                                         <Link href={subItem.href} className="flex items-center gap-2">
                                                            <subItem.icon className="h-3 w-3 shrink-0" />
                                                            <span>{subItem.label}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                         </motion.div>
                                    )}
                                </AnimatePresence>
                            </SidebarGroup>
                        </motion.div>
                    )
                })}
                
                {user?.role === 'superadmin' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <SidebarGroup className="mt-2 px-3 p-0">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname.startsWith('/admin')}
                                  tooltip="Painel Admin"
                                  onClick={handleMobileClick}
                                  className="h-11 w-full p-2 group transition-all duration-300 hover:bg-rose-950/10 data-[active=true]:bg-rose-950/20 rounded-xl outline-none"
                                  style={{ willChange: 'transform, opacity' }}
                                >
                                    <Link href="/admin/dashboard" className="flex items-center gap-3 w-full">
                                        <div className={cn(
                                          "relative h-8 w-8 shrink-0 flex items-center justify-center rounded-xl transition-all duration-500 overflow-hidden",
                                          pathname.startsWith('/admin')
                                            ? "bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20 scale-105"
                                            : "bg-slate-900/50 border border-white/5 text-rose-500 group-hover:border-rose-500/50"
                                        )}>
                                          <ShieldCheck className={cn(
                                            "h-4 w-4 transition-all duration-300 relative z-10",
                                            pathname.startsWith('/admin') ? "text-white" : "group-hover:scale-110"
                                          )} />
                                        </div>
                                        <span className={cn(
                                            "group-data-[state=expanded]:inline-flex hidden text-xs font-semibold tracking-wide transition-colors duration-300",
                                            pathname.startsWith('/admin') ? "text-slate-200" : "text-slate-400 group-hover:text-slate-200"
                                        )}>Painel Admin</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarGroup>
                    </motion.div>
                )}
            </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-3 mt-auto border-t border-white/5">
             <SidebarMenu>
                {/* Support and Admin as secondary links */}
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Apoio" className="text-slate-500 hover:text-slate-300 hover:bg-slate-900/30 h-8">
                        <Link href="/support" className="flex items-center gap-3">
                            <LifeBuoy className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Equipe de Suporte</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Main User Component at the bottom */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                    <div className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-900/40">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                            <Image 
                                src={user?.photoURL || "https://picsum.photos/seed/user/200"} 
                                alt="User" 
                                fill 
                                className="object-cover" 
                            />
                        </div>
                        <div className="flex-1 min-w-0 group-data-[state=collapsed]:hidden">
                            <p className="text-xs font-semibold text-slate-200 truncate">{user?.firstName || "Usuário"}</p>
                            <p className="text-[9px] text-slate-500 font-medium truncate uppercase tracking-wider">Assinante Premium</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between px-2 group-data-[state=collapsed]:hidden">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-900/50">
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                            <LogOut className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>;
}
