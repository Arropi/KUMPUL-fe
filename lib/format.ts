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
