"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  type?: string;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
  rightElement?: React.ReactNode;
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      label,
      type = "text",
      error,
      helperText,
      isPassword = false,
      rightElement,
      className,
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      placeholder,
      onAnimationStart,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    // Hubungkan forwarded ref dengan internal ref
    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

    const [focused, setFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [isAutofilled, setIsAutofilled] = React.useState(false);

    // Deteksi awal apakah input memiliki nilai dari prop
    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : defaultValue !== undefined
        ? String(defaultValue).length > 0
        : false;

    const [hasText, setHasText] = React.useState(hasValue);

    // Sinkronkan nilai DOM dengan state dan notifikasi parent bila browser mengisi via autofill
    const checkSync = React.useCallback(() => {
      if (!internalRef.current) return;
      const el = internalRef.current;
      const domVal = el.value || "";
      const hasDomVal = domVal.length > 0;

      let autofilled = false;
      try {
        autofilled =
          el.matches(":-webkit-autofill") ||
          el.matches(":autofill") ||
          el.matches(":-moz-autofill");
      } catch {
        // Fallback untuk browser yang tidak mendukung selector matches pseudo-class
      }

      if (hasDomVal || autofilled) {
        setHasText(true);
        setIsAutofilled(true);

        // Jika DOM memiliki nilai autofill tapi state parent belum tersinkron
        if (domVal && domVal !== value && onChange) {
          const syntheticEvent = {
            target: el,
            currentTarget: el,
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      } else if (!value && !defaultValue) {
        setHasText(false);
        setIsAutofilled(false);
      }
    }, [value, defaultValue, onChange]);

    // Pantau perubahan prop value
    React.useEffect(() => {
      if (value !== undefined) {
        setHasText(String(value).length > 0);
      }
    }, [value]);

    // Timer interval sinkronisasi saat pertama kali mount (untuk mengantisipasi delay autofill browser)
    React.useEffect(() => {
      checkSync();
      const t1 = setTimeout(checkSync, 50);
      const t2 = setTimeout(checkSync, 200);
      const t3 = setTimeout(checkSync, 600);
      const t4 = setTimeout(checkSync, 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }, [checkSync]);

    const isFloating = focused || hasText || isAutofilled;
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full flex flex-col gap-1 text-left font-sans group">
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={internalRef}
            type={inputType}
            value={value}
            defaultValue={defaultValue}
            placeholder={focused ? placeholder || " " : " "}
            data-slot="floating-input"
            aria-invalid={Boolean(error)}
            onAnimationStart={(e) => {
              if (
                e.animationName.includes("onAutoFillStart") ||
                e.animationName.toLowerCase().includes("autofill")
              ) {
                setIsAutofilled(true);
                setHasText(true);
                checkSync();
              } else if (e.animationName.includes("onAutoFillCancel")) {
                setIsAutofilled(false);
                checkSync();
              }
              onAnimationStart?.(e);
            }}
            onFocus={(e) => {
              setFocused(true);
              checkSync();
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              setHasText(e.target.value !== "");
              checkSync();
              onBlur?.(e);
            }}
            onChange={(e) => {
              setHasText(e.target.value !== "");
              onChange?.(e);
            }}
            className={cn(
              "peer w-full h-[52px] px-3.5 pt-3.5 pb-1 rounded-xl border text-sm bg-surface text-text-primary outline-none transition-all duration-150 shadow-elevation-1",
              error
                ? "border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-red-50/15"
                : "border-border hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/20",
              isPassword || rightElement ? "pr-12" : "",
              className
            )}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-3.5 transition-all duration-150 pointer-events-none select-none z-10",
              isFloating
                ? "-top-2.5 left-2.5 px-1.5 text-xs font-semibold bg-surface rounded"
                : "top-3.5 text-sm font-normal text-text-muted",
              error
                ? "text-error"
                : focused
                ? "text-primary font-semibold"
                : isFloating
                ? "text-text-secondary"
                : "text-text-muted",
              // Fallback CSS murni untuk browser native autofill jika render delay
              "peer-autofill:-top-2.5 peer-autofill:left-2.5 peer-autofill:px-1.5 peer-autofill:text-xs peer-autofill:font-semibold peer-autofill:bg-surface peer-autofill:text-text-secondary",
              "peer-focus:-top-2.5 peer-focus:left-2.5 peer-focus:px-1.5 peer-focus:text-xs peer-focus:font-semibold peer-focus:bg-surface",
              !error && "peer-focus:text-primary",
              "peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:bg-surface"
            )}
          >
            {label}
          </label>

          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-95 z-20"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          ) : rightElement ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center z-20">
              {rightElement}
            </div>
          ) : null}
        </div>

        {error && (
          <p className="text-xs text-error font-medium pl-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-text-muted pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
