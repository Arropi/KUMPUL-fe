"use client";

import * as React from "react";
import { SupplierNav } from "./supplier-nav";
import { SupplierHeader } from "./supplier-header";

interface SupplierShellProps {
  children: React.ReactNode;
}

export function SupplierShell({ children }: SupplierShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex flex-col md:flex-row font-sans selection:bg-[#EBF5F0] selection:text-[#0D3B2E]">
      {/* Sidebar Nav */}
      <SupplierNav
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <SupplierHeader
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
