import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  badgeLabel?: string;
  badgeVariant?: "primary" | "accent" | "waste" | "secondary" | "success" | "warning";
  icon?: React.ReactNode;
  trend?: string;
}

export function StatCard({
  className,
  title,
  value,
  unit,
  description,
  badgeLabel,
  badgeVariant = "primary",
  icon,
  trend,
  ...props
}: StatCardProps) {
  const badgeStyles = {
    primary: "bg-primary-light text-primary border-primary/20",
    accent: "bg-accent-light text-accent border-accent/20",
    waste: "bg-circular-waste-light text-circular-waste border-circular-waste/20",
    secondary: "bg-surface-subtle text-secondary border-border",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
  };

  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border p-5 shadow-elevation-1 transition-all duration-200 hover:border-border-strong flex flex-col justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-xs font-semibold text-text-secondary">
          {title}
        </span>
        {badgeLabel && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-bold",
              badgeStyles[badgeVariant]
            )}
          >
            {icon}
            {badgeLabel}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="font-sans text-xs sm:text-sm font-semibold text-text-muted">
              {unit}
            </span>
          )}
        </div>
        <p className="font-sans text-xs text-text-secondary leading-relaxed text-pretty">
          {description}
        </p>
      </div>

      {trend && (
        <div className="pt-2 border-t border-border/80 text-[11px] font-medium text-text-muted flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
