"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackStatisticsProps {
  title: boolean;
  description: boolean;
  introduction: boolean;
  modulesCount: number;
  totalModules: number;
  isPublished?: boolean;
}

const ACHIEVEMENTS = [
  { id: "title", name: "Título Definido", icon: "📝", description: "Dê um nome à sua trilha" },
  { id: "description", name: "Descrição Pronta", icon: "📄", description: "Escreva uma descrição atraente" },
  { id: "intro", name: "Introdução Completa", icon: "🎯", description: "Crie a introdução da trilha" },
  { id: "module1", name: "Primeiro Módulo", icon: "📚", description: "Adicione pelo menos um módulo" },
  { id: "modules3", name: "Trilha Completa", icon: "⭐", description: "Adicione 3 ou mais módulos" },
  { id: "published", name: "Publicada", icon: "🚀", description: "Trilha pronta para usuários" },
];

export function TrackStatistics({
  title,
  description,
  introduction,
  modulesCount,
  totalModules,
  isPublished = false,
}: TrackStatisticsProps) {
  const completionItems = [title, description, introduction, modulesCount > 0];
  const completedCount = completionItems.filter(Boolean).length;
  const completionPercentage = (completedCount / completionItems.length) * 100;

  const unlockedAchievements: string[] = [];
  if (title) unlockedAchievements.push("title");
  if (description) unlockedAchievements.push("description");
  if (introduction) unlockedAchievements.push("intro");
  if (modulesCount > 0) unlockedAchievements.push("module1");
  if (modulesCount >= 3) unlockedAchievements.push("modules3");
  if (isPublished) unlockedAchievements.push("published");

  return (
    <div className="space-y-4">
      {/* Completion Progress */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Progresso da Trilha
              </h3>
              <p className="text-xs text-muted-foreground">
                {completedCount} de {completionItems.length} etapas concluídas
              </p>
            </div>
            <div className="text-2xl font-bold text-primary">{Math.round(completionPercentage)}%</div>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </Card>

      {/* Checklist */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Checklist</h4>
        <div className="space-y-2">
          <ChecklistItem completed={title} label="✓ Título" />
          <ChecklistItem completed={description} label="✓ Descrição" />
          <ChecklistItem completed={introduction} label="✓ Introdução" />
          <ChecklistItem completed={modulesCount > 0} label={`✓ Módulos (${modulesCount})`} />
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Conquistas Desbloqueadas
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            return (
              <div
                key={achievement.id}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-center",
                  isUnlocked
                    ? "border-primary/50 bg-primary/5"
                    : "border-muted-foreground/20 bg-muted/20 opacity-50"
                )}
              >
                <div className="text-lg mb-1">{achievement.icon}</div>
                <p className="text-xs font-medium">{achievement.name}</p>
                {!isUnlocked && (
                  <Lock className="h-3 w-3 mx-auto mt-1 text-muted-foreground" />
                )}
                {isUnlocked && (
                  <CheckCircle2 className="h-3 w-3 mx-auto mt-1 text-primary" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modules Counter */}
      {modulesCount > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Módulos: {modulesCount}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {modulesCount < 3
                  ? `Adicione ${3 - modulesCount} mais para uma trilha completa`
                  : "Sua trilha está com uma estrutura excelente! 🎉"}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {modulesCount >= 3 ? "Completa" : "Em progresso"}
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}

function ChecklistItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
      <div
        className={cn(
          "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          completed
            ? "border-primary bg-primary"
            : "border-muted-foreground/40"
        )}
      >
        {completed && <CheckCircle2 className="h-3 w-3 text-white" />}
      </div>
      <span className={cn("text-sm", completed ? "text-foreground font-medium" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}
