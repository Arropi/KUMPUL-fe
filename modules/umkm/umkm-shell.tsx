"use client";

import * as React from "react";
import { UmkmNav } from "./umkm-nav";
import { UmkmHeader } from "./umkm-header";

interface UmkmShellProps {
  children: React.ReactNode;
}

export function UmkmShell({ children }: UmkmShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row font-sans selection:bg-primary-light selection:text-primary">
      {/* Sidebar Nav */}
      <UmkmNav
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <UmkmHeader
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
