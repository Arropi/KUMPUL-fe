"use server";

import { beFetch } from "@/lib/api/be-client";

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
