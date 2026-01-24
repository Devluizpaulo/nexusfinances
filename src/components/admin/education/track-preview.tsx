"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackPreviewProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  modulesCount: number;
}

export function TrackPreview({
  title,
  description,
  icon,
  color,
  bgColor,
  borderColor,
  modulesCount,
}: TrackPreviewProps) {
  const iconKey = icon as unknown as keyof typeof LucideIcons;
  const Icon = (LucideIcons as any)[iconKey] || LucideIcons.HelpCircle;

  if (!title || !description) {
    return (
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Preencha o título e a descrição para ver a prévia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">PRÉVIA DO CARD</p>
      <Card
        className={cn(
          "flex flex-col overflow-hidden border-2 transition-all hover:shadow-md",
          borderColor
        )}
      >
        <CardHeader
          className={cn("flex flex-row items-start justify-between space-y-0", bgColor)}
        >
          <div className="flex-grow">
            <CardTitle className="text-base font-bold">{title}</CardTitle>
          </div>
          <Icon className={cn("h-6 w-6 shrink-0", color)} />
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {modulesCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {modulesCount} módulo{modulesCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
