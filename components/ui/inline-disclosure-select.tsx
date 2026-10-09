"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisclosureOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}

interface InlineDisclosureSelectProps {
  id?: string;
  label: string;
  options: (string | DisclosureOption)[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

const springTransition: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.3,
};

export function InlineDisclosureSelect({
  id,
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Pilih salah satu...",
  className,
}: InlineDisclosureSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  // Normalisasi options menjadi format DisclosureOption[]
  const normalizedOptions: DisclosureOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Cari opsi aktif
  const selectedOption = normalizedOptions.find((opt) => opt.value === value || opt.label === value);

  // Tutup dropdown saat klik di luar container
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {/* Trigger Button dengan Floating Label Serasi */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full h-[52px] rounded-2xl border px-3.5 pt-4 pb-1 text-left transition-all duration-150 flex items-center justify-between cursor-pointer select-none",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen ? "border-primary ring-2 ring-primary/20 bg-surface shadow-xs" : "bg-surface hover:bg-surface-raised",
          error ? "border-error focus:ring-error/20" : "border-border"
        )}
      >
        {/* Floating Label */}
        <span
          className={cn(
            "pointer-events-none absolute left-3.5 transition-all duration-200 font-sans",
            value
              ? "-top-2.5 text-[11px] font-semibold text-primary bg-surface px-1.5 rounded"
              : "top-3.5 text-xs text-text-muted"
          )}
        >
          {label}
        </span>

        {/* Selected Value Text */}
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0 text-text-secondary">{selectedOption.icon}</span>
          )}
          <span
            className={cn(
              "text-xs sm:text-sm font-sans truncate font-medium",
              selectedOption ? "text-text-primary" : "text-text-muted"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Animated Chevron Indicator */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-muted shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Floating Animated Disclosure Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={springTransition}
            className="absolute left-0 right-0 z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-elevation-2 backdrop-blur-md max-h-60 overflow-y-auto p-1.5 space-y-1"
          >
            {normalizedOptions.map((opt) => {
              const isSelected = selectedOption?.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.99]",
                    isSelected
                      ? "bg-primary-light text-primary font-bold shadow-xs border border-primary/20"
                      : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {opt.icon && (
                      <span className={cn("shrink-0", isSelected ? "text-primary" : "text-text-muted")}>
                        {opt.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[10px] text-text-muted font-normal leading-tight">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && <p className="text-[11px] text-error font-medium pl-1 mt-1">{error}</p>}
    </div>
  );
}
