/**
 * Utility helper untuk pemformatan mata uang, angka, dan tanggal standar Indonesia (id-ID)
 */

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

export function formatDate(
  date: string | Date,
  style: "short" | "medium" | "long" = "medium"
): string {
  try {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: style }).format(
      new Date(date)
    );
  } catch {
    return String(date);
  }
}

/**
 * Format tanggal registrasi profil akun menjadi "Bulan Tahun" (contoh: "Oktober 2026")
 */
export function formatRegistrationDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "2025";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "2025";
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "2025";
  }
}

/**
 * Ekstraksi nama kota / kabupaten secara dinamis dari teks alamat lengkap standar Indonesia
 */
export function extractCityFromAddress(address?: string | null): string {
  if (!address || !address.trim()) return "Indonesia";

  const clean = address.trim();

  // 1. Jika alamat menggunakan pemisah koma
  const parts = clean.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    const provinceKeywords = [
      "jawa timur", "jatim", "jawa tengah", "jateng", "jawa barat", "jabar",
      "d.i. yogyakarta", "diy", "daerah istimewa yogyakarta",
      "dki jakarta", "banten", "bali", "sumatera utara", "sumut", "sumatera barat", "sumbar",
      "sumatera selatan", "sumsel", "riau", "lampung", "kalimantan timur", "kaltim",
      "kalimantan barat", "kalbar", "sulawesi selatan", "sulsel", "sulawesi utara", "sulut",
      "nusa tenggara barat", "ntb", "nusa tenggara timur", "ntt", "indonesia",
    ];

    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];

    const lastLower = lastPart.toLowerCase();
    const isLastProvince = provinceKeywords.some(
      (p) => lastLower === p || lastLower.startsWith(p)
    );

    if (isLastProvince && secondLastPart) {
      return secondLastPart.replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.)\s+/i, "").trim();
    }

    return lastPart.replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.)\s+/i, "").trim();
  }

  // 2. Jika tanpa koma, cocokkan dengan nama kota/kabupaten umum di Indonesia
  const commonCities = [
    "Surabaya", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul", "Yogyakarta",
    "Semarang", "Solo", "Surakarta", "Bandung", "Jakarta Selatan", "Jakarta Barat",
    "Jakarta Timur", "Jakarta Utara", "Jakarta Pusat", "Jakarta", "Tangerang Selatan",
    "Tangerang", "Bekasi", "Depok", "Bogor", "Malang", "Sidoarjo", "Gresik", "Kediri",
    "Blitar", "Madiun", "Pasuruan", "Mojokerto", "Batu", "Denpasar", "Medan", "Palembang",
    "Makassar", "Balikpapan", "Samarinda", "Banjarmasin", "Pontianak", "Manado",
  ];

  for (const city of commonCities) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(clean)) {
      return city;
    }
  }

  return clean.length <= 25 ? clean : clean.slice(0, 25);
}
