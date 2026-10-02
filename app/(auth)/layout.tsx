import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRole, UserSession } from "@/constants/auth";
import { AuthShell } from "@/modules/auth-shell";

export const metadata: Metadata = {
  title: "Portal Ekosistem KUMPUL",
  description:
    "Rantai Pasok Kolaboratif & Autonomous Pooling Pangan UMKM dan Supplier Terintegrasi KUMPUL.",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  const tokenCookie = cookieStore.get("kumpul_token");

  let session: UserSession | null = null;

  if (sessionCookie?.value) {
    try {
      session = JSON.parse(sessionCookie.value) as UserSession;
    } catch {
      session = null;
    }
  }

  // Jika cookie kumpul tidak ada, periksa sesi Supabase
  if (!session) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login");
      }

      const email = user.email || "";
      const role = (user.user_metadata?.role as UserRole) || "umkm";
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.business_name as string) ||
        email.split("@")[0] ||
        "Mitra KUMPUL";

      session = {
        email,
        name,
        role,
        provider: user.app_metadata?.provider === "google" ? "google" : "credentials",
        supabaseUserId: user.id,
        token: tokenCookie?.value,
      };
    } catch {
      redirect("/login");
    }
  }

  // Jika tetap tidak ada sesi valid setelah verifikasi
  if (!session) {
    redirect("/login");
  }

  const effectiveRole: UserRole = session.role === "supplier" ? "supplier" : "umkm";

  return (
    <AuthShell role={effectiveRole} session={session}>
      {children}
    </AuthShell>
  );
}
