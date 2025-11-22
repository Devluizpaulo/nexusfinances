import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
};

export function KpiCard({ title, value, icon: Icon, description }: KpiCardProps) {
  return (
    <Card className="h-full bg-slate-50/80 shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-slate-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </CardContent>
    </Card>
  );
}
