"use client";

import * as React from "react";
import { UserRole, UserSession } from "@/constants/auth";
import { Navbar } from "./navbar";
import { Menu } from "lucide-react";
import Image from "next/image";

export interface AuthShellProps {
  children: React.ReactNode;
  role: UserRole;
  session?: UserSession | null;
}

export function AuthShell({ children, role, session }: AuthShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const isSupplier = role === "supplier";

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row font-sans selection:bg-primary-light selection:text-primary">
      {/* Unified Sidebar Navigation */}
      <Navbar
        role={role}
        session={session}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header on Mobile and Subtle Header on Desktop */}
        <header className="sticky top-0 z-10 w-full bg-surface/90 backdrop-blur-md border-b border-border h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle transition-colors"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-text-secondary">
                {isSupplier ? "Portal Pasokan Pangan KUMPUL" : "Ekosistem Pengadaan UMKM KUMPUL"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSupplier
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-primary-light text-primary border-primary/20"
              }`}
            >
              {isSupplier ? "Supplier Pasokan" : "Kedai / UMKM"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
