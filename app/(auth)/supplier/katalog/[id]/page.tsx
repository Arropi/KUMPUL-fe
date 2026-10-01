import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_SUPPLIER_COMMODITIES } from "@/constants/supplier";
import { DetailKomoditasView } from "@/modules/supplier/katalog/detail-komoditas-view";

export const metadata: Metadata = {
  title: "Rincian Pasokan Komoditas | Portal Supplier KUMPUL",
  description:
    "Detail spesifikasi komoditas, harga utama, kuota pasokan, dan paspor mutu sanitasi pangan.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailKomoditasPage({ params }: PageProps) {
  const { id } = await params;

  const commodity =
    MOCK_SUPPLIER_COMMODITIES.find((c) => c.id === id) ||
    MOCK_SUPPLIER_COMMODITIES[0];

  if (!commodity) {
    notFound();
  }

  return <DetailKomoditasView initialCommodity={commodity} />;
}
