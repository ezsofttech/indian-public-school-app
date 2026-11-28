import { apiClient } from "@/lib/api-client";
import { API_ROOT_URL, TIMEOUTS } from "@/lib/config";
import http from "@/lib/http";

export interface HealthVisitorData {
  source?: string;
  viewCount?: number;
  [key: string]: unknown;
}

export interface BackendHealthResult {
  online: boolean;
  data?: HealthVisitorData;
  source?: string;
  checkedAt: string;
}

/**
 * Resolves the client domain/origin to pass as source query parameter.
 * Prefers window.location.host (e.g. localhost:3000 or ips.edu.in in prod).
 */
export function getClientSource(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.host || window.location.hostname || "";
}

let cachedHealth: { result: BackendHealthResult; expiresAt: number } | null = null;

/**
 * Checks backend health route and records visitor source domain.
 * Calls /health or /api/v1/health?source=<domain>
 */
export async function checkBackendHealth(
  customSource?: string,
  timeoutMs: number = TIMEOUTS.healthCheck,
  forceCheck: boolean = false,
): Promise<BackendHealthResult> {
  const now = Date.now();
  if (!forceCheck && cachedHealth && cachedHealth.expiresAt > now) {
    return cachedHealth.result;
  }

  const source = customSource ?? getClientSource();
  const query = source ? `?source=${encodeURIComponent(source)}` : "";

  let isOnline = false;
  let responseData: HealthVisitorData | undefined = undefined;

  try {
    const res = await apiClient.get<any>(`/health${query}`, {
      timeout: timeoutMs,
    });
    isOnline = res.status >= 200 && res.status < 300 && res.data?.success !== false;
    responseData = typeof res.data === "object" ? res.data : undefined;
  } catch {
    try {
      const res = await http.get<any>(`${API_ROOT_URL}/health${query}`, {
        timeout: timeoutMs,
        headers: { Accept: "application/json" },
      });
      isOnline = res.status >= 200 && res.status < 300 && res.data?.success !== false;
      responseData = typeof res.data === "object" ? res.data : undefined;
    } catch {
      isOnline = false;
    }
  }

  const result: BackendHealthResult = {
    online: isOnline,
    data: responseData,
    source,
    checkedAt: new Date().toISOString(),
  };

  cachedHealth = {
    result,
    expiresAt: now + (isOnline ? 15000 : 3000),
  };

  return result;
}
