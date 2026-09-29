import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "waste" | "secondary";
}

export function Badge({
  className,
  variant = "primary",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-primary-light text-primary border border-primary/20",
    accent: "bg-accent-light text-accent border border-accent/20",
    waste: "bg-circular-waste-light text-circular-waste border border-circular-waste/20",
    secondary: "bg-surface-subtle text-secondary border border-border",
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
