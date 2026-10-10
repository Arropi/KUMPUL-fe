"use server";

import { revalidatePath } from "next/cache";
import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";
import type { BEProduct, BERecipe, BEBusinessRole } from "@/lib/api/types";

export interface CreateProductRecipeItemInput {
  name: string;
  amountPerPortion: number;
  unit: string;
  estimatedCost?: number;
  sector?: string;
}

export interface CreateProductWithRecipesInput {
  productName: string;
  unit?: string;
  targetSellingPricePerUnit: number;
  expectedBatchUnits?: number;
  productionIterationsPerDay?: number;
  unitsPerIteration?: number;
  ingredients: CreateProductRecipeItemInput[];
  umkmRoleId?: string;
}

export interface UpdateProductWithRecipesInput extends CreateProductWithRecipesInput {
  productId: string;
}

/**
 * Mendapatkan ID role UMKM aktif dari sesi atau database
 */
async function resolveUmkmRoleId(providedRoleId?: string): Promise<string | null> {
  if (providedRoleId) return providedRoleId;

  let session = null;
  try {
    session = await getAuthSession();
  } catch {
    // outside request context
  }

  if (session?.roleId && session.role === "umkm") {
    return session.roleId;
  }

  // Jika session memiliki entityId, cari role UMKM terkait
  if (session?.entityId) {
    const rolesRes = await beFetch<BEBusinessRole[]>(
      `/business/roles?entity_id=${session.entityId}&role_type=UMKM`
    );
    if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
      return rolesRes.data[0].id;
    }
  }

  return null;
}

/**
 * Server Action: Mengambil seluruh daftar produk UMKM beserta komponen resep
 */
export async function getUmkmProductsAction(umkmRoleId?: string): Promise<{
  success: boolean;
  data: BEProduct[];
  message?: string;
}> {
  try {
    let session = null;
    try {
      session = await getAuthSession();
    } catch {
      // outside request context
    }
    let endpoint = "";

    if (session?.entityId) {
      endpoint = `/products/entity-id/${session.entityId}`;
    } else if (umkmRoleId) {
      endpoint = `/products?umkm_role_id=${umkmRoleId}`;
    } else if (session?.roleId) {
      endpoint = `/products?umkm_role_id=${session.roleId}`;
    } else {
      // Akun belum memiliki entity atau role UMKM terdaftar
      return {
        success: true,
        data: [],
      };
    }

    const res = await beFetch<BEProduct[]>(endpoint);
    if (!res.success) {
      return {
        success: false,
        data: [],
        message: res.message,
      };
    }

    return {
      success: true,
      data: res.data || [],
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Gagal memuat produk UMKM",
    };
  }
}



/**
 * Server Action: Menambahkan menu produk UMKM baru beserta detail resep bahan (Bill of Materials)
 */
