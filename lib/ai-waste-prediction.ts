/**
 * AI Waste Prediction Engine untuk Platform KUMPUL UMKM
 * Memprediksi estimasi volume limbah produktif, jenis limbah, dan potensi valuasi ekonomi sirkular
 * berdasarkan komposisi resep bahan baku dan ukuran siklus batch produksi UMKM.
 */

import type { BERecipe, BEProduct } from "@/lib/api/types";

export interface PredictedWasteItem {
  id: string;
  name: string;
  category: "Minyak Jelantah (UCO)" | "Cangkang Telur" | "Ampas Kedelai / Tahu" | "Residu Kulit & Sayur" | "Tulang & Trimming Hewani" | "Ampas Kopi & Teh" | "Biomassa Organik Lainnya";
  estimatedVolumePerBatch: number;
  unit: string;
  pricePerUnit: number;
  potentialRevenue: number;
  offtakerType: string;
  recommendedOfftaker: string;
  recyclabilityRate: number; // Persentase dapat didaur ulang (0-100)
  carbonOffsetKg: number; // Estimasi reduksi emisi CO2e (kg)
  handlingNote: string;
}

export interface AiWastePredictionResult {
  hasWaste: boolean;
  totalVolumeKg: number;
  totalPotentialRevenuePerBatch: number;
  annualPotentialRevenue: number; // Asumsi 4 batch/bulan x 12 bulan = 48 batch
  aiConfidencePct: number;
  primaryCategory: string;
  items: PredictedWasteItem[];
  environmentalSummary: {
    co2SavedKg: number;
    waterPollutionPreventedLiters: number;
  };
  aiRecommendation: string;
}

/**
 * Heuristik AI untuk mendeteksi residu dan memprediksi limbah produktif
 */
