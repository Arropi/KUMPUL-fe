"use client";

import * as React from "react";
import { UserRole } from "@/constants/auth";
import { cn } from "@/lib/utils";

interface RoleSwitcherProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function RoleSwitcher({ activeRole, onRoleChange }: RoleSwitcherProps) {
  const roles: { id: UserRole; label: string }[] = [
    { id: "umkm", label: "Pelaku UMKM" },
    { id: "supplier", label: "Mitra Supplier" },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      onRoleChange(activeRole === "umkm" ? "supplier" : "umkm");
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Pilih Peran Akun"
      onKeyDown={handleKeyDown}
      className="w-full grid grid-cols-2 p-1 bg-surface-subtle border border-border/80 rounded-2xl shadow-xs"
    >
      {roles.map((r) => {
        const isSelected = activeRole === r.id;
        return (
          <button
            key={r.id}
            role="tab"
            type="button"
            id={`tab-${r.id}`}
            aria-selected={isSelected}
            aria-controls={`panel-${r.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onRoleChange(r.id)}
            className={cn(
              "w-full min-h-[44px] py-2.5 px-4 rounded-xl font-heading text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center text-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none",
              isSelected
                ? "bg-surface text-primary font-bold shadow-[0_2px_8px_rgba(13,59,46,0.08),inset_0_1px_0_#FFFFFF] border border-border"
                : "text-text-muted hover:text-text-primary hover:bg-surface/50 font-semibold"
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
