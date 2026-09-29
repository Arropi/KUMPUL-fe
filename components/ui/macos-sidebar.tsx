"use client";

import * as React from "react";
import { PlusSignIcon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface MacOSSidebarItem {
  id?: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}

export interface MacOSSidebarProps {
  items: (string | MacOSSidebarItem)[];
  defaultOpen?: boolean;
  initialSelectedIndex?: number;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  onNewAction?: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  headerLogo?: React.ReactNode;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function MacOSSidebar({
  items,
  defaultOpen = true,
  initialSelectedIndex = 0,
  selectedIndex: controlledSelectedIndex,
  onSelectIndex,
  onNewAction,
  headerTitle,
  headerSubtitle,
  headerLogo,
  footerContent,
  children,
  className = "",
}: MacOSSidebarProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState<number>(initialSelectedIndex);
  const [isOpen, setIsOpen] = React.useState<boolean>(defaultOpen);

  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : uncontrolledIndex;

  const handleSelect = (index: number, item: string | MacOSSidebarItem) => {
    if (controlledSelectedIndex === undefined) {
      setUncontrolledIndex(index);
    }
    onSelectIndex?.(index);
    if (typeof item !== "string" && item.onClick) {
      item.onClick();
    }
  };

  return (
    <div
      className={cn(
        "relative flex w-full h-full min-h-screen bg-background text-text-primary overflow-hidden",
        className
      )}
    >
      {/* Animated MacOS Collapsible Sidebar */}
      <motion.aside
        animate={{
          width: isOpen ? 256 : 72,
        }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        className={cn(
          "flex shrink-0 flex-col justify-between border-r border-border bg-surface p-3 transition-colors duration-300 z-20 select-none",
          isOpen ? "shadow-elevation-1" : "items-center"
        )}
      >
        <div className="flex flex-col w-full">
          {/* Header Controls (Logo / Title / Toggle & Plus Action) */}
          <div
            className={cn(
              "flex w-full items-center shrink-0 min-h-[44px] pb-3 border-b border-border/70",
              isOpen ? "justify-between gap-2 px-1" : "justify-center"
            )}
          >
            {isOpen && (
              <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                {headerLogo || (
                  <div className="w-8 h-8 rounded-xl bg-primary text-text-inverse flex items-center justify-center font-heading font-extrabold text-sm shrink-0 shadow-xs">
                    K
                  </div>
                )}
                {(headerTitle || headerSubtitle) && (
                  <div className="flex flex-col min-w-0">
                    {headerTitle && (
                      <span className="font-heading font-bold text-sm text-primary truncate leading-tight">
                        {headerTitle}
                      </span>
                    )}
                    {headerSubtitle && (
                      <span className="font-heading text-[10px] font-bold text-accent truncate leading-tight">
                        {headerSubtitle}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              <AnimatePresence>
                {isOpen && onNewAction && (
                  <motion.button
                    type="button"
                    onClick={onNewAction}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    title="Aksi Baru"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-95"
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      className="size-4.5"
                    />
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                layout
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                title={isOpen ? "Tutup Sidebar (Collapse)" : "Buka Sidebar (Expand)"}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
              >
                <HugeiconsIcon
                  icon={SidebarLeftIcon}
                  className="size-4.5"
                />
              </motion.button>
            </div>
          </div>

          {/* Navigation Items */}
          <div
            className="relative z-10 mt-3 flex w-full flex-col gap-1.5 whitespace-nowrap"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {items.map((rawItem, index) => {
              const label = typeof rawItem === "string" ? rawItem : rawItem.label;
              const icon = typeof rawItem !== "string" ? rawItem.icon : null;
              const badge = typeof rawItem !== "string" ? rawItem.badge : null;
              const isSelected = selectedIndex === index;

              return (
                <div
                  key={typeof rawItem === "string" ? rawItem : rawItem.id || label}
                  className={cn(
                    "relative cursor-pointer min-h-[42px] rounded-xl flex items-center transition-all duration-150 active:scale-[0.98]",
                    isOpen ? "px-3 py-2" : "justify-center px-2 py-2"
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onClick={() => handleSelect(index, rawItem)}
                  title={!isOpen ? label : undefined}
                >
                  {/* Selected Background Indicator (Watermelon Style) */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="bg-primary-light border border-primary/20 absolute inset-0 z-0 rounded-xl shadow-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Hover Pill Background (Spring layoutId) */}
                  <AnimatePresence>
                    {hoveredIndex === index && !isSelected && (
                      <motion.span
                        layoutId="sidebar-hover-bg"
                        className="bg-surface-subtle/80 absolute inset-0 z-0 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Content (Icon + Label + Badge) */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center w-full gap-2.5",
                      !isOpen && "justify-center"
                    )}
                  >
                    {icon && (
                      <span
                        className={cn(
                          "shrink-0 transition-colors duration-150",
                          isSelected ? "text-primary" : "text-text-muted group-hover:text-text-primary"
                        )}
                      >
                        {icon}
                      </span>
                    )}

                    {isOpen && (
                      <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                        <span
                          className={cn(
                            "font-sans text-xs truncate",
                            isSelected
                              ? "text-primary font-bold"
                              : "text-text-secondary font-medium"
                          )}
                        >
                          {label}
                        </span>

                        {badge && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent text-text-inverse shrink-0 shadow-xs">
                            {badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Area */}
        {footerContent && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full pt-3 border-t border-border/70"
          >
            {footerContent}
          </motion.div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <div className="z-0 h-full min-h-screen w-full flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
