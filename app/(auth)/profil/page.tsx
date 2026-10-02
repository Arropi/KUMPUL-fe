import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { UserRole, UserSession } from "@/constants/auth";
import { ProfileView } from "@/modules/profile/profile-view";

export const metadata: Metadata = {
  title: "Profil & Rekening Usaha | KUMPUL",
  description:
    "Informasi legalitas entitas bisnis terverifikasi, penambahan dan pengurangan rekening escrow, serta pengaturan kapasitas penyimpanan.",
};

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  let role: UserRole = "umkm";

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value) as UserSession;
      if (session.role === "supplier") {
        role = "supplier";
      }
    } catch {
      // Fallback
    }
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProfileView initialRole={role} />
    </React.Suspense>
  );
}
