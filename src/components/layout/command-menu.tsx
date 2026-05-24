"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Compass, BookOpen, Settings, LayoutDashboard, Landmark, CreditCard, Award, Plus, Calendar, ShieldAlert } from "lucide-react";
import { useUser } from "@/firebase";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { AddDebtSheet } from "@/components/debts/add-debt-sheet";
import { AddGoalSheet } from "@/components/goals/add-goal-sheet";
import { incomeCategories, expenseCategories } from "@/lib/types";

interface CommandItem {
  id: string;
  title: string;
  category: "Navegação" | "Ações Rápidas" | "Admin";
  icon: any;
  action: () => void;
}

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState<"income" | "expense" | "debt" | "goal" | null>(null);
  
  const router = useRouter();
  const { user } = useUser();

  const handleCloseSheet = () => setActiveSheet(null);

  // Define commands
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav_dashboard",
      title: "Ir para o Dashboard",
      category: "Navegação",
      icon: LayoutDashboard,
      action: () => { router.push("/dashboard"); setIsOpen(false); }
    },
    {
      id: "nav_incomes",
      title: "Ir para Receitas",
      category: "Navegação",
      icon: Plus,
      action: () => { router.push("/income"); setIsOpen(false); }
    },
    {
      id: "nav_expenses",
      title: "Ir para Despesas",
      category: "Navegação",
      icon: Calendar,
      action: () => { router.push("/expenses"); setIsOpen(false); }
    },
    {
      id: "nav_credit_cards",
      title: "Ir para Cartões de Crédito",
      category: "Navegação",
      icon: CreditCard,
      action: () => { router.push("/credit-cards"); setIsOpen(false); }
    },
    {
      id: "nav_debts",
      title: "Ir para Dívidas",
      category: "Navegação",
      icon: Landmark,
      action: () => { router.push("/debts"); setIsOpen(false); }
    },
    {
      id: "nav_goals",
      title: "Ir para Metas e Objetivos",
      category: "Navegação",
      icon: Award,
      action: () => { router.push("/goals"); setIsOpen(false); }
    },
    {
      id: "nav_education",
      title: "Ir para Jornada de Educação",
      category: "Navegação",
      icon: BookOpen,
      action: () => { router.push("/education"); setIsOpen(false); }
    },
    {
      id: "nav_profile",
      title: "Ir para o Perfil de Usuário",
      category: "Navegação",
      icon: Settings,
      action: () => { router.push("/profile"); setIsOpen(false); }
    },
    // Quick Actions
    {
      id: "action_add_income",
      title: "Registrar Nova Receita (+)",
      category: "Ações Rápidas",
      icon: Plus,
      action: () => { setActiveSheet("income"); setIsOpen(false); }
    },
    {
      id: "action_add_expense",
      title: "Registrar Nova Despesa (-)",
      category: "Ações Rápidas",
      icon: Calendar,
      action: () => { setActiveSheet("expense"); setIsOpen(false); }
    },
    {
      id: "action_add_debt",
      title: "Registrar Nova Dívida",
      category: "Ações Rápidas",
      icon: Landmark,
      action: () => { setActiveSheet("debt"); setIsOpen(false); }
    },
    {
      id: "action_add_goal",
      title: "Registrar Nova Meta de Economia",
      category: "Ações Rápidas",
      icon: Award,
      action: () => { setActiveSheet("goal"); setIsOpen(false); }
    },
  ];

  // Admin section
  if (user?.role === "superadmin") {
    commands.push(
      {
        id: "admin_dashboard",
        title: "Ir para Painel Administrativo",
        category: "Admin",
        icon: ShieldAlert,
        action: () => { router.push("/admin/dashboard"); setIsOpen(false); }
      },
      {
        id: "admin_tracks",
        title: "Gerenciar Trilhas Educacionais",
        category: "Admin",
        icon: BookOpen,
        action: () => { router.push("/admin/education"); setIsOpen(false); }
      }
    );
  }

  // Filter commands
  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Navigate through list with keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <>
      {/* Sheets triggered globally */}
      <AddTransactionSheet 
        isOpen={activeSheet === "income" || activeSheet === "expense"} 
        onClose={handleCloseSheet} 
        transactionType={activeSheet as "income" | "expense"} 
        categories={activeSheet === "income" ? incomeCategories : expenseCategories} 
      />
      <AddDebtSheet isOpen={activeSheet === "debt"} onClose={handleCloseSheet} />
      <AddGoalSheet isOpen={activeSheet === "goal"} onClose={handleCloseSheet} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-slate-900/95 border-blue-500/20 text-white backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center border-b border-slate-800/80 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400 mr-3" />
            <Input
              placeholder="Digite um comando ou navegação... (Ex: 'Despesa' ou 'Metas')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-0 outline-none focus-visible:ring-0 text-white placeholder:text-slate-500 w-full text-base h-auto py-1 p-0"
              autoFocus
            />
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
              <span>ESC</span>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[350px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <Compass className="h-8 w-8 text-slate-500 mb-2 animate-pulse" />
                <p className="text-sm">Nenhum resultado encontrado para &quot;{search}&quot;</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group items by category */}
                {["Ações Rápidas", "Navegação", "Admin"].map((cat) => {
                  const items = filtered.filter((i) => i.category === cat);
                  if (items.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-400/80 tracking-wider uppercase px-3 block mb-1">
                        {cat}
                      </span>
                      {items.map((item) => {
                        const Icon = item.icon;
                        // Find global index in filtered list
                        const globalIndex = filtered.findIndex((f) => f.id === item.id);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <div
                            key={item.id}
                            onClick={() => item.action()}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/10 scale-[1.01]"
                                : "hover:bg-slate-800/50 text-slate-300 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/10" : "bg-slate-800"}`}>
                                <Icon className="h-4 w-4 text-inherit" />
                              </div>
                              <span className="text-sm font-medium">{item.title}</span>
                            </div>
                            {isSelected && (
                              <div className="text-[10px] font-mono bg-white/20 px-1 py-0.5 rounded text-white font-semibold">
                                ENTER
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="flex items-center justify-between bg-slate-950/40 px-4 py-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-700/50 px-1 rounded">↑↓</kbd> Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-700/50 px-1 rounded">Enter</kbd> Selecionar
              </span>
            </div>
            <span className="flex items-center gap-1">
              Atalho global: <kbd className="bg-slate-800 border border-slate-700/50 px-1.5 rounded">Ctrl + K</kbd>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
