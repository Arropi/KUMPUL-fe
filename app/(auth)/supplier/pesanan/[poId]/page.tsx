import type { Metadata } from "next";
import { PesananDetailView } from "@/modules/supplier/pesanan-detail-view";

export const metadata: Metadata = {
  title: "Detail Pesanan Terpadu & Manifest | Portal Supplier KUMPUL",
  description: "Rincian status pengiriman, titik drop Hub, dan manifest peserta pooling UMKM.",
};

interface PageProps {
  params: Promise<{ poId: string }>;
}

export default async function PesananDetailPage({ params }: PageProps) {
  const { poId } = await params;
  return <PesananDetailView poId={poId} />;
}