export async function createProductWithRecipesAction(
  payload: CreateProductWithRecipesInput
): Promise<{
  success: boolean;
  data?: BEProduct;
  message?: string;
}> {
  try {
    const roleId = await resolveUmkmRoleId(payload.umkmRoleId);
    if (!roleId) {
      return {
        success: false,
        message: "Peran UMKM tidak ditemukan. Silakan lengkapi profil usaha atau login ulang.",
      };
    }

    // 1. Buat Produk UMKM di Backend
    const createProductRes = await beFetch<BEProduct>("/products", {
      method: "POST",
      body: JSON.stringify({
        umkm_role_id: roleId,
        product_name: payload.productName.trim(),
        unit: payload.unit?.toUpperCase() || "PORSI",
        target_selling_price_per_unit: Number(payload.targetSellingPricePerUnit),
        expected_batch_units: Math.max(1, Number(payload.expectedBatchUnits) || 1),
      }),
    });

    if (!createProductRes.success || !createProductRes.data) {
      return {
        success: false,
        message: createProductRes.message || "Gagal membuat produk di backend",
      };
    }

    const createdProduct = createProductRes.data;
    const productId = createdProduct.id;

    // 2. Tambahkan setiap resep bahan ke produk terkait
    if (payload.ingredients && payload.ingredients.length > 0) {
      for (const ing of payload.ingredients) {
        if (!ing.name.trim()) continue;

        await beFetch<BERecipe>(`/products/${productId}/recipes`, {
          method: "POST",
          body: JSON.stringify({
            ingredient_name: ing.name.trim(),
            required_qty_per_unit: Number(ing.amountPerPortion),
            unit: ing.unit.toUpperCase(),
            estimated_cost_per_unit: Number(ing.estimatedCost) || 0,
          }),
        });
      }
    }

    // 3. Ambil detail produk terbaru dengan HPP & margin yang telah dihitung backend
    const updatedDetailRes = await beFetch<BEProduct>(`/products/${productId}`);
    try {
      revalidatePath("/produk");
      revalidatePath("/menu");
    } catch {}
    return {
      success: true,
      data: updatedDetailRes.data || createdProduct,
      message: `Produk "${payload.productName}" dan resep bahan berhasil disimpan!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat menambahkan produk",
    };
  }
}

/**
 * Server Action: Memperbarui produk UMKM beserta resep bahan (Edit Mode)
 */
export async function updateProductWithRecipesAction(
  payload: UpdateProductWithRecipesInput
): Promise<{
  success: boolean;
  data?: BEProduct;
  message?: string;
}> {
  try {
    const productId = payload.productId;
    if (!productId) {
      return {
        success: false,
        message: "ID Produk tidak ditemukan untuk diperbarui.",
      };
    }

    // 1. Update data dasar produk di Backend Express
    const updateProductRes = await beFetch<BEProduct>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify({
        product_name: payload.productName.trim(),
        unit: payload.unit?.toUpperCase() || "PORSI",
        target_selling_price_per_unit: Number(payload.targetSellingPricePerUnit),
        expected_batch_units: Math.max(1, Number(payload.expectedBatchUnits) || 1),
      }),
    });

    // 2. Refresh resep jika backend mendukung atau tambah komponen baru
    if (payload.ingredients && payload.ingredients.length > 0) {
      for (const ing of payload.ingredients) {
        if (!ing.name.trim()) continue;
        await beFetch<BERecipe>(`/products/${productId}/recipes`, {
          method: "POST",
          body: JSON.stringify({
            ingredient_name: ing.name.trim(),
            required_qty_per_unit: Number(ing.amountPerPortion),
            unit: ing.unit.toUpperCase(),
            estimated_cost_per_unit: Number(ing.estimatedCost) || 0,
          }),
        });
      }
    }

    const updatedDetailRes = await beFetch<BEProduct>(`/products/${productId}`);
    revalidatePath("/menu");

    return {
      success: true,
      data: updatedDetailRes.data || updateProductRes.data,
      message: `Menu "${payload.productName}" berhasil diperbarui!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memperbarui menu.",
    };
  }
}

/**
 * Server Action: Menghapus produk UMKM beserta seluruh resep terkait
 */
export async function deleteProductAction(productId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const res = await beFetch(`/products/${productId}`, {
      method: "DELETE",
    });

    try {
      revalidatePath("/produk");
      revalidatePath("/menu");
    } catch {}
    return {
      success: res.success,
      message: res.message || (res.success ? "Produk berhasil dihapus" : "Gagal menghapus produk"),
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus produk",
    };
  }
}

/**
 * Server Action: Menambahkan bahan resep tunggal ke produk
 */
export async function addRecipeItemAction(
  productId: string,
  payload: CreateProductRecipeItemInput
): Promise<{
  success: boolean;
  data?: BERecipe;
  message?: string;
}> {
  try {
    const res = await beFetch<BERecipe>(`/products/${productId}/recipes`, {
      method: "POST",
      body: JSON.stringify({
        ingredient_name: payload.name.trim(),
        required_qty_per_unit: Number(payload.amountPerPortion),
        unit: payload.unit.toUpperCase(),
        estimated_cost_per_unit: Number(payload.estimatedCost) || 0,
      }),
    });

    try {
      revalidatePath("/produk");
      revalidatePath("/menu");
    } catch {}
    return {
      success: res.success,
      data: res.data,
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menambahkan bahan resep",
    };
  }
}

/**
 * Server Action: Menghapus bahan resep berdasarkan ID
 */
