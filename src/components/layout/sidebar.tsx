
'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarSeparator, SidebarGroup, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';
import { ShieldCheck, LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import Image from 'next/image';
import { navSections } from '@/lib/nav-config';

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
        <SidebarHeader className="py-6 flex-shrink-0">
            <Button
              variant="ghost"
              className="h-36 justify-center items-center p-4 w-full hover:bg-slate-900/70 transition-all duration-300 group"
              asChild
            >
                <Link href="/dashboard">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-lg group-hover:shadow-primary/20 group-hover:border-primary/30 transition-all duration-300 group-hover:scale-105">
                        <Image 
                          src="/images/xoplanilhas_logo.png" 
                          alt="Logo Xô Planilhas" 
                          width={140} 
                          height={140}
                          className="group-hover:brightness-110 transition-all duration-300"
                        />
                    </div>
                </Link>
            </Button>
        </SidebarHeader>
        
        <SidebarMenu className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-700/50">
            {navSections.map((section) => {
                const isActiveSection = pathname === section.href || (section.href !== '/dashboard' && pathname.startsWith(section.href));
                return (
                    <SidebarGroup key={section.href} className="space-y-1">
                        <SidebarMenuItem>
                             <SidebarMenuButton 
                                asChild 
                                isActive={isActiveSection}
                                tooltip={section.label} 
                                onClick={handleMobileClick}
                                className="h-12 text-base text-slate-400 hover:text-slate-50 hover:bg-slate-800/60 data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-transparent data-[active=true]:text-slate-50 data-[active=true]:border-l-4 data-[active=true]:border-primary data-[active=true]:shadow-lg data-[active=true]:shadow-primary/10 transition-all duration-300 rounded-lg group"
                            >
                                <Link href={section.href} className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg transition-all duration-300",
                                      isActiveSection 
                                        ? "bg-primary/20 text-primary shadow-lg shadow-primary/20" 
                                        : "bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/60 group-hover:text-slate-200"
                                    )}>
                                      <section.icon className="h-5 w-5 shrink-0" />
                                    </div>
                                    <span className="group-data-[state=expanded]:inline-flex hidden font-semibold tracking-wide">
                                      {section.label}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {isActiveSection && section.subItems && section.subItems.length > 0 && (
                             <SidebarMenuSub className="ml-4 space-y-1 border-l-2 border-slate-800 pl-2">
                                {section.subItems.map(subItem => (
                                    <SidebarMenuSubItem key={subItem.href}>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={pathname === subItem.href}
                                          onClick={handleMobileClick}
                                          className="h-10 text-sm text-slate-500 hover:text-slate-100 hover:bg-slate-800/50 data-[active=true]:text-primary data-[active=true]:bg-primary/10 data-[active=true]:font-medium rounded-lg transition-all duration-200"
                                        >
                                             <Link href={subItem.href} className="flex items-center gap-2">
                                                <subItem.icon className="h-4 w-4 shrink-0" />
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
                <SidebarGroup className="mt-4">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith('/admin')}
                          tooltip="Painel Admin"
                          onClick={handleMobileClick}
                          className="h-12 text-base text-slate-400 hover:text-slate-50 hover:bg-rose-900/20 data-[active=true]:bg-gradient-to-r data-[active=true]:from-rose-500/20 data-[active=true]:to-transparent data-[active=true]:text-slate-50 data-[active=true]:border-l-4 data-[active=true]:border-rose-500 data-[active=true]:shadow-lg data-[active=true]:shadow-rose-500/10 transition-all duration-300 rounded-lg group"
                        >
                            <Link href="/admin/dashboard" className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all duration-300",
                                  pathname.startsWith('/admin')
                                    ? "bg-rose-500/20 text-rose-400 shadow-lg shadow-rose-500/20"
                                    : "bg-slate-800/50 text-rose-500 group-hover:bg-rose-900/20"
                                )}>
                                  <ShieldCheck className="h-5 w-5 shrink-0" />
                                </div>
                                <span className="group-data-[state=expanded]:inline-flex hidden font-semibold tracking-wide">Painel Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>
            )}
        </SidebarMenu>
        
        <SidebarFooter className="px-2 pb-4 flex-shrink-0">
            <SidebarSeparator className="bg-slate-800/50 my-2" />
            <SidebarMenu className="space-y-1">
                 {bottomMenuItems.map(item => (
                     <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(item.href)}
                          tooltip={item.label}
                          onClick={handleMobileClick}
                          className="h-12 text-base text-slate-500 hover:text-slate-100 hover:bg-slate-800/60 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500/20 data-[active=true]:to-transparent data-[active=true]:text-slate-50 data-[active=true]:border-l-4 data-[active=true]:border-blue-500 transition-all duration-300 rounded-lg group"
                        >
                            <Link href={item.href} className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all duration-300",
                                  pathname.startsWith(item.href)
                                    ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                                    : "bg-slate-800/50 text-slate-500 group-hover:bg-slate-700/60 group-hover:text-slate-300"
                                )}>
                                  <item.icon className="h-5 w-5 shrink-0" />
                                </div>
                                <span className="group-data-[state=expanded]:inline-flex hidden font-semibold tracking-wide">{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 ))}
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
}
