import type { Metadata } from "next";
import { LoginView } from "@/modules/auth/login-view";

export const metadata: Metadata = {
  title: "Masuk ke Akun | KUMPUL",
  description:
    "Masuk ke portal KUMPUL sebagai Pelaku Usaha UMKM atau Mitra Supplier Bahan Baku.",
};

export default function LoginPage() {
  return <LoginView />;
}
