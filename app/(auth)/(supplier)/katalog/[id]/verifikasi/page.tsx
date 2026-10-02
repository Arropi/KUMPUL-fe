import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_SUPPLIER_COMMODITIES } from "@/constants/supplier";
import { VerifikasiKepatuhanView } from "@/modules/supplier/katalog/verifikasi-kepatuhan-view";

export const metadata: Metadata = {
  title: "Verifikasi Kepatuhan & Paspor Mutu | Portal Supplier KUMPUL",
  description:
    "Pengajuan verifikasi kepatuhan sanitasi digital, penentuan suhu penyimpanan rantai pasok, dan pengunggahan berkas uji lab.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifikasiKepatuhanPage({ params }: PageProps) {
  const { id } = await params;

  const commodity =
    MOCK_SUPPLIER_COMMODITIES.find((c) => c.id === id) ||
    MOCK_SUPPLIER_COMMODITIES[0];

  if (!commodity) {
    notFound();
  }

  return <VerifikasiKepatuhanView commodity={commodity} />;
}
