"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { GraduationCap, LoaderCircle, LockKeyhole } from "lucide-react";
import { DEFAULT_CREST_LOGO, imageUrl } from "@/lib/site-data";

const API_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

export function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin.ips@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const payload = response.data?.data ?? response.data;
      if (!payload.accessToken) throw new Error("The API did not return an access token.");

      window.localStorage.setItem("ips_admin_token", payload.accessToken);
      document.cookie = `ips_admin_session=${encodeURIComponent(payload.accessToken)}; Path=/; SameSite=Lax; Max-Age=604800${location.protocol === "https:" ? "; Secure" : ""}`;
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (reason) {
      setError(axios.isAxiosError(reason) ? String(reason.response?.data?.message || "Invalid email or password.") : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-[#eef4fb] p-5">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white bg-white p-8 shadow-2xl shadow-blue-950/10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 ring-4 ring-blue-50 shadow-lg border border-slate-100 overflow-hidden">
        <img
          src={imageUrl(DEFAULT_CREST_LOGO)}
          alt="IPS Shield Crest Logo"
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
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#bd8418]">Indian Public School</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-[#102a4c]">Admin sign in</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use your authorised school account to access administration.</p>
      {error && <p className="mt-5 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      <label className="mt-6 block text-sm font-bold text-slate-700">Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100" /></label>
      <label className="mt-4 block text-sm font-bold text-slate-700">Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100" /></label>
      <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a5d9c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#124c81] disabled:opacity-60">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <LockKeyhole size={17} />} {loading ? "Signing in…" : "Sign in securely"}</button>
    </form>
  </main>;
}
