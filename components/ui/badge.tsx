import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "waste" | "secondary" | "success" | "warning" | "info" | "neutral";
}

export function Badge({
  className,
  variant = "primary",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-[#EBF5F0] text-[#0D3B2E] border border-[#0D3B2E]/20",
    accent: "bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20",
    waste: "bg-[#E8F5E9] text-[#2D6A4F] border border-[#2D6A4F]/20",
    secondary: "bg-neutral-100 text-neutral-700 border border-neutral-200",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
    warning: "bg-amber-50 text-amber-900 border border-amber-200/80",
    info: "bg-blue-50 text-blue-800 border border-blue-200/80",
    neutral: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-label-caps font-semibold select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
