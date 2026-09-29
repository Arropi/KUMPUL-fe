import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "primary"
    | "accent"
    | "waste"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "neutral";
}

function Badge({
  className,
  variant = "primary",
  children,
  ...props
}: BadgeProps) {
  // Watermelon UI badge base styles: rounded-full, whitespace-nowrap, inline-flex
  const baseStyles =
    "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 gap-1.5 transition-all select-none";

  const variantStyles = {
    primary: "bg-[#EBF5F0] text-[#0D3B2E] border-[#0D3B2E]/20",
    accent: "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/20",
    waste: "bg-[#E8F5E9] text-[#2D6A4F] border-[#2D6A4F]/20",
    secondary: "bg-neutral-100 text-neutral-700 border-neutral-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-900 border-amber-200/80",
    info: "bg-blue-50 text-blue-800 border-blue-200/80",
    neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };

  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
