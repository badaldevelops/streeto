"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  id: string;
  name: string;
  orderCount: number;
  paidOrderCount: number;
  paidSales: number;
  commissionEarned: number;
  commissionGst: number;
  commissionCollected: number;
  commissionDue: number;
};
type Collection = { id: string; amount: number; reference: string | null; note: string | null; collectedAt: string; company: { name: string } };

export default function AdminCommissionsPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const me = await fetch("/api/me", { cache: "no-store" });
      const meData = await me.json();
      if (!me.ok || meData.user?.role !== "SUPER_ADMIN") {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/admin/commissions", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load commission ledger.");
      setSummaries(data.summaries || []);
      setCollections(data.collections || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load commission ledger.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => summaries.reduce((acc, item) => ({
    earned: acc.earned + item.commissionEarned,
    gst: acc.gst + item.commissionGst,
    collected: acc.collected + item.commissionCollected,
    due: acc.due + item.commissionDue,
    orders: acc.orders + item.orderCount,
  }), { earned: 0, gst: 0, collected: 0, due: 0, orders: 0 }), [summaries]);

  async function recordCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, amount: Number(amount), reference }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record collection.");
      setAmount("");
      setReference("");
      setMessage(data.message || "Collection recorded.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to record collection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => router.push("/admin")} className="mb-5 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">← Super Admin</button>
        <header className="rounded-3xl bg-gradient-to-r from-orange-600 to-red-500 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-orange-100">Qtoo Finance</p>
          <h1 className="mt-2 text-3xl font-black">Outlet Commission Ledger</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-50">Naye paid orders par Qtoo ka 2% fee customer ke total bill par aur us fee par 18% GST calculate hota hai. Dono outlet payout se adjust hote hain; purane orders ki saved values nahi badli gayi hain.</p>
        </header>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}
        {message && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">{message}</div>}
        {loading ? <p className="py-12 text-center font-bold text-gray-500">Loading ledger…</p> : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <LedgerCard label="Orders" value={String(totals.orders)} />
              <LedgerCard label="Qtoo fee · 2%" value={`₹${totals.earned.toFixed(2)}`} />
              <LedgerCard label="GST on fee · 18%" value={`₹${totals.gst.toFixed(2)}`} />
              <LedgerCard label="Retained / collected" value={`₹${totals.collected.toFixed(2)}`} />
              <LedgerCard label="Still due" value={`₹${totals.due.toFixed(2)}`} highlight />
            </section>

            <section className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg">
              <div className="border-b border-gray-100 p-5 sm:p-6"><h2 className="text-xl font-black text-gray-900">By business</h2><p className="mt-1 text-sm text-gray-500">Commission accrues only after the outlet confirms the customer’s payment.</p></div>
              <div className="divide-y divide-gray-100">
                {summaries.map((item) => (
                  <div key={item.id} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-7 lg:items-center">
                    <p className="font-extrabold text-gray-900">{item.name}</p>
                    <Metric label="Orders" value={`${item.orderCount}`} />
                    <Metric label="Paid sales" value={`₹${item.paidSales.toFixed(2)}`} />
                    <Metric label="Qtoo fee · 2%" value={`₹${item.commissionEarned.toFixed(2)}`} />
                    <Metric label="GST · 18%" value={`₹${item.commissionGst.toFixed(2)}`} />
                    <Metric label="Retained / collected" value={`₹${item.commissionCollected.toFixed(2)}`} />
                    <Metric label="Still due incl. GST" value={`₹${item.commissionDue.toFixed(2)}`} emphasis />
                  </div>
                ))}
                {!summaries.length && <p className="p-6 text-center text-gray-500">No businesses found.</p>}
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <form onSubmit={recordCollection} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg sm:p-6">
                <h2 className="text-xl font-black text-gray-900">Record UPI collection</h2>
                <p className="mt-1 text-sm leading-5 text-gray-500">Use this only when fee + GST was collected separately. Amounts already retained from outlet payouts are counted automatically.</p>
                <label className="mt-5 block text-sm font-bold text-gray-700">Business</label>
                <select required value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3">
                  <option value="">Choose business</option>
                  {summaries.filter((item) => item.commissionDue > 0).map((item) => <option key={item.id} value={item.id}>{item.name} · ₹{item.commissionDue.toFixed(2)} due</option>)}
                </select>
                <label className="mt-4 block text-sm font-bold text-gray-700">Amount received</label>
                <input required type="number" step="0.01" min="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" placeholder="₹0.00" />
                <label className="mt-4 block text-sm font-bold text-gray-700">UPI reference (optional)</label>
                <input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3" placeholder="Transaction reference" />
                <button disabled={saving || !companyId || !amount} className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 font-extrabold text-white disabled:opacity-50">{saving ? "Saving…" : "Record amount received"}</button>
              </form>

              <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg sm:p-6">
                <h2 className="text-xl font-black text-gray-900">Recent collections</h2>
                <div className="mt-4 space-y-3">
                  {collections.slice(0, 12).map((item) => <div key={item.id} className="rounded-xl bg-gray-50 p-4"><div className="flex justify-between gap-3"><p className="font-bold text-gray-900">{item.company.name}</p><p className="font-black text-emerald-700">₹{item.amount.toFixed(2)}</p></div><p className="mt-1 text-xs text-gray-500">{new Date(item.collectedAt).toLocaleString("en-IN")}{item.reference ? ` · UPI ref ${item.reference}` : ""}</p></div>)}
                  {!collections.length && <p className="text-sm text-gray-500">No collections recorded yet.</p>}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function LedgerCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-2xl border p-5 shadow-sm ${highlight ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}><p className="text-sm font-bold text-gray-500">{label}</p><p className="mt-2 text-2xl font-black text-gray-900">{value}</p></div>;
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className={`mt-1 font-extrabold ${emphasis ? "text-orange-700" : "text-gray-800"}`}>{value}</p></div>;
}
