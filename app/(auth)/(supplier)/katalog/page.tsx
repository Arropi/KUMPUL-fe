import type { Metadata } from "next";
import { SupplierKatalogView } from "@/modules/supplier/katalog-view";

export const metadata: Metadata = {
  title: "Katalog & Kuota Pasokan | Portal Supplier KUMPUL",
  description:
    "Pengelolaan etalase grosir komoditas, penentuan batas MOQ, skema harga bertingkat, dan paspor sanitasi digital.",
};

export default function SupplierKatalogPage() {
  return <SupplierKatalogView />;
}
