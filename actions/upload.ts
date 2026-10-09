"use server";

import { beFetch } from "@/lib/api/be-client";
import { getAuthSession } from "@/lib/auth-cookies";

export interface UploadResultData {
  url: string;
  path: string;
  bucket: string;
  file_name: string;
  original_name: string;
  size: number;
  content_type: string;
}

export interface UploadActionResult {
  success: boolean;
  url?: string;
  data?: UploadResultData;
  message?: string;
}

/**
 * Server Action: Mengunggah file (gambar katalog, dokumen paspor mutu/lab, dll) ke Supabase Storage via backend Express
 */
export async function uploadFileAction(formData: FormData): Promise<UploadActionResult> {
  try {
    const session = await getAuthSession();
    if (session?.entityId && !formData.has("entity_id")) {
      formData.append("entity_id", session.entityId);
    }
    if (session?.roleId && !formData.has("supplier_role_id")) {
      formData.append("supplier_role_id", session.roleId);
    }

    const file = formData.get("file") || formData.get("image");
    if (!file) {
      return {
        success: false,
        message: "Tidak ada file yang dipilih untuk diunggah.",
      };
    }

    const res = await beFetch<UploadResultData>("/upload", {
      method: "POST",
      body: formData,
    });

    if (res.success && res.data?.url) {
      return {
        success: true,
        url: res.data.url,
        data: res.data,
        message: res.message || "File berhasil diunggah",
      };
    }

    return {
      success: false,
      message: res.message || "Gagal mengunggah file ke penyimpanan cloud",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kendala saat mengunggah file",
    };
  }
}

/**
 * Server Action: Menghapus file dari Supabase Storage (misal saat rollback simpan komoditas gagal)
 */
export async function deleteFileAction(path: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!path) return { success: false, message: "Path file tidak valid." };

    const res = await beFetch<{ path: string }>("/upload", {
      method: "DELETE",
      body: JSON.stringify({ path }),
    });

    return {
      success: res.success,
      message: res.message || "File berhasil dihapus dari penyimpanan",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus file dari penyimpanan",
    };
  }
}
