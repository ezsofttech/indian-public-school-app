"use client";

import React, { useState } from "react";
import http from "@/lib/http";
import { KeyRound, Lock, Eye, EyeOff, LoaderCircle, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { API_URL } from "@/lib/config";

export default function ChangePasswordPage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Confirmation password does not match new password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await http.post(
        `${API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const msg = res.data?.message || "Password updated successfully!";
      setSuccess(msg);
      showToast(msg, "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (reason) {
      let msg = "Failed to update password.";
      if (http.isAxiosError(reason)) {
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

  return (
    <AdminShell title="Change Password">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1a5d9c]">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#102a4c]">
                Update Account Security
              </h2>
              <p className="text-xs text-slate-500">
                Change password for account ({user?.email || "Administrator"})
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#102a4c] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-950/15 transition hover:bg-[#1a5d9c] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              <span>{submitting ? "Updating Password..." : "Update Password"}</span>
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
