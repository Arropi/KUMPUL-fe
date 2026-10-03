import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MOCK_SUPPLIER_COMMODITIES } from "@/constants/supplier";
import { DetailKomoditasView } from "@/modules/supplier/katalog/detail-komoditas-view";
import { UserRole, UserSession } from "@/constants/auth";

export const metadata: Metadata = {
  title: "Rincian Pasokan Komoditas | KUMPUL",
  description:
    "Detail spesifikasi komoditas, harga utama, kuota pasokan, formulir pemesanan pooling, dan paspor mutu sanitasi pangan.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailKomoditasPage({ params }: PageProps) {
  const { id } = await params;

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
      // Fallback role default
    }
  }

  const commodity =
    MOCK_SUPPLIER_COMMODITIES.find((c) => c.id === id) ||
    MOCK_SUPPLIER_COMMODITIES[0];

  if (!commodity) {
    notFound();
  }

  return <DetailKomoditasView initialCommodity={commodity} role={role} />;
}
