import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masuk ke Akun | KUMPUL",
  description:
    "Portal Masuk Platform Rantai Pasok B2B Lintas 7 Sektor, Autonomous MOQ Pooling, dan Paspor Mutu Bahan Pangan KUMPUL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-background text-text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
