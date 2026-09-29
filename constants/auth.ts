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
    identifierLabel: "Email Operasional",
    identifierPlaceholder: "nama@usaha.id",
    submitButtonText: "Masuk sebagai UMKM",
    defaultEmail: "umkm@kumpul.id",
  },
  supplier: {
    id: "supplier",
    title: "Masuk sebagai Supplier",
    badgeLabel: "Mitra Pemasok",
    shortDescription: "Kelola katalog pasokan komoditas dan pemenuhan pesanan.",
    identifierLabel: "Email Operasional",
    identifierPlaceholder: "distribusi@pemasok.co.id",
    submitButtonText: "Masuk sebagai Supplier",
    defaultEmail: "supplier@kumpul.id",
  },
};

export interface RegisterRoleConfig {
  id: UserRole;
  title: string;
  badgeLabel: string;
  shortDescription: string;
  businessNameLabel: string;
  businessNamePlaceholder: string;
  submitButtonText: string;
}

export const REGISTER_ROLE_CONFIGS: Record<UserRole, RegisterRoleConfig> = {
  umkm: {
    id: "umkm",
    title: "Daftar Akun Pelaku UMKM",
    badgeLabel: "Pelaku Usaha",
    shortDescription: "Dapatkan akses pooling kuota grosir dan bahan baku terverifikasi.",
    businessNameLabel: "Nama Usaha / Kedai / Warung",
    businessNamePlaceholder: "Contoh: Warung Sejahtera Mandiri",
    submitButtonText: "Daftar Sekarang",
  },
  supplier: {
    id: "supplier",
    title: "Daftar Akun Mitra Supplier",
    badgeLabel: "Mitra Pemasok",
    shortDescription: "Jangkau agregasi pesanan UMKM dan perluas saluran distribusi grosir.",
    businessNameLabel: "Nama Perusahaan / Kelompok Tani",
    businessNamePlaceholder: "Contoh: PT Agroniaga Nusantara",
    submitButtonText: "Daftar Sekarang",
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
