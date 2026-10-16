"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type OutletPayout = {
  outletId: string;
  outletName: string;
  dueAmount: number;
  withdrawableAmount: number;
  requestedAmount: number;
  dueCount: number;
  paidAmount: number;
  paidCount: number;
  duePayments: Array<{ id: string; orderNumber: string; amount: number; grossAmount: number; commissionAmount: number; commissionGst: number; createdAt: string; payoutStatus: "PENDING" | "REQUESTED" }>;
  paidPayments: Array<{ orderNumber: string; amount: number; paidAt: string | null; reference: string | null }>;
  requests: Array<{ id: string; amount: number; requestedAt: string }>;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PayoutsPage() {
  const [outlets, setOutlets] = useState<OutletPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/business-admin/payouts", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load outlet earnings.");
      setOutlets(data.outlets || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load outlet earnings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function requestWithdrawal(outlet: OutletPayout) {
    if (!window.confirm(`Super Admin se ${money(outlet.withdrawableAmount)} withdrawal request bhejein for ${outlet.outletName}?`)) return;
    setSaving(outlet.outletId);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/business-admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outletId: outlet.outletId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request withdrawal.");
      setMessage(`${money(data.payoutRequest.amount)} withdrawal request Super Admin ko bhej di gayi.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request withdrawal.");
    } finally {
      setSaving(null);
    }
  }

  const totalBalance = outlets.reduce((sum, outlet) => sum + outlet.dueAmount, 0);
  const totalWithdrawable = outlets.reduce((sum, outlet) => sum + outlet.withdrawableAmount, 0);
  const totalRequested = outlets.reduce((sum, outlet) => sum + outlet.requestedAmount, 0);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-7 sm:px-6">
      <Link href="/business-admin" className="text-sm font-bold text-orange-700">← Business dashboard</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-orange-600">Outlet payouts</p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">Outlet earnings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Har outlet ka net balance dekhein aur withdrawal request Super Admin ko bhejein. Payment aur UTR Super Admin record karega.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right">
          <BalanceCard label="Outlet balance" value={totalBalance} />
          <BalanceCard label="Withdrawable" value={totalWithdrawable} />
          <BalanceCard label="Requested" value={totalRequested} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Aapka balance har paid order par Qtoo ke 2% fee aur us fee ke 18% GST ko minus karke dikhaya gaya hai. Customer bill mein extra checkout charge nahi hai. Cashfree processing fee, agar lage, merchant settlement se alag kat sakti hai.
      </div>

      {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

      {loading ? <p className="mt-8 text-sm text-gray-500">Earnings load ho rahi hain…</p> : outlets.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Abhi kisi outlet ke liye successful Cashfree payment nahi hui.</section>
      ) : (
        <div className="mt-6 space-y-4">
          {outlets.map((outlet) => (
            <section key={outlet.outletId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">{outlet.outletName}</h2>
                  <p className="mt-1 text-xs text-gray-500">{outlet.dueCount} unpaid order{outlet.dueCount === 1 ? "" : "s"} · {outlet.paidCount} paid out</p>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-right">
                  <div><p className="text-xs font-bold text-gray-500">Outlet balance · net</p><p className="text-xl font-black text-orange-700">{money(outlet.dueAmount)}</p></div>
                  <div><p className="text-xs font-bold text-gray-500">Available to request</p><p className="text-lg font-black text-slate-800">{money(outlet.withdrawableAmount)}</p></div>
                  {outlet.withdrawableAmount > 0 && <button type="button" onClick={() => void requestWithdrawal(outlet)} disabled={saving !== null} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60">{saving === outlet.outletId ? "Sending…" : `Request ${money(outlet.withdrawableAmount)}`}</button>}
                </div>
              </div>

              {outlet.requests.length > 0 && <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-900">
                <p className="font-extrabold">Withdrawal request sent</p>
                {outlet.requests.map((request) => <p key={request.id} className="mt-1">{money(request.amount)} · {new Date(request.requestedAt).toLocaleString("en-IN")} · Super Admin payment pending</p>)}
              </div>}

              {outlet.duePayments.length > 0 && <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Customer bill</th><th className="px-5 py-3 text-right">Qtoo fee 2%</th><th className="px-5 py-3 text-right">GST on fee</th><th className="px-5 py-3 text-right">Outlet net</th><th className="px-5 py-3">Payout</th></tr></thead>
                  <tbody>{outlet.duePayments.map((payment) => <tr key={payment.id} className="border-t border-gray-100"><td className="px-5 py-3 font-semibold text-gray-800">{payment.orderNumber}</td><td className="px-5 py-3 text-gray-600">{new Date(payment.createdAt).toLocaleString("en-IN")}</td><td className="px-5 py-3 text-right">{money(payment.grossAmount)}</td><td className="px-5 py-3 text-right text-orange-700">−{money(payment.commissionAmount)}</td><td className="px-5 py-3 text-right text-orange-700">−{money(payment.commissionGst)}</td><td className="px-5 py-3 text-right font-bold text-gray-900">{money(payment.amount)}</td><td className="px-5 py-3">{payment.payoutStatus === "REQUESTED" ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-800">Requested</span> : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">Available</span>}</td></tr>)}</tbody>
                </table>
              </div>}

              {outlet.paidPayments.length > 0 && <details className="border-t border-gray-100 px-5 py-4">
                <summary className="cursor-pointer text-sm font-bold text-green-800">Paid payout history ({outlet.paidCount} orders)</summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">Order</th><th className="px-3 py-2">Paid on</th><th className="px-3 py-2">UTR</th><th className="px-3 py-2 text-right">Outlet net</th></tr></thead>
                    <tbody>{outlet.paidPayments.map((payment, index) => <tr key={`${payment.orderNumber}-${index}`} className="border-t border-gray-100"><td className="px-3 py-2 font-semibold">{payment.orderNumber}</td><td className="px-3 py-2">{payment.paidAt ? new Date(payment.paidAt).toLocaleString("en-IN") : "—"}</td><td className="px-3 py-2">{payment.reference || "—"}</td><td className="px-3 py-2 text-right font-bold">{money(payment.amount)}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function BalanceCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-orange-50 px-3 py-3 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">{label}</p><p className="mt-1 text-lg font-black text-gray-900">{money(value)}</p></div>;
}
