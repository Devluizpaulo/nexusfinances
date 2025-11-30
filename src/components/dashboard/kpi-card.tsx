import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
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
    ? 'text-muted-foreground'
    : (trend > 0 && !invertTrendColor) || (trend < 0 && invertTrendColor)
      ? 'text-emerald-500'
      : 'text-destructive';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {hasTrend && (
            <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
