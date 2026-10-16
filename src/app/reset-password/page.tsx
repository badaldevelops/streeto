"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resetToken = window.location.hash.slice(1);
    setToken(resetToken);
    if (resetToken) window.history.replaceState(null, "", window.location.pathname);
    else setError("This reset link is missing or expired. Request a new one.");
  }, []);

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("This reset link is missing or invalid. Request a new one.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "This reset link has expired. Request a new one.");
        return;
      }
      setMessage(data.message || "Your password has been changed. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to change your password right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#fffaf5] px-4 py-8 text-gray-900">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-600">Qtoo account recovery</p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Choose a password with at least 8 characters. Your reset link can only be used once.</p>
        <form onSubmit={resetPassword} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-gray-800" htmlFor="new-password">New password</label>
          <input id="new-password" required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          <label className="block text-sm font-bold text-gray-800" htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          {!message && <button type="submit" disabled={loading || !token} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-extrabold text-white disabled:opacity-50">{loading ? "Saving…" : "Save new password"}</button>}
        </form>
        {message && <Link href="/login" className="mt-5 block text-center text-sm font-bold text-orange-700 underline underline-offset-2">Go to login</Link>}
        {error && <Link href="/forgot-password" className="mt-5 block text-center text-sm font-bold text-orange-700 underline underline-offset-2">Request a new reset link</Link>}
      </section>
    </main>
  );
}
