
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { type ElementType } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  icon: ElementType;
  description?: string;
  trend?: number;
  invertTrendColor?: boolean;
};

export function KpiCard({ title, value, icon: Icon, description, trend, invertTrendColor = false }: KpiCardProps) {
  const hasTrend = typeof trend === 'number';
  
  const TrendIcon = !hasTrend || trend === 0 
    ? Minus 
    : trend > 0 ? ArrowUpRight : ArrowDownRight;
  
  const trendColor = !hasTrend || trend === 0
    ? 'text-slate-500'
    : (trend > 0 && !invertTrendColor) || (trend < 0 && invertTrendColor)
      ? 'text-emerald-400'
      : 'text-rose-400';

  return (
    <Card className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] transition-all hover:shadow-lg hover:border-slate-800/60 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
         <div className="flex items-center justify-between text-xs text-slate-500">
            {description && <p>{description}</p>}
            {hasTrend && (
                <div className={cn("flex items-center gap-1", trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
