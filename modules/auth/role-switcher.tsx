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
      className="w-full grid grid-cols-2 p-1 bg-neutral-100 rounded-xl"
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
              "min-h-[44px] py-2 px-4 rounded-lg font-sans text-sm transition-all duration-150 cursor-pointer active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] focus-visible:ring-offset-1",
              isSelected
                ? "bg-white text-neutral-900 font-semibold shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
