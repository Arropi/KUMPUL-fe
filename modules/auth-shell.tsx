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
        {/* Mobile-Only Header Bar (Desktop top navbar removed) */}
        <header className="md:hidden sticky top-0 z-20 w-full bg-surface/95 backdrop-blur-md border-b border-border h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle transition-colors active:scale-95"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Image
            src="/logo/without-bg.svg"
            alt="Logo KUMPUL"
            width={120}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />

          <div className="w-11" aria-hidden="true" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
