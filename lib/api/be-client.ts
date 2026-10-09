/**
 * Unified Backend Express API Client Helper
 */

const DEFAULT_BACKEND_URL = (
  process.env.BACKEND_API_URL || "http://localhost:3030/api"
).replace(/\/$/, "");

const FALLBACK_BACKEND_URL = "http://localhost:3000/api";

export interface BEApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  error_code?: string;
  error_details?: Array<{ issue?: string; message?: string }>;
}

export async function beFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errorCode?: string }> {
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const buildUrl = (base: string) => {
    const cleanBase = base.replace(/\/$/, "");
    if (cleanBase.endsWith("/api") && (cleanEndpoint === "/api" || cleanEndpoint.startsWith("/api/"))) {
      const trimmed = cleanEndpoint.replace(/^\/api/, "");
      return `${cleanBase}${trimmed || "/"}`;
    }
    return `${cleanBase}${cleanEndpoint}`;
  };

  const urls = [
    buildUrl(DEFAULT_BACKEND_URL),
    buildUrl(FALLBACK_BACKEND_URL),
  ];

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
      const headers: Record<string, string> = isFormData
        ? { ...((options.headers as Record<string, string>) || {}) }
        : {
            "Content-Type": "application/json",
            ...((options.headers as Record<string, string>) || {}),
          };

      const res = await fetch(url, {
        ...options,
        headers,
        cache: "no-store",
      });

      const json = (await res.json().catch(() => null)) as BEApiResponse<T> | null;

      if (!res.ok || json?.status === "error") {
        let msg = json?.message || `Request failed with HTTP status ${res.status}`;
        if (Array.isArray(json?.error_details) && json.error_details.length > 0) {
          const issues = json.error_details
            .map((d) => d.issue || d.message)
            .filter(Boolean);
          if (issues.length > 0) msg = issues.join(". ");
        }
        return {
          success: false,
          message: msg,
          errorCode: json?.error_code,
        };
      }

      return {
        success: true,
        data: json?.data,
        message: json?.message,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try fallback URL if connection refused
      continue;
    }
  }

  return {
    success: false,
    message: lastError ? `Backend unreachable: ${lastError.message}` : "Backend unreachable",
  };
}
