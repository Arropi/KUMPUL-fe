import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, rightElement, ...props }, ref) => {
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
            className="text-xs font-semibold text-neutral-800 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border text-sm bg-neutral-50/50 text-neutral-900 placeholder:text-neutral-400 transition-all duration-150 shadow-xs",
              "focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 focus:border-[#0D3B2E] focus:bg-white focus:shadow-sm",
              error
                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/20"
                : "border-neutral-200 hover:border-neutral-300",
              rightElement ? "pr-11" : "",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