export async function deleteRecipeItemAction(recipeId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const res = await beFetch(`/recipe-details/${recipeId}`, {
      method: "DELETE",
    });

    try {
      revalidatePath("/produk");
      revalidatePath("/menu");
    } catch {}
    return {
      success: res.success,
      message: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus bahan resep",
    };
  }
}

/**
 * Server Action: Mengambil detail satu produk UMKM beserta resep berdasarkan ID
 */
export async function getProductByIdAction(productId: string): Promise<{
  success: boolean;
  data?: BEProduct | null;
  message?: string;
}> {
  try {
    const res = await beFetch<BEProduct>(`/products/${productId}`);
    if (res.success && res.data) {
      return {
        success: true,
        data: res.data,
      };
    }
    return {
      success: false,
      data: null,
      message: res.message || "Produk tidak ditemukan",
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: null,
      message: err instanceof Error ? err.message : "Gagal memuat detail produk",
    };
  }
}

export interface UpdateProductInput {
  productId: string;
  productName: string;
  unit?: string;
  targetSellingPricePerUnit: number;
  expectedBatchUnits?: number;
  ingredients: {
    id?: string;
    name: string;
    amountPerPortion: number;
    unit: string;
    estimatedCost?: number;
  }[];
}

/**
 * Server Action: Memperbarui spesifikasi produk dan komposisi resep
 */
export async function updateProductAction(payload: UpdateProductInput): Promise<{
  success: boolean;
  data?: BEProduct;
  message?: string;
}> {
  const sellingPrice = Number(payload.targetSellingPricePerUnit) || 0;
  const batchMultiplier = Math.max(1, Number(payload.expectedBatchUnits) || 1);
  const totalHpp = payload.ingredients.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  );
  const marginPct =
    sellingPrice > 0 ? Math.max(0, ((sellingPrice - totalHpp) / sellingPrice) * 100) : 0;

  try {
    // 1. Update master data produk di backend
    const updateRes = await beFetch<BEProduct>(`/products/${payload.productId}`, {
      method: "PUT",
      body: JSON.stringify({
        product_name: payload.productName.trim(),
        unit: payload.unit?.toUpperCase() || "PORSI",
        target_selling_price_per_unit: sellingPrice,
        expected_batch_units: batchMultiplier,
      }),
    });

    if (!updateRes.success) {
      return {
        success: false,
        message: updateRes.message || "Gagal memperbarui data produk di backend",
      };
    }

    // 2. Sinkronkan resep bahan (tambah baru atau perbarui yang ada)
    if (payload.ingredients && payload.ingredients.length > 0) {
      for (const ing of payload.ingredients) {
        if (!ing.name.trim()) continue;
        if (!ing.id || ing.id.startsWith("mock-") || ing.id.startsWith("rcp-")) {
          await beFetch<BERecipe>(`/products/${payload.productId}/recipes`, {
            method: "POST",
            body: JSON.stringify({
              ingredient_name: ing.name.trim(),
              required_qty_per_unit: Number(ing.amountPerPortion),
              unit: ing.unit.toUpperCase(),
              estimated_cost_per_unit: Number(ing.estimatedCost) || 0,
            }),
          });
        } else {
          await beFetch<BERecipe>(`/products/${payload.productId}/recipes/${ing.id}`, {
            method: "PUT",
            body: JSON.stringify({
              ingredient_name: ing.name.trim(),
              required_qty_per_unit: Number(ing.amountPerPortion),
              unit: ing.unit.toUpperCase(),
              estimated_cost_per_unit: Number(ing.estimatedCost) || 0,
            }),
          });
        }
      }
    }

    const detailRes = await beFetch<BEProduct>(`/products/${payload.productId}`);

    try {
      revalidatePath("/produk");
      revalidatePath(`/produk/${payload.productId}`);
      revalidatePath(`/produk/${payload.productId}/edit`);
      revalidatePath("/menu");
    } catch {}
    return {
      success: true,
      data: detailRes.data || updateRes.data,
      message: `Spesifikasi produk "${payload.productName}" berhasil disimpan!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui produk",
    };
  }
}


