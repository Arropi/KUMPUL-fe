"use client";

import * as React from "react";
import { AuthCard, AuthMode } from "@/modules/auth/auth-card";

interface AuthViewProps {
  defaultMode?: AuthMode;
}

export function AuthView({ defaultMode = "login" }: AuthViewProps) {
  return (
    <div className="min-h-dvh w-full flex flex-col justify-between bg-background p-3 sm:p-4 lg:p-6 overflow-y-auto">
      <div aria-hidden="true" className="h-0 sm:h-1" />

      <main className="flex-1 flex items-center justify-center py-4 sm:py-6 my-auto">
        <div className="w-full max-w-[480px]">
          <React.Suspense
            fallback={
              <div className="w-full max-w-[440px] h-[380px] mx-auto bg-surface rounded-3xl shadow-elevation-1 animate-pulse" />
            }
          >
            <AuthCard defaultMode={defaultMode} />
          </React.Suspense>
        </div>
      </main>

      <footer className="w-full text-center py-3 text-xs font-sans text-text-muted shrink-0">
        <p>
          &copy; {new Date().getFullYear()} KUMPUL. Ekosistem Kolaborasi Rantai
          Pasok Pangan Terpadu.
        </p>
      </footer>
    </div>
  );
}
