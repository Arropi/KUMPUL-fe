import * as React from "react";
import { LoginForm } from "@/modules/auth/login/login-form";

export function LoginView() {
  return (
    <div className="min-h-dvh w-full flex flex-col justify-between bg-background p-3 sm:p-4 lg:p-6 overflow-y-auto">
      <div aria-hidden="true" className="h-0 sm:h-1" />

      <main className="flex-1 flex items-center justify-center py-4 sm:py-6 my-auto">
        <div className="w-full max-w-[440px]">
          <React.Suspense
            fallback={
              <div className="p-8 text-center text-text-muted">Memuat formulir masuk...</div>
            }
          >
            <LoginForm />
          </React.Suspense>
        </div>
      </main>

      <footer className="w-full text-center py-3 text-xs font-sans text-text-muted shrink-0">
        <p>&copy; {new Date().getFullYear()} KUMPUL. Ekosistem Kolaborasi Rantai Pasok Pangan Terpadu.</p>
      </footer>
    </div>
  );
}
