/**
 * Modern Next.js Native HTTP Client
 * Zero-dependency replacement for Axios using web-standard fetch and XMLHttpRequest for upload progress.
 */

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  ok: boolean;
  headers: Headers;
  config?: HttpRequestConfig;
}

export interface HttpRequestConfig extends Omit<RequestInit, "body" | "headers"> {
  url?: string;
  method?: string;
  baseURL?: string;
  params?: Record<string, any>;
  data?: any;
  body?: any;
  headers?: Record<string, string | number | boolean | undefined> | HeadersInit;
  timeout?: number;
  onUploadProgress?: (progressEvent: { loaded: number; total: number; progress?: number }) => void;
  signal?: AbortSignal;
}

export class HttpError extends Error {
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers?: Headers;
  };
  status?: number;
  code?: string;
  isAxiosError = true;

  constructor(message: string, status?: number, data?: any, statusText?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    if (status !== undefined) {
      this.response = {
        status,
        statusText: statusText || "",
        data,
      };
    }
  }
}

export function isAxiosError(err: any): err is HttpError {
  return Boolean(err && (err.isAxiosError || err.response || err.name === "HttpError" || err.name === "AxiosError"));
}

export function buildUrlWithParams(url: string, params?: Record<string, any>): string {
  if (!params) return url;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "object") {
      searchParams.append(key, JSON.stringify(value));
    } else {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  if (!qs) return url;
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

export interface HttpClient {
  <T = any>(configOrUrl: string | HttpRequestConfig, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  create(defaultConfig?: HttpRequestConfig): HttpClient;
  isAxiosError(err: any): err is HttpError;
}

export function createHttpClient(defaultConfig: HttpRequestConfig = {}): HttpClient {
  const client = async function <T = any>(
    configOrUrl: string | HttpRequestConfig,
    overrideConfig?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    let mergedConfig: HttpRequestConfig = {};
    if (typeof configOrUrl === "string") {
      mergedConfig = { ...defaultConfig, ...overrideConfig, url: configOrUrl };
    } else {
      mergedConfig = { ...defaultConfig, ...configOrUrl };
    }

    const method = (mergedConfig.method || "GET").toUpperCase();
    let url = mergedConfig.url || "";
    if (mergedConfig.baseURL && !/^https?:\/\//i.test(url)) {
      const base = mergedConfig.baseURL.replace(/\/+$/, "");
      const path = url.replace(/^\/+/, "");
      url = `${base}/${path}`;
    }

    url = buildUrlWithParams(url, mergedConfig.params);

    const payload = mergedConfig.data !== undefined ? mergedConfig.data : mergedConfig.body;
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;

    // Handle Upload Progress using browser XMLHttpRequest
    if (mergedConfig.onUploadProgress && typeof window !== "undefined" && isFormData) {
      return new Promise<HttpResponse<T>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        if (mergedConfig.headers) {
          const rawHeaders = mergedConfig.headers as Record<string, string>;
          Object.entries(rawHeaders).forEach(([k, v]) => {
            if (k.toLowerCase() !== "content-type" && v) {
              xhr.setRequestHeader(k, String(v));
            }
          });
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && mergedConfig.onUploadProgress) {
            const pct = Math.round((e.loaded * 100) / e.total);
            mergedConfig.onUploadProgress({ loaded: e.loaded, total: e.total, progress: pct });
          }
        };

        xhr.onload = () => {
          let responseData: any;
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch {
            responseData = xhr.responseText;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              data: responseData,
              status: xhr.status,
              statusText: xhr.statusText,
              ok: true,
              headers: new Headers(),
              config: mergedConfig,
            });
          } else {
            const msg = responseData?.message
              ? Array.isArray(responseData.message)
                ? responseData.message.join(", ")
                : String(responseData.message)
              : `Request failed with status code ${xhr.status}`;
            reject(new HttpError(msg, xhr.status, responseData, xhr.statusText));
          }
        };

        xhr.onerror = () => {
          reject(new HttpError("Network error occurred", 0, null, "Network Error"));
        };

        xhr.ontimeout = () => {
          reject(new HttpError("Request timed out", 0, null, "Timeout"));
        };

        if (mergedConfig.timeout) {
          xhr.timeout = mergedConfig.timeout;
        }

        xhr.send(payload as any);
      });
    }

    // Standard native fetch execution
    const headers = new Headers();
    if (mergedConfig.headers) {
      if (typeof Headers !== "undefined" && mergedConfig.headers instanceof Headers) {
        mergedConfig.headers.forEach((v, k) => headers.set(k, v));
      } else if (Array.isArray(mergedConfig.headers)) {
        mergedConfig.headers.forEach(([k, v]) => headers.set(k, v));
      } else {
        Object.entries(mergedConfig.headers).forEach(([k, v]) => {
          if (v !== undefined && v !== null) headers.set(k, String(v));
        });
      }
    }
    if (!isFormData && payload !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let controller: AbortController | null = null;
    let timeoutId: any = null;

    if (mergedConfig.timeout && !mergedConfig.signal) {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller?.abort();
      }, mergedConfig.timeout);
    }

    const fetchSignal = mergedConfig.signal || controller?.signal;

    let bodyContent: BodyInit | undefined = undefined;
    if (payload !== undefined && payload !== null && method !== "GET" && method !== "HEAD") {
      if (isFormData || typeof payload === "string" || payload instanceof Blob || payload instanceof ArrayBuffer) {
        bodyContent = payload as BodyInit;
      } else {
        bodyContent = JSON.stringify(payload);
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyContent,
        signal: fetchSignal,
        cache: mergedConfig.cache || "no-store",
      });

      if (timeoutId) clearTimeout(timeoutId);

      let responseData: any = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const errorMsg = responseData?.message
          ? Array.isArray(responseData.message)
            ? responseData.message.join(", ")
            : String(responseData.message)
          : `Request failed with status code ${response.status}`;
        throw new HttpError(errorMsg, response.status, responseData, response.statusText);
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: response.headers,
        config: mergedConfig,
      };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err instanceof HttpError) throw err;
      const isAbort = err?.name === "AbortError";
      const message = isAbort ? "Request timed out" : err?.message || "Network Error";
      const error = new HttpError(message, 0, null, isAbort ? "Timeout" : "NetworkError");
      error.code = isAbort ? "ECONNABORTED" : "ERR_NETWORK";
      throw error;
    }
  } as HttpClient;

  client.get = <T = any>(url: string, config?: HttpRequestConfig) =>
    client<T>(url, { ...config, method: "GET" });

  client.post = <T = any>(url: string, data?: any, config?: HttpRequestConfig) =>
    client<T>(url, { ...config, method: "POST", data });

  client.put = <T = any>(url: string, data?: any, config?: HttpRequestConfig) =>
    client<T>(url, { ...config, method: "PUT", data });

  client.patch = <T = any>(url: string, data?: any, config?: HttpRequestConfig) =>
    client<T>(url, { ...config, method: "PATCH", data });

  client.delete = <T = any>(url: string, config?: HttpRequestConfig) =>
    client<T>(url, { ...config, method: "DELETE" });

  client.create = (cfg?: HttpRequestConfig) => createHttpClient({ ...defaultConfig, ...cfg });
  client.isAxiosError = isAxiosError;

  return client;
}

export const http = createHttpClient();
export default http;

// Axios Type Compatibility Aliases
export type AxiosInstance = HttpClient;
export type AxiosResponse<T = any> = HttpResponse<T>;
export type AxiosRequestConfig = HttpRequestConfig;
export type AxiosError = HttpError;
