"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import http from "@/lib/http";
import { API_URL, AUTH_CONFIG } from "@/lib/config";
import { JwtPayload, ResourceKey } from "@/components/admin/types/admin.types";
import {
  parseJwt,
  isSuperAdminRole,
  hasPermission,
} from "@/components/admin/utils/admin.helpers";

export interface AuthContextValue {
  user: JwtPayload | null;
  token: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  allowedModules: string[];
  canAccessResource: (resourceKey: ResourceKey) => boolean;
  canUpdateResource: (resourceKey: ResourceKey) => boolean;
  canDeleteResource: (resourceKey: ResourceKey) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Read stored token on client mount
  useEffect(() => {
    let ignore = false;
    const storedToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_CONFIG.tokenStorageKey) || ""
        : "";

    if (!storedToken) {
      if (!ignore) {
        setToken("");
        setIsLoading(false);
      }
      return;
    }

    // Verify token expiration
    const parsed = parseJwt(storedToken);
    if (!parsed || (parsed.exp && parsed.exp * 1000 < Date.now())) {
      // Token is invalid or expired
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
        document.cookie = `${AUTH_CONFIG.sessionCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
      }
      if (!ignore) {
        setToken("");
        setIsLoading(false);
      }
      return;
    }

    if (!ignore) {
      setToken(storedToken);
      // Refresh cookie to match
      document.cookie = `${AUTH_CONFIG.sessionCookieName}=${encodeURIComponent(storedToken)}; Path=/; SameSite=Lax; Max-Age=${AUTH_CONFIG.cookieMaxAge}${location.protocol === "https:" ? "; Secure" : ""}`;
      setIsLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, []);

  const user = useMemo(() => {
    if (!token) return null;
    return parseJwt(token);
  }, [token]);

  const isSuperAdmin = useMemo(() => {
    return user ? isSuperAdminRole(user.role) : false;
  }, [user]);

  const allowedModules = useMemo(() => {
    if (!user || isSuperAdmin) return ["*"];
    return user.allowedModules || [];
  }, [user, isSuperAdmin]);

  const canAccessResource = useCallback(
    (resourceKey: ResourceKey): boolean => {
      return hasPermission(allowedModules, isSuperAdmin, resourceKey, "access");
    },
    [isSuperAdmin, allowedModules],
  );

  const canUpdateResource = useCallback(
    (resourceKey: ResourceKey): boolean => {
      return hasPermission(allowedModules, isSuperAdmin, resourceKey, "update");
    },
    [isSuperAdmin, allowedModules],
  );

  const canDeleteResource = useCallback(
    (resourceKey: ResourceKey): boolean => {
      if (resourceKey === "school-settings") return false;
      return hasPermission(allowedModules, isSuperAdmin, resourceKey, "delete");
    },
    [isSuperAdmin, allowedModules],
  );

  const setAuthToken = useCallback((newToken: string) => {
    if (newToken) {
      window.localStorage.setItem(AUTH_CONFIG.tokenStorageKey, newToken);
      document.cookie = `${AUTH_CONFIG.sessionCookieName}=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=${AUTH_CONFIG.cookieMaxAge}${location.protocol === "https:" ? "; Secure" : ""}`;
      setToken(newToken);
    } else {
      window.localStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
      document.cookie = `${AUTH_CONFIG.sessionCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
      setToken("");
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await http.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const payload = response.data?.data ?? response.data;
      if (!payload?.accessToken) {
        throw new Error("The API did not return an access token.");
      }

      setAuthToken(payload.accessToken);
    },
    [setAuthToken],
  );

  const logout = useCallback(() => {
    setAuthToken("");
    router.push("/admin/login");
  }, [router, setAuthToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      isSuperAdmin,
      allowedModules,
      canAccessResource,
      canUpdateResource,
      canDeleteResource,
      login,
      logout,
      setAuthToken,
    }),
    [
      user,
      token,
      isLoading,
      isSuperAdmin,
      allowedModules,
      canAccessResource,
      canUpdateResource,
      canDeleteResource,
      login,
      logout,
      setAuthToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
