import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-heading font-semibold transition-all duration-150 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none select-none cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0D3B2E] text-white font-bold border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.25),0_4px_14px_rgba(13,59,46,0.32)] hover:bg-[#145A46] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_20px_rgba(13,59,46,0.42)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]",
        primary:
          "bg-[#0D3B2E] text-white font-bold border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.25),0_4px_14px_rgba(13,59,46,0.32)] hover:bg-[#145A46] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_20px_rgba(13,59,46,0.42)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]",
        blue:
          "bg-[#2563EB] text-white font-bold border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.18),0_4px_16px_rgba(37,99,235,0.35)] hover:bg-[#1D4ED8] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_22px_rgba(37,99,235,0.45)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
        secondary:
          "bg-white text-slate-900 font-bold border border-[#E2E8F0] shadow-[inset_0_1px_0_#FFFFFF,inset_0_-2px_0_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08)] hover:bg-[#F8FAFC] hover:text-[#0D3B2E] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_#FFFFFF,0_6px_22px_rgba(0,0,0,0.12)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]",
        outline:
          "bg-surface text-text-primary font-semibold border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)] hover:bg-surface-subtle hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]",
        soft:
          "bg-[#EBF5F0] text-primary font-bold border border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(13,59,46,0.08)] hover:bg-[#DBECE3] hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_12px_rgba(13,59,46,0.14)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(13,59,46,0.18)]",
        "soft-blue":
          "bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(37,99,235,0.08)] hover:bg-[#DBEAFE] hover:border-[#93C5FD] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_12px_rgba(37,99,235,0.14)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(37,99,235,0.2)]",
        glass:
          "bg-white/12 text-white font-bold border border-white/25 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_6px_rgba(0,0,0,0.1)] hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_12px_rgba(0,0,0,0.15)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
        accent:
          "bg-gradient-to-b from-[#D97706] to-[#B45309] text-white font-bold border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.2),0_4px_14px_rgba(180,83,9,0.3)] hover:brightness-105 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_20px_rgba(180,83,9,0.4)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
        destructive:
          "bg-[#8B1E1E] text-white font-bold border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.25),0_4px_14px_rgba(139,30,30,0.32)] hover:bg-[#731919] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_20px_rgba(139,30,30,0.42)] active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]",
        ghost:
          "bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary shadow-none active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline shadow-none p-0 h-auto",
      },
      size: {
        default: "min-h-[44px] px-5 py-2.5",
        md: "min-h-[44px] px-5 py-2.5",
        sm: "min-h-[38px] rounded-xl gap-1.5 px-3.5 py-1.5 text-xs font-semibold",
        lg: "min-h-[48px] px-7 py-3 text-[15px] font-bold",
        icon: "size-11 p-0 rounded-xl",
        "icon-sm": "size-9 p-0 rounded-xl",
        "icon-lg": "size-12 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin size-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Memproses...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
