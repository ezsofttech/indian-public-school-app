"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api/health";

export function AdminOfflineGuard({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await checkBackendHealth(undefined, 3000, true);
      setIsOffline(!res.online);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  if (isOffline) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#f7fbff]">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 sm:p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            Server is currently unavailable. Please try again later.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Admin panel is temporarily disabled until backend connection is restored.
          </p>
          <button
            type="button"
            onClick={checkHealth}
            disabled={checking}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            {checking ? "Checking connection..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminOfflineGuard;
