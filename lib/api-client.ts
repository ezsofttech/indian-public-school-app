import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import {
  checkBackendHealth as checkHealthResult,
  getClientSource,
  type BackendHealthResult,
  type HealthVisitorData,
} from "@/lib/api/health";

export type { BackendHealthResult, HealthVisitorData };
export { getClientSource };

export type ApiRecord = Record<string, unknown>;

export interface ApiEnvelope<T> {
  statusCode: number;
  status?: number;
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown> | null;
  timestamp?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const API_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/$/, "");

// On server-side (Node.js SSR), resolve localhost to 127.0.0.1 to avoid Windows IPv6 (::1) lookup timeouts
const baseURL = typeof window === "undefined"
  ? API_URL.replace("://localhost:5000", "://127.0.0.1:5000")
  : API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: { Accept: "application/json" },
});

export async function checkBackendHealth(timeoutMs = 3000, forceCheck = false): Promise<boolean> {
  const result = await checkHealthResult(undefined, timeoutMs, forceCheck);
  return result.online;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "ASC" | "DESC" | 1 | -1;
  filter?: string | Record<string, unknown>;
  [key: string]: unknown;
}

export function buildQueryParams(params?: PaginationParams | Record<string, unknown>): Record<string, string> {
  if (!params) return {};
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "object") {
      query[key] = JSON.stringify(value);
    } else {
      query[key] = String(value);
    }
  }
  return query;
}

export async function getApi<T>(
  path: string,
  params?: PaginationParams | Record<string, unknown>
): Promise<ApiEnvelope<T>> {
  const response = await apiClient.get<ApiEnvelope<T>>(path, {
    params: buildQueryParams(params),
  });
  return response.data;
}

export async function getOptionalApi<T>(
  path: string,
  params?: PaginationParams | Record<string, unknown>
): Promise<ApiEnvelope<T> | null> {
  try {
    return await getApi<T>(path, params);
  } catch (err: any) {
    // Suppress noisy network error warnings when backend is intentionally offline/unattached
    if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
      return null;
    }
    console.warn(`[getOptionalApi] Warning for ${path}:`, err?.message || err);
    return null;
  }
}

export function unwrapSetting<T extends ApiRecord>(
  response: ApiEnvelope<T | { value?: T; _doc?: { value?: T } }> | T | null | undefined,
): T {
  if (!response) return {} as T;
  const raw = typeof response === "object" && "data" in response && response.data ? (response.data as ApiRecord) : (response as ApiRecord);
  if (!raw || typeof raw !== "object") return {} as T;

  if (raw.value && typeof raw.value === "object" && !Array.isArray(raw.value)) {
    const val = raw.value as ApiRecord;
    if (val._doc && typeof val._doc === "object") return val._doc as T;
    return val as T;
  }

  if (raw._doc && typeof raw._doc === "object") {
    const doc = raw._doc as ApiRecord;
    if (doc.value && typeof doc.value === "object") return doc.value as T;
    return doc as T;
  }

  return raw as T;
}

export function unwrapCollection<T>(
  response: ApiEnvelope<T[] | PaginatedData<T>> | null,
): T[] {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;

  return Array.isArray(response.data.items) ? response.data.items : [];
}

export type ApiResponse<T> = AxiosResponse<ApiEnvelope<T>>;
