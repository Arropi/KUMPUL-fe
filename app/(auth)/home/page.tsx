import * as React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { HomeView } from "@/modules/home/home-view";
import { UserRole, UserSession } from "@/constants/auth";
import { fetchHomeData } from "@/lib/actions/server-actions";
import { getBusinessProfileAction } from "@/actions/business-profile";

export const metadata: Metadata = {
  title: "Beranda | KUMPUL",
  description: "Portal Ekosistem Kolaborasi Rantai Pasok Pangan Terpadu KUMPUL.",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kumpul_session");
  let session: UserSession | null = null;

  if (sessionCookie?.value) {
    try {
      session = JSON.parse(sessionCookie.value) as UserSession;
    } catch {
      // Abaikan jika cookie sesi tidak valid
    }
  }

  if (!session) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const email = user.email || "";
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        email.split("@")[0] ||
        "Pengguna";
      const role = (user.user_metadata?.role as UserRole) || "umkm";
      const picture =
        (user.user_metadata?.avatar_url as string) ||
        (user.user_metadata?.picture as string) ||
        "";

      session = {
        email,
        name,
        role,
        picture,
        provider: "google",
      };
    }
  }

  // Fetch data for home page using server actions & business profile
  const [homeData, profileRes] = await Promise.all([
    fetchHomeData(),
    getBusinessProfileAction(),
  ]);

  const { catalog, recommendations, rawRecommendations, catalogError, recsError } = homeData;
  const userProfile = profileRes.success && profileRes.entity ? profileRes.entity : null;

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <HomeView
        initialSession={session}
        catalog={catalog}
        recommendations={recommendations}
        rawRecommendations={rawRecommendations}
        catalogError={catalogError}
        recsError={recsError}
        userProfile={userProfile}
      />
    </React.Suspense>
  );
}
