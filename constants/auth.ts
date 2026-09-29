export type UserRole = "umkm" | "supplier";

export interface RoleConfig {
  id: UserRole;
  title: string;
  badgeLabel: string;
  shortDescription: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  submitButtonText: string;
  defaultEmail: string;
}

export const AUTH_ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  umkm: {
    id: "umkm",
    title: "Masuk sebagai UMKM",
    badgeLabel: "Pelaku Usaha",
    shortDescription: "Kelola pasokan bahan baku dan kuota pesanan usaha Anda.",
    identifierLabel: "Email atau Nomor WhatsApp",
    identifierPlaceholder: "nama@usaha.id atau 081234567890",
    submitButtonText: "Masuk sebagai UMKM",
    defaultEmail: "umkm@kumpul.id",
  },
  supplier: {
    id: "supplier",
    title: "Masuk sebagai Supplier",
    badgeLabel: "Mitra Pemasok",
    shortDescription: "Kelola katalog pasokan komoditas dan pemenuhan pesanan.",
    identifierLabel: "Email atau ID Supplier",
    identifierPlaceholder: "distribusi@pemasok.co.id atau SUP-1029",
    submitButtonText: "Masuk sebagai Supplier",
    defaultEmail: "supplier@kumpul.id",
  },
};

export const DEFAULT_ROLE: UserRole = "umkm";

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  picture?: string;
  provider: "google" | "credentials";
}
