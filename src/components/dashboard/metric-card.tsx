import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  detail,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900 p-5",
        className,
      )}
    >
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400",
              trend === "flat" && "text-zinc-500",
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "flat" && <Minus className="h-3 w-3" />}
            {trendValue}
          </span>
        )}
        {detail && (
          <span className="text-xs text-zinc-500">{detail}</span>
        )}
      </div>
    </div>
  );
}