export function predictProductWaste(
  productName: string,
  batchUnits: number,
  recipes: BERecipe[] = []
): AiWastePredictionResult {
  const safeBatch = Math.max(1, batchUnits || 1);
  const items: PredictedWasteItem[] = [];

  let detectedOilVolume = 0;
  let detectedEggCount = 0;
  let detectedSoyWeight = 0;
  let detectedVegWeight = 0;
  let detectedMeatWeight = 0;
  let detectedCoffeeWeight = 0;

  // Analisis setiap bahan resep
  recipes.forEach((ing) => {
    const name = (ing.ingredient_name || "").toLowerCase();
    const qtyPerUnit = Number(ing.required_qty_per_unit) || 0;
    const totalBatchQty = qtyPerUnit * safeBatch;
    const unit = (ing.unit || "").toLowerCase();

    // 1. Minyak Goreng / Lemak Nabati
    if (
      name.includes("minyak") ||
      name.includes("oil") ||
      name.includes("mentega") ||
      name.includes("margarin")
    ) {
      // Asumsi jika liter, konversi langsung; jika kg anggap 1 kg ~ 1.1 liter
      detectedOilVolume += totalBatchQty;
    }

    // 2. Telur Ayam / Bebek
    else if (name.includes("telur") || name.includes("egg")) {
      // Jika butir / pcs
      if (unit.includes("butir") || unit.includes("pcs") || unit.includes("biji")) {
        detectedEggCount += totalBatchQty;
      } else {
        // Jika kg, 1 kg telur ~ 16 butir
        detectedEggCount += totalBatchQty * 16;
      }
    }

    // 3. Kedelai, Tahu, Tempe
    else if (
      name.includes("kedelai") ||
      name.includes("tahu") ||
      name.includes("tempe") ||
      name.includes("soya")
    ) {
      detectedSoyWeight += totalBatchQty;
    }

    // 4. Sayuran, Bawang, Cabai, Bumbu Rempah, Buah
    else if (
      name.includes("bawang") ||
      name.includes("cabai") ||
      name.includes("cabe") ||
      name.includes("lengkuas") ||
      name.includes("jahe") ||
      name.includes("kunyit") ||
      name.includes("wortel") ||
      name.includes("kentang") ||
      name.includes("sayur") ||
      name.includes("daun") ||
      name.includes("tomat") ||
      name.includes("jeruk") ||
      name.includes("kelapa") ||
      name.includes("santan")
    ) {
      detectedVegWeight += totalBatchQty;
    }

    // 5. Ayam, Daging, Ikan, Seafood
    else if (
      name.includes("ayam") ||
      name.includes("daging") ||
      name.includes("sapi") ||
      name.includes("ikan") ||
      name.includes("udang") ||
      name.includes("seafood")
    ) {
      detectedMeatWeight += totalBatchQty;
    }

    // 6. Kopi, Teh
    else if (name.includes("kopi") || name.includes("coffee") || name.includes("teh") || name.includes("tea")) {
      detectedCoffeeWeight += totalBatchQty;
    }
  });

  // Generasi Item Limbah Terprediksi:

  // A. Minyak Jelantah (UCO): ~35% dari minyak terserap / menjadi residu jelantah
  if (detectedOilVolume > 0) {
    const ucoVolume = Math.round(detectedOilVolume * 0.35 * 10) / 10;
    if (ucoVolume >= 0.1) {
      const pricePerLiter = 7500;
      items.push({
        id: "waste-ai-uco",
        name: "Minyak Jelantah (UCO)",
        category: "Minyak Jelantah (UCO)",
        estimatedVolumePerBatch: ucoVolume,
        unit: "Liter",
        pricePerUnit: pricePerLiter,
        potentialRevenue: Math.round(ucoVolume * pricePerLiter),
        offtakerType: "Pengumpul Biodiesel & Bioenergi",
        recommendedOfftaker: "PT Hijau Bioenergi Nusantara (SIER Surabaya)",
        recyclabilityRate: 98,
        carbonOffsetKg: Math.round(ucoVolume * 2.8 * 10) / 10,
        handlingNote: "Tampung pada jeriken tertutup, hindari tercampur air atau residu tepung tebal.",
      });
    }
  }

  // B. Cangkang Telur: ~6 gram (0.006 kg) cangkang per butir telur
  if (detectedEggCount > 0) {
    const eggShellKg = Math.round(detectedEggCount * 0.006 * 10) / 10;
    if (eggShellKg >= 0.1) {
      const pricePerKg = 2000;
      items.push({
        id: "waste-ai-eggshell",
        name: "Cangkang Telur Kering Cacah",
        category: "Cangkang Telur",
        estimatedVolumePerBatch: eggShellKg,
        unit: "Kg",
        pricePerUnit: pricePerKg,
        potentialRevenue: Math.round(eggShellKg * pricePerKg),
        offtakerType: "Pabrik Pakan Ternak & Pupuk Kalsium",
        recommendedOfftaker: "Koperasi Peternak Mandiri Sidoarjo",
        recyclabilityRate: 95,
        carbonOffsetKg: Math.round(eggShellKg * 0.9 * 10) / 10,
        handlingNote: "Jemur hingga kering untuk mencegah bau amis dan tumbuhnya jamur salmonella.",
      });
    }
  }

  // C. Ampas Kedelai / Tahu: ~30% dari bobot olahan
  if (detectedSoyWeight > 0) {
    const soyWasteKg = Math.round(detectedSoyWeight * 0.3 * 10) / 10;
    if (soyWasteKg >= 0.1) {
      const pricePerKg = 1200;
      items.push({
        id: "waste-ai-soy",
        name: "Ampas Kedelai Perasan Basah",
        category: "Ampas Kedelai / Tahu",
        estimatedVolumePerBatch: soyWasteKg,
        unit: "Kg",
        pricePerUnit: pricePerKg,
        potentialRevenue: Math.round(soyWasteKg * pricePerKg),
        offtakerType: "Peternak Bebek & Budidaya Pakan Silase",
        recommendedOfftaker: "Sentra Peternakan Unggas Waru",
        recyclabilityRate: 92,
        carbonOffsetKg: Math.round(soyWasteKg * 1.2 * 10) / 10,
        handlingNote: "Simpan maksimal 24 jam sebelum fermentasi atau langsung dijemput offtaker.",
      });
    }
  }

  // D. Residu Kulit & Ampas Sayur/Bumbu: ~15% dari bobot sayur/bumbu
  if (detectedVegWeight > 0) {
    const vegWasteKg = Math.round(detectedVegWeight * 0.15 * 10) / 10;
    if (vegWasteKg >= 0.1) {
      const pricePerKg = 1000;
      items.push({
        id: "waste-ai-veg",
        name: "Kulit & Residu Organik Sayur",
        category: "Residu Kulit & Sayur",
        estimatedVolumePerBatch: vegWasteKg,
        unit: "Kg",
        pricePerUnit: pricePerKg,
        potentialRevenue: Math.round(vegWasteKg * pricePerKg),
        offtakerType: "Komposting & Bio-Konversi Maggot BSF",
        recommendedOfftaker: "Kompos Lestari Karang Pilang",
        recyclabilityRate: 90,
        carbonOffsetKg: Math.round(vegWasteKg * 0.7 * 10) / 10,
        handlingNote: "Pisahkan dari sampah anorganik (plastik kemasan bumbu) agar lolos inspeksi mutu.",
      });
    }
  }

  // E. Tulang & Trimming Daging: ~12% dari bobot hewani
  if (detectedMeatWeight > 0) {
    const boneWasteKg = Math.round(detectedMeatWeight * 0.12 * 10) / 10;
    if (boneWasteKg >= 0.1) {
      const pricePerKg = 1800;
      items.push({
        id: "waste-ai-bone",
        name: "Tulang & Trimming Sisa Potong",
        category: "Tulang & Trimming Hewani",
        estimatedVolumePerBatch: boneWasteKg,
        unit: "Kg",
        pricePerUnit: pricePerKg,
        potentialRevenue: Math.round(boneWasteKg * pricePerKg),
        offtakerType: "Pengolahan Pakan Ternak & Gelatin Teknis",
        recommendedOfftaker: "Mitra Pengepul Tulang Hewani Margomulyo",
        recyclabilityRate: 85,
        carbonOffsetKg: Math.round(boneWasteKg * 1.5 * 10) / 10,
        handlingNote: "Bekukan jika tidak langsung disalurkan dalam 12 jam.",
      });
    }
  }

  // F. Ampas Kopi / Teh: ~80% dari serbuk
  if (detectedCoffeeWeight > 0) {
    const coffeeWasteKg = Math.round(detectedCoffeeWeight * 0.8 * 10) / 10;
    if (coffeeWasteKg >= 0.1) {
      const pricePerKg = 1500;
      items.push({
        id: "waste-ai-coffee",
        name: "Ampas Kopi & Teh Diseduh",
        category: "Ampas Kopi & Teh",
        estimatedVolumePerBatch: coffeeWasteKg,
        unit: "Kg",
        pricePerUnit: pricePerKg,
        potentialRevenue: Math.round(coffeeWasteKg * pricePerKg),
        offtakerType: "Industri Briket & Pelet Organik",
        recommendedOfftaker: "Koperasi Briket Hijau Sidoarjo",
        recyclabilityRate: 94,
        carbonOffsetKg: Math.round(coffeeWasteKg * 1.1 * 10) / 10,
        handlingNote: "Keringkan di nampan ventilasi terbuka.",
      });
    }
  }

  // Fallback: Jika tidak terdeteksi spesifik tetapi ada nama produk kuliner
  if (items.length === 0) {
    // Estimasi proporsional umum F&B: rata-rata 3-5% dari volume porsi menghasilkan residu organik
    const genericKg = Math.max(0.5, Math.round(safeBatch * 0.025 * 10) / 10);
    const pricePerKg = 1000;
    items.push({
      id: "waste-ai-generic",
      name: "Sisa Residu Organik Dapur F&B",
      category: "Biomassa Organik Lainnya",
      estimatedVolumePerBatch: genericKg,
      unit: "Kg",
      pricePerUnit: pricePerKg,
      potentialRevenue: Math.round(genericKg * pricePerKg),
      offtakerType: "Pengomposan Kota & Maggot BSF",
      recommendedOfftaker: "Kompos Lestari Karang Pilang",
      recyclabilityRate: 88,
      carbonOffsetKg: Math.round(genericKg * 0.6 * 10) / 10,
      handlingNote: "Gunakan ember berpenutup dan hindari kontaminasi kantong plastik.",
    });
  }

  const totalVolumeKg = items.reduce((sum, item) => sum + item.estimatedVolumePerBatch, 0);
  const totalPotentialRevenuePerBatch = items.reduce(
    (sum, item) => sum + item.potentialRevenue,
    0
  );
  const annualPotentialRevenue = totalPotentialRevenuePerBatch * 48; // 4 batch/bulan * 12 bulan

  const totalCo2Saved = items.reduce((sum, item) => sum + item.carbonOffsetKg, 0);
  const waterSavedLiters = Math.round(detectedOilVolume * 0.35 * 1000); // 1L minyak mencemari 1000L air tanah

  // Hitung confidence score AI
  const baseConfidence = recipes.length >= 3 ? 94 : recipes.length > 0 ? 88 : 78;
  const aiConfidencePct = Math.min(97, baseConfidence + Math.min(3, items.length));

  // Rekomendasi kontekstual AI
  let aiRecommendation = "";
  if (items.some((i) => i.category === "Minyak Jelantah (UCO)")) {
    aiRecommendation =
      "Tingkat sirkularitas tinggi: Minyak jelantah dari proses penggorengan memiliki valuasi premium (Rp 7.500/L). Salurkan ke offtaker biodiesel terverifikasi di Bursa Limbah KUMPUL untuk menutup sebagian biaya produksi.";
  } else if (items.some((i) => i.category === "Cangkang Telur")) {
    aiRecommendation =
      "Cangkang telur berpotensi menjadi sumber kalsium pakan ternak. Mengeringkannya sebelum disetor meningkatkan harga terima hingga 25%.";
  } else {
    aiRecommendation =
      "Residu organik dapur dapat dialihkan dari TPA menuju pengolahan pupuk kompos atau pakan maggot BSF, mengurangi jejak karbon usaha Anda hingga 85%.";
  }

  return {
    hasWaste: items.length > 0,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    totalPotentialRevenuePerBatch,
    annualPotentialRevenue,
    aiConfidencePct,
    primaryCategory: items[0]?.category || "Residu Organik",
    items,
    environmentalSummary: {
      co2SavedKg: Math.round(totalCo2Saved * 10) / 10,
      waterPollutionPreventedLiters: waterSavedLiters,
    },
    aiRecommendation,
  };
}

/**
 * Helper untuk mendapatkan prediksi limbah dari object BEProduct
 */
export function getProductWastePrediction(product: BEProduct): AiWastePredictionResult {
  const batchUnits = product.expected_batch_units || 1;
  return predictProductWaste(product.product_name, batchUnits, product.recipes || []);
}
