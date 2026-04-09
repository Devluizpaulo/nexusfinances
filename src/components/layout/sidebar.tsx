
'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator, SidebarGroup, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarContent } from '@/components/ui/sidebar';
import { ShieldCheck, LifeBuoy, Search, Bell, Plus, Settings, LogOut, User } from 'lucide-react';
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
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 border-r border-slate-800/50 text-slate-200 shadow-2xl"
    >
        <SidebarHeader className="py-6 px-4 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between group-data-[state=collapsed]:justify-center">
                <Link href="/dashboard" className="flex items-center gap-2 group/logo outline-none">
                    <div className="relative h-8 w-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                        <Image src="/images/xoplanilhas_logo.png" alt="Logo" fill className="object-contain p-1" />
                    </div>
                    <span className="font-bold text-lg tracking-tight group-data-[state=collapsed]:hidden bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">Xô Planilhas</span>
                </Link>
                <div className="group-data-[state=collapsed]:hidden flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                        <Bell className="h-4 w-4" />
                     </Button>
                </div>
            </div>

            {/* Quick Search Bar */}
            <div className="group-data-[state=collapsed]:hidden relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Busca rápida..." 
                    className="w-full h-10 bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
            </div>
        </SidebarHeader>
        
        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden pt-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
            <SidebarMenu className="px-4 space-y-2">
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
                                        className="h-12 w-full p-2 group transition-all duration-300 hover:bg-slate-900/50 data-[active=true]:bg-slate-900/70 rounded-xl outline-none"
                                    >
                                        <Link href={section.href} className="flex items-center gap-3 w-full">
                                            <div className={cn(
                                              "relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-all duration-500 overflow-hidden",
                                              isActiveSection 
                                                ? `bg-gradient-to-br ${sectionColor} shadow-lg shadow-primary/20 scale-105` 
                                                : "bg-slate-900 border border-slate-800/80 text-slate-400 group-hover:border-slate-700 group-hover:text-slate-100"
                                            )}>
                                              {/* Shine effect for active item */}
                                              {isActiveSection && (
                                                  <motion.div 
                                                    className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"
                                                    animate={{ x: [-100, 100] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                  />
                                              )}
                                              <section.icon className={cn(
                                                "h-5 w-5 transition-all duration-300 relative z-10",
                                                isActiveSection ? "text-white" : "group-hover:scale-110"
                                              )} />
                                            </div>
                                            
                                            <span className={cn(
                                                "group-data-[state=expanded]:inline-flex hidden text-sm font-semibold tracking-wide transition-colors duration-300",
                                                isActiveSection ? "text-slate-50" : "text-slate-400 group-hover:text-slate-100"
                                            )}>
                                              {section.label}
                                            </span>

                                            {isActiveSection && (
                                                <motion.div 
                                                    layoutId="activeIndicator"
                                                    className="absolute right-0 w-1 h-6 bg-primary rounded-full blur-[1px]" 
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
                                            className="ml-6 mt-1 mb-2 border-l border-slate-800/60 flex flex-col gap-1 pl-4"
                                         >
                                            {section.subItems.map(subItem => (
                                                <SidebarMenuSubItem key={subItem.href}>
                                                    <SidebarMenuSubButton
                                                      asChild
                                                      isActive={pathname === subItem.href}
                                                      onClick={handleMobileClick}
                                                      className="h-9 text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-900/30 data-[active=true]:text-primary data-[active=true]:font-medium rounded-lg transition-all duration-200"
                                                    >
                                                         <Link href={subItem.href} className="flex items-center gap-2">
                                                            <subItem.icon className="h-3.5 w-3.5 shrink-0" />
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
                        <SidebarGroup className="mt-4 px-4 p-0">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname.startsWith('/admin')}
                                  tooltip="Painel Admin"
                                  onClick={handleMobileClick}
                                  className="h-12 w-full p-2 group transition-all duration-300 hover:bg-rose-950/20 data-[active=true]:bg-rose-950/40 rounded-xl outline-none"
                                >
                                    <Link href="/admin/dashboard" className="flex items-center gap-3 w-full">
                                        <div className={cn(
                                          "relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-all duration-500 overflow-hidden",
                                          pathname.startsWith('/admin')
                                            ? "bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20 scale-105"
                                            : "bg-slate-900 border border-slate-800/80 text-rose-500 group-hover:border-rose-500/50"
                                        )}>
                                          <ShieldCheck className={cn(
                                            "h-5 w-5 transition-all duration-300 relative z-10",
                                            pathname.startsWith('/admin') ? "text-white" : "group-hover:scale-110"
                                          )} />
                                        </div>
                                        <span className={cn(
                                            "group-data-[state=expanded]:inline-flex hidden text-sm font-semibold tracking-wide transition-colors duration-300",
                                            pathname.startsWith('/admin') ? "text-slate-50" : "text-slate-400 group-hover:text-slate-100"
                                        )}>Painel Admin</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarGroup>
                    </motion.div>
                )}
            </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 mt-auto border-t border-slate-900">
             <SidebarMenu>
                {/* Support and Admin as secondary links */}
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Apoio" className="text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 h-9">
                        <Link href="/support" className="flex items-center gap-3">
                            <LifeBuoy className="h-4 w-4" />
                            <span className="text-sm font-medium">Equipe de Suporte</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Main User Component at the bottom */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900/50 transition-colors cursor-pointer group">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-800 group-hover:border-primary/50 transition-colors">
                            <Image 
                                src={user?.photoURL || "https://picsum.photos/seed/user/200"} 
                                alt="User" 
                                fill 
                                className="object-cover" 
                            />
                        </div>
                        <div className="flex-1 min-w-0 group-data-[state=collapsed]:hidden">
                            <p className="text-sm font-semibold text-slate-200 truncate">{user?.firstName || "Usuário"}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tight">Assinante Premium</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between px-2 group-data-[state=collapsed]:hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-900">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
}
