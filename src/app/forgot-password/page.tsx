"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to send a reset link right now.");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Unable to send a reset link right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#fffaf5] px-4 py-8 text-gray-900">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-600">Qtoo account recovery</p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">Forgot your password?</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Enter your registered email. If it belongs to an account, we’ll send a secure link to choose a new password.</p>
        <form onSubmit={requestReset} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-gray-800" htmlFor="email">Registered email</label>
          <input id="email" required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="you@example.com" />
          {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-extrabold text-white disabled:opacity-50">{loading ? "Sending…" : "Send reset link"}</button>
        </form>
        <p className="mt-5 text-center text-sm"><Link href="/login" className="font-bold text-orange-700 underline underline-offset-2">Back to login</Link></p>
      </section>
    </main>
  );
}
