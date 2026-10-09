import type { Metadata } from "next";
import Script from "next/script";
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
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Mid-client-C8Oep56Dwkx5eJ19"}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
