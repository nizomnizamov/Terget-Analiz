import {
  BadgeDollarSign,
  CircleDollarSign,
  MousePointerClick,
  Percent,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { KpiMetric } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = {
  spend: BadgeDollarSign,
  leads: Users,
  qualified: MousePointerClick,
  sales: ShoppingBag,
  revenue: CircleDollarSign,
  cpl: TrendingDown,
  cpa: TrendingDown,
  roas: TrendingUp,
  conversion: Percent
};

const statusClasses = {
  good: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300",
  neutral: "text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300",
  warning: "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300",
  bad: "text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300"
};

export function MetricCard({ metric }: { metric: KpiMetric }) {
  const Icon = icons[metric.key as keyof typeof icons] ?? TrendingUp;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-muted-foreground">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal">{metric.value}</p>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", statusClasses[metric.status])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={metric.change >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
          {metric.change >= 0 ? "+" : ""}
          {metric.change}%
        </span>
        <span className="text-muted-foreground">oldingi davrga nisbatan</span>
      </div>
    </Card>
  );
}
