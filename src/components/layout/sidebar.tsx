
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
      className="bg-slate-950 border-r border-slate-900/80 text-slate-200"
    >
        <SidebarHeader>
            <Button
              variant="ghost"
              className="h-12 justify-center items-center p-2 w-full hover:bg-slate-900/70"
              asChild
            >
                <Link href="/dashboard">
                    <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/70">
                        <Image src="/images/xoplanilhas_logo.png" alt="Logo Xô Planilhas" width={32} height={32} />
                    </div>
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
                                className="text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 data-[active=true]:bg-slate-900 data-[active=true]:text-slate-50 data-[active=true]:border-l-2 data-[active=true]:border-emerald-400"
                            >
                                <Link href={section.href}>
                                    <section.icon className="h-4 w-4 shrink-0" />
                                    <span className="group-data-[state=expanded]:inline-flex hidden font-medium tracking-wide">
                                      {section.label}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {isActiveSection && section.subItems && section.subItems.length > 0 && (
                             <SidebarMenuSub>
                                {section.subItems.map(subItem => (
                                    <SidebarMenuSubItem key={subItem.href}>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={pathname === subItem.href}
                                          onClick={handleMobileClick}
                                          className="text-xs text-slate-500 hover:text-slate-100 hover:bg-slate-900/60 data-[active=true]:text-emerald-300 data-[active=true]:bg-slate-900/80"
                                        >
                                             <Link href={subItem.href}>
                                                <subItem.icon className="h-3.5 w-3.5 shrink-0" />
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
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith('/admin')}
                          tooltip="Painel Admin"
                          onClick={handleMobileClick}
                          className="text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 data-[active=true]:bg-slate-900 data-[active=true]:text-slate-50 data-[active=true]:border-l-2 data-[active=true]:border-rose-500"
                        >
                            <Link href="/admin/dashboard">
                                <ShieldCheck className="text-destructive shrink-0" />
                                <span className="group-data-[state=expanded]:inline-flex hidden font-medium tracking-wide">Painel Admin</span>
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
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(item.href)}
                          tooltip={item.label}
                          onClick={handleMobileClick}
                          className="text-sm text-slate-500 hover:text-slate-100 hover:bg-slate-900/70 data-[active=true]:bg-slate-900 data-[active=true]:text-slate-50"
                        >
                            <Link href={item.href}>
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="group-data-[state=expanded]:inline-flex hidden font-medium tracking-wide">{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 ))}
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
}
