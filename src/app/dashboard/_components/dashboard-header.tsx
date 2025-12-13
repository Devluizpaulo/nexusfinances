'use client';

import { useUser } from "@/firebase";
import { useDashboardDate } from "@/context/dashboard-date-context";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import * as LucideIcons from 'lucide-react';

export function DashboardHeader() {
    const { user } = useUser();
    const { selectedDate, setSelectedDate } = useDashboardDate();

    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Olá';
        return `Olá, ${displayName.split(' ')[0]}!`;
    }

    const Icon = user?.avatar?.icon ? (LucideIcons as any)[user.avatar.icon] || LucideIcons.User : LucideIcons.User;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
                 <Avatar className="h-12 w-12">
                    {user?.photoURL ? (
                        <AvatarImage src={user.photoURL} alt="Avatar do usuário"/>
                    ) : user?.avatar ? (
                        <div className={cn("flex h-full w-full items-center justify-center rounded-full text-white", user.avatar.bgColor)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    ) : (
                        <AvatarFallback>{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    )}
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">{getFirstName(user?.displayName)}</h1>
                    <p className="text-sm text-slate-400">Aqui está seu resumo financeiro.</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/80 p-1 shadow-inner">
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-100 transition-all duration-200" 
                    onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                    title="Mês anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[120px] text-center">
                    <span className="text-sm font-semibold text-slate-100 capitalize">
                        {format(selectedDate, "MMMM", { locale: ptBR })}
                    </span>
                    <div className="text-xs text-slate-500">
                        {format(selectedDate, "yyyy", { locale: ptBR })}
                    </div>
                </div>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-100 transition-all duration-200" 
                    onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                    title="Próximo mês"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
