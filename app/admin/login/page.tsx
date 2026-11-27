"use client";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { DEFAULT_CREST_LOGO, imageUrl } from "@/lib/site-data";
import { CloudStatusIcon } from "@/components/ui/CloudStatusIcon";

export default function AdminLoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("admin.ips@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/admin") ? next : "/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      showToast("Signed in successfully. Welcome back!", "success");
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/admin") ? next : "/admin/dashboard");
    } catch (reason) {
      let msg = "Invalid email or password.";
      if (axios.isAxiosError(reason)) {
        msg = reason.response?.data?.message || reason.message || msg;
      } else if (reason instanceof Error) {
        msg = reason.message;
      }
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#102a4c]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#0a1b33_0%,#102a4c_50%,#1a5d9c_100%)] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-9 shadow-2xl border border-white/20">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-[#d7e4ef] bg-white p-2 shadow-md ring-4 ring-blue-50/50">
            <img
              src={imageUrl(DEFAULT_CREST_LOGO)}
              alt="Indian Public School Crest"
              className="h-full w-full object-contain mix-blend-multiply"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedLocal) {
                  target.dataset.triedLocal = "true";
                  target.src = "/assets/Settings/Logos/IPSStandardLogo.png";
                }
              }}
            />
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#bd8418]">
            Indian Public School
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#102a4c]">
            Admin Sign In
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6b7c8f]">
            Management & Operations Portal
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.com"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-2xs outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-2xs outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#102a4c] py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#1a5d9c] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <LockKeyhole size={18} />
            )}
            <span>{submitting ? "Signing in..." : "Sign in securely"}</span>
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <ShieldCheck size={14} className="text-emerald-600" />
            Protected Console
          </span>
          <CloudStatusIcon />
        </div>
      </div>
    </div>
  );
}
