/**
 * Helper untuk mendeteksi origin / base URL publik secara dinamis dan andal,
 * baik di localhost, reverse proxy, maupun deployment cloud Vercel.
 */
export function getRequestOrigin(request: Request): string {
  // 1. Jika APP_URL didefinisikan dan bukan localhost, gunakan itu (misal: https://kumpul.vercel.app)
  if (process.env.APP_URL && !process.env.APP_URL.includes("localhost")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  // 2. Baca header proxy Vercel (x-forwarded-host & x-forwarded-proto)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host && !host.includes("localhost") ? "https" : "http");

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  // 3. Fallback dari objek URL request bawaan
  try {
    const parsed = new URL(request.url);
    return parsed.origin.replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}
