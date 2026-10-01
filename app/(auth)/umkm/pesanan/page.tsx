import { UmkmPesananView } from "@/modules/umkm/pesanan-view";

export const metadata = {
  title: "Pesanan Pooling Saya | KUMPUL",
  description: "Daftar pesanan pengadaan bahan baku grosir UMKM, status agregasi kuota, dan tiket serah-terima Hub Konsolidasi.",
};

export default function UmkmPesananPage() {
  return <UmkmPesananView />;
}
