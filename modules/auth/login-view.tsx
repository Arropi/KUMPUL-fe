import * as React from "react";
import { LoginForm } from "@/modules/auth/login-form";

export function LoginView() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAF8] p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center font-heading font-black text-sm select-none shadow-xs">
            K
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-neutral-900">
            KUMPUL
          </span>
        </div>

        <a
          href="mailto:bantuan@kumpul.id"
          className="text-xs font-sans text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Pusat Bantuan
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>

      <footer className="w-full text-center py-4 text-xs font-sans text-neutral-400">
        <p>&copy; 2026 KUMPUL. Hak cipta dilindungi undang-undang.</p>
      </footer>
    </div>
  );
}
