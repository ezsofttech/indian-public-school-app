"use client";

import { useToast } from "@/contexts/toast-context";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "success"
              ? "border-emerald-200 bg-white/95 text-emerald-900 shadow-emerald-950/5 ring-1 ring-emerald-500/10"
              : toast.type === "error"
                ? "border-rose-200 bg-white/95 text-rose-900 shadow-rose-950/5 ring-1 ring-rose-500/10"
                : "border-sky-200 bg-white/95 text-sky-900 shadow-sky-950/5 ring-1 ring-sky-500/10"
          }`}
        >
          <div className="shrink-0 pt-0.5">
            {toast.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            {toast.type === "error" && (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            )}
            {toast.type === "info" && (
              <Info className="h-5 w-5 text-sky-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold leading-relaxed text-slate-800">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Dismiss toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
