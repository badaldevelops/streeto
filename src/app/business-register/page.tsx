"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const fieldClass = "min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function BusinessRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/business-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, aadhaarNumber, aadhaarConsent }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Business registration could not be submitted.");
        return;
      }
      setSubmitted(true);
      setAadhaarNumber("");
    } catch {
      setMessage("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#fffaf5] px-4 py-8 text-gray-900">
        <section className="w-full max-w-lg rounded-3xl border border-green-100 bg-white p-6 text-center shadow-xl sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl" aria-hidden="true">✓</div>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-green-700">Request submitted</p>
          <h1 className="mt-2 text-2xl font-black text-gray-950">Business verification is pending</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">Super Admin ko tumhari business, outlet aur licence details mil gayi hain. Approval ke baad tum Business Login se sign in kar paoge.</p>
          <Link href="/business-login" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-extrabold text-white">Go to Business Login</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#fffaf5] px-4 py-7 text-gray-900 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-orange-100 bg-white p-5 shadow-xl shadow-orange-950/10 sm:p-9">
        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">Qtoo Business</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Create your business account</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">Business, owner aur pehle outlet ki details ek hi baar bharo. Super Admin verify karega; approval ke baad account active hoga.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-7">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-lg font-extrabold text-gray-900">Business and owner</legend>
            <label className="text-sm font-bold text-gray-800">Business name *<input name="businessName" required maxLength={120} autoComplete="organization" placeholder="Enter registered business name" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800">Owner full name *<input name="ownerName" required maxLength={120} autoComplete="name" placeholder="Name of business owner" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800">Email *<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="owner@example.com" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800">Owner mobile number *<input name="phone" required type="tel" inputMode="numeric" autoComplete="tel-national" minLength={10} maxLength={10} pattern="[0-9]{10}" placeholder="10-digit mobile number" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800 sm:col-span-2">Password *<input name="password" required type="password" minLength={8} maxLength={72} autoComplete="new-password" placeholder="At least 8 characters" className={`${fieldClass} mt-1.5`} /></label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-lg font-extrabold text-gray-900">First outlet</legend>
            <label className="text-sm font-bold text-gray-800">Outlet name *<input name="outletName" required maxLength={120} placeholder="Name customers will see" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800">Food type *<select name="foodType" required defaultValue="" className={`${fieldClass} mt-1.5`}><option value="" disabled>Select food type</option><option value="VEG">Vegetarian</option><option value="NON_VEG">Non-vegetarian</option><option value="BOTH">Veg and non-veg</option></select></label>
            <label className="text-sm font-bold text-gray-800">City *<input name="city" required maxLength={100} autoComplete="address-level2" placeholder="City" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800">Locality / area *<input name="locality" required maxLength={100} autoComplete="address-level3" placeholder="Locality customers know" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800 sm:col-span-2">Complete outlet address *<textarea name="address" required maxLength={500} rows={3} autoComplete="street-address" placeholder="Shop number, road, landmark and complete address" className={`${fieldClass} mt-1.5 resize-y`} /></label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-lg font-extrabold text-gray-900">Verification details</legend>
            <label className="text-sm font-bold text-gray-800">FSSAI food licence / registration number *<input name="foodLicenseNumber" required maxLength={100} autoComplete="off" placeholder="Enter food licence number" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800">Food licence expiry date *<input name="foodLicenseExpiry" required type="date" className={`${fieldClass} mt-1.5`} /></label>
            <label className="text-sm font-bold text-gray-800 sm:col-span-2">Owner Aadhaar number *<input required type="password" inputMode="numeric" autoComplete="off" value={aadhaarNumber} onChange={(event) => setAadhaarNumber(event.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar number" className={`${fieldClass} mt-1.5`} /></label>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900 sm:col-span-2">Aadhaar number is collected only for Qtoo business-owner verification. It is encrypted, visible only to Super Admin reviewers, and the full number is deleted after approval; last four digits are retained for the verification record.</div>
            <label className="flex gap-3 rounded-xl border border-gray-200 p-3 text-xs leading-5 text-gray-700 sm:col-span-2"><input type="checkbox" checked={aadhaarConsent} onChange={(event) => setAadhaarConsent(event.target.checked)} required className="mt-0.5 h-4 w-4 shrink-0 accent-orange-600" /><span>I confirm that I am authorized to provide this Aadhaar number and consent to its use solely for verifying this Qtoo business registration.</span></label>
          </fieldset>

          {message && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{message}</p>}
          <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-extrabold text-white shadow-md shadow-orange-200 disabled:cursor-wait disabled:opacity-60">{loading ? "Submitting verification request…" : "Create business and request verification"}</button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">Already registered? <Link href="/business-login" className="font-bold text-orange-700 underline underline-offset-2">Business Login</Link></p>
        <p className="mt-3 text-center text-sm text-gray-500">Customer account? <Link href="/register" className="font-bold text-orange-700 underline underline-offset-2">Register as customer</Link></p>
      </section>
    </main>
  );
}
