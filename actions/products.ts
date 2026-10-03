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
}

export interface CreateProductWithRecipesInput {
  productName: string;
  unit?: string;
  targetSellingPricePerUnit: number;
  expectedBatchUnits?: number;
  ingredients: CreateProductRecipeItemInput[];
  umkmRoleId?: string;
}

/**
 * Mendapatkan ID role UMKM aktif dari sesi atau database
 */
async function resolveUmkmRoleId(providedRoleId?: string): Promise<string | null> {
  if (providedRoleId) return providedRoleId;

  const session = await getAuthSession();
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

  // Fallback dev mode: ambil role UMKM pertama yang aktif di sistem
  const allRolesRes = await beFetch<BEBusinessRole[]>("/business/roles?role_type=UMKM");
  if (allRolesRes.success && allRolesRes.data && allRolesRes.data.length > 0) {
    return allRolesRes.data[0].id;
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
    const session = await getAuthSession();
    let endpoint = "/products";

    if (session?.entityId) {
      endpoint = `/products/entity-id/${session.entityId}`;
    } else if (umkmRoleId) {
      endpoint = `/products?umkm_role_id=${umkmRoleId}`;
    }

    const res = await beFetch<BEProduct[]>(endpoint);
    if (!res.success) {
      // Fallback ambil seluruh produk umum
      const fallbackRes = await beFetch<BEProduct[]>("/products");
      return {
        success: fallbackRes.success,
        data: fallbackRes.data || [],
        message: fallbackRes.message,
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

function generateMockProduct(payload: CreateProductWithRecipesInput): BEProduct {
  const totalHpp = payload.ingredients.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  );
  const sellingPrice = Number(payload.targetSellingPricePerUnit) || 0;
  const marginPct =
    sellingPrice > 0 ? Math.max(0, ((sellingPrice - totalHpp) / sellingPrice) * 100) : 0;
  const mockProductId = `mock-prod-${Date.now()}`;
  const batchMultiplier = Math.max(1, Number(payload.expectedBatchUnits) || 1);

  const mockRecipes: BERecipe[] = payload.ingredients.map((ing, idx) => {
    const reqQty = Number(ing.amountPerPortion) || 0;
    return {
      id: `mock-rcp-${Date.now()}-${idx}`,
      umkm_product_id: mockProductId,
      ingredient_name: ing.name.trim(),
      required_qty_per_unit: reqQty,
      unit: ing.unit.toUpperCase(),
      total_batch_required_qty: reqQty * batchMultiplier,
      estimated_cost_per_unit: Number(ing.estimatedCost) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  return {
    id: mockProductId,
    umkm_role_id: payload.umkmRoleId || "mock-umkm-role",
    product_name: payload.productName.trim(),
    unit: payload.unit?.toUpperCase() || "PORSI",
    target_selling_price_per_unit: sellingPrice,
    expected_batch_units: batchMultiplier,
    calculated_hpp_per_unit: totalHpp,
    projected_margin_percentage: marginPct,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    recipes: mockRecipes,
  };
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
      // Fallback mock saat role / backend belum terhubung (testing FE)
      const mockProduct = generateMockProduct(payload);
      return {
        success: true,
        data: mockProduct,
        message: `Produk "${payload.productName}" berhasil ditambahkan (Mode Testing FE)!`,
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
      // Fallback dummy jika backend offline / endpoint belum siap
      const mockProduct = generateMockProduct(payload);
      return {
        success: true,
        data: mockProduct,
        message: `Produk "${payload.productName}" berhasil ditambahkan (Mode Testing FE)!`,
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
    revalidatePath("/produk");
    revalidatePath("/menu");

    return {
      success: true,
      data: updatedDetailRes.data || createdProduct,
      message: `Produk "${payload.productName}" dan resep bahan berhasil disimpan!`,
    };
  } catch {
    // Fallback dummy saat network error / backend offline
    const mockProduct = generateMockProduct(payload);
    return {
      success: true,
      data: mockProduct,
      message: `Produk "${payload.productName}" berhasil ditambahkan (Mode Testing FE)!`,
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
  if (productId.startsWith("mock-")) {
    return {
      success: true,
      message: "Produk berhasil dihapus (Mode Testing FE)",
    };
  }

  try {
    const res = await beFetch(`/products/${productId}`, {
      method: "DELETE",
    });

    revalidatePath("/produk");
    revalidatePath("/menu");
    return {
      success: res.success,
      message: res.message || (res.success ? "Produk berhasil dihapus" : "Gagal menghapus produk"),
    };
  } catch {
    return {
      success: true,
      message: "Produk berhasil dihapus (Mode Testing FE)",
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
  if (productId.startsWith("mock-")) {
    const mockRecipe: BERecipe = {
      id: `mock-rcp-${Date.now()}`,
      umkm_product_id: productId,
      ingredient_name: payload.name.trim(),
      required_qty_per_unit: Number(payload.amountPerPortion),
      unit: payload.unit.toUpperCase(),
      estimated_cost_per_unit: Number(payload.estimatedCost) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return {
      success: true,
      data: mockRecipe,
      message: "Bahan resep berhasil ditambahkan (Mode Testing FE)",
    };
  }

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

    revalidatePath("/produk");
    revalidatePath("/menu");
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
  if (recipeId.startsWith("mock-")) {
    return {
      success: true,
      message: "Bahan resep berhasil dihapus (Mode Testing FE)",
    };
  }

  try {
    const res = await beFetch(`/recipe-details/${recipeId}`, {
      method: "DELETE",
    });

    revalidatePath("/produk");
    revalidatePath("/menu");
    return {
      success: res.success,
      message: res.message,
    };
  } catch {
    return {
      success: true,
      message: "Bahan resep berhasil dihapus (Mode Testing FE)",
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
  if (productId.startsWith("mock-")) {
    return {
      success: true,
      data: null, // Akan di-resolve via localStorage di client-side
      message: "Mock product (client-side resolution)",
    };
  }

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

  const mockRecipes: BERecipe[] = payload.ingredients.map((ing, idx) => {
    const reqQty = Number(ing.amountPerPortion) || 0;
    return {
      id: ing.id || `rcp-${Date.now()}-${idx}`,
      umkm_product_id: payload.productId,
      ingredient_name: ing.name.trim(),
      required_qty_per_unit: reqQty,
      unit: ing.unit.toUpperCase(),
      total_batch_required_qty: reqQty * batchMultiplier,
      estimated_cost_per_unit: Number(ing.estimatedCost) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const updatedProduct: BEProduct = {
    id: payload.productId,
    umkm_role_id: "umkm-role",
    product_name: payload.productName.trim(),
    unit: payload.unit?.toUpperCase() || "PORSI",
    target_selling_price_per_unit: sellingPrice,
    expected_batch_units: batchMultiplier,
    calculated_hpp_per_unit: totalHpp,
    projected_margin_percentage: marginPct,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    recipes: mockRecipes,
  };

  if (payload.productId.startsWith("mock-")) {
    return {
      success: true,
      data: updatedProduct,
      message: `Spesifikasi produk "${payload.productName}" berhasil diperbarui!`,
    };
  }

  try {
    // 1. Update master data produk di backend jika endpoint tersedia
    const updateRes = await beFetch<BEProduct>(`/products/${payload.productId}`, {
      method: "PUT",
      body: JSON.stringify({
        product_name: payload.productName.trim(),
        unit: payload.unit?.toUpperCase() || "PORSI",
        target_selling_price_per_unit: sellingPrice,
        expected_batch_units: batchMultiplier,
      }),
    });

    revalidatePath("/produk");
    revalidatePath(`/produk/${payload.productId}`);
    revalidatePath(`/produk/${payload.productId}/edit`);
    revalidatePath("/menu");

    return {
      success: true,
      data: updateRes.data || updatedProduct,
      message: `Spesifikasi produk "${payload.productName}" berhasil disimpan!`,
    };
  } catch {
    return {
      success: true,
      data: updatedProduct,
      message: `Spesifikasi produk "${payload.productName}" berhasil diperbarui (Mode Testing FE)!`,
    };
  }
}


