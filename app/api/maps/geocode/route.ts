import { NextRequest, NextResponse } from "next/server";

interface GeocodeResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

const FALLBACK_LOCATIONS = [
  { name: "Surabaya, Jawa Timur", displayName: "Kota Surabaya, Jawa Timur, Indonesia", lat: -7.2575, lng: 112.7521 },
  { name: "Jakarta Raya (Pusat Logistik)", displayName: "DKI Jakarta, Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Bandung, Jawa Barat", displayName: "Kota Bandung, Jawa Barat, Indonesia", lat: -6.9175, lng: 107.6191 },
  { name: "Semarang, Jawa Tengah", displayName: "Kota Semarang, Jawa Tengah, Indonesia", lat: -6.9667, lng: 110.4167 },
  { name: "Brebes, Jawa Tengah (Sentra Bawang)", displayName: "Kabupaten Brebes, Jawa Tengah, Indonesia", lat: -6.8703, lng: 109.0436 },
  { name: "Malang, Jawa Timur (Sentra Sayur)", displayName: "Kota Malang, Jawa Timur, Indonesia", lat: -7.9666, lng: 112.6326 },
  { name: "Medan, Sumatera Utara", displayName: "Kota Medan, Sumatera Utara, Indonesia", lat: 3.5952, lng: 98.6722 },
  { name: "Makassar, Sulawesi Selatan", displayName: "Kota Makassar, Sulawesi Selatan, Indonesia", lat: -5.1477, lng: 119.4327 },
  { name: "Yogyakarta, D.I. Yogyakarta", displayName: "Kota Yogyakarta, D.I. Yogyakarta, Indonesia", lat: -7.7956, lng: 110.3695 },
  { name: "Denpasar, Bali", displayName: "Kota Denpasar, Bali, Indonesia", lat: -8.6705, lng: 115.2126 },
  { name: "Palembang, Sumatera Selatan", displayName: "Kota Palembang, Sumatera Selatan, Indonesia", lat: -2.9761, lng: 104.7754 },
  { name: "Pasar Keputran, Surabaya", displayName: "Pasar Keputran, Tegalsari, Kota Surabaya, Jawa Timur", lat: -7.2748, lng: 112.7428 },
  { name: "Pasar Induk Kramat Jati, Jakarta", displayName: "Pasar Induk Kramat Jati, Jakarta Timur, DKI Jakarta", lat: -6.2831, lng: 106.8687 },
  { name: "Pasar Induk Osowilangun, Surabaya", displayName: "Pasar Induk Osowilangun (PIOS), Benowo, Kota Surabaya", lat: -7.2064, lng: 112.6384 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  // Handler Reverse Geocoding (Koordinat -> Nama Tempat)
  if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (!isNaN(lat) && !isNaN(lng)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(reverseUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "KUMPUL-Platform/1.0 (ICOMFEST Supply Chain Ecosystem; info@kumpul.id)",
            Accept: "application/json",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
          },
          next: { revalidate: 3600 },
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const shortName = data.name || data.display_name.split(",")[0];
            return NextResponse.json({
              result: {
                id: String(data.place_id || "reverse"),
                name: shortName,
                displayName: data.display_name,
                lat,
                lng,
              },
            });
          }
        }
      } catch {
        // Fallback jika nominatim reverse gagal / timeout
      }

      return NextResponse.json({
        result: {
          id: `coord-${lat.toFixed(4)}-${lng.toFixed(4)}`,
          name: `Lokasi Terpilih (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          displayName: `Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        },
      });
    }
  }

  const query = searchParams.get("q")?.trim() || "";

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=id&limit=6&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "KUMPUL-Platform/1.0 (ICOMFEST Supply Chain Ecosystem; info@kumpul.id)",
        Accept: "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results: GeocodeResult[] = data.map((item: {
          place_id: number | string;
          name?: string;
          display_name: string;
          lat: string;
          lon: string;
          type?: string;
        }) => ({
          id: String(item.place_id),
          name: item.name || item.display_name.split(",")[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
        }));

        return NextResponse.json({ results });
      }
    }
  } catch {
    // Abaikan error jaringan luar dan lanjutkan ke fallback lokal
  }

  // Fallback pencarian fuzzy lokal bila offline atau kuota rate limit tercapai
  const lowerQ = query.toLowerCase();
  const matchedFallbacks = FALLBACK_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(lowerQ) ||
      loc.displayName.toLowerCase().includes(lowerQ)
  ).map((loc, idx) => ({
    id: `local-${idx}`,
    name: loc.name,
    displayName: loc.displayName,
    lat: loc.lat,
    lng: loc.lng,
    type: "hub",
  }));

  return NextResponse.json({ results: matchedFallbacks });
}
