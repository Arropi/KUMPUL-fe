import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, rightElement, type, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            type={type}
            data-slot="input"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-surface text-text-primary placeholder:text-text-muted transition-all duration-150 shadow-elevation-1 outline-none",
              "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              error
                ? "border-error focus-visible:ring-error/20 focus-visible:border-error bg-red-50/20"
                : "border-border hover:border-border-strong",
              rightElement ? "pr-11" : "",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center pointer-events-none">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-error font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
