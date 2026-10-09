import type { Metadata } from "next";
import { AuthView } from "@/modules/auth/auth-view";

export const metadata: Metadata = {
  title: "Masuk ke Akun | KUMPUL",
  description:
    "Masuk ke portal KUMPUL sebagai Pelaku Usaha UMKM atau Mitra Supplier Bahan Baku.",
};

export default function LoginPage() {
  return <AuthView defaultMode="login" />;
}