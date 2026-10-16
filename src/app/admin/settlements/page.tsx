"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SettlementOrder = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  paidAt: string;
  amount: number;
  commissionGst: number;
  outletPayoutAmount: number;
  method: "ONLINE" | "UPI";
  platformCommission: number;
  payoutStatus: "PENDING" | "RECORDED_PAID";
  payoutReference: string | null;
  payoutAt: string | null;
};

type OutletSettlement = {
  outletId: string;
  outletName: string;
  businessName: string;
  businessUpiId: string | null;
  address: string | null;
  paidOrderCount: number;
  pendingCount: number;
  pendingAmount: number;
  commissionEarned: number;
  commissionGst: number;
  netEarned: number;
  paidCount: number;
  paidAmount: number;
  orders: SettlementOrder[];
};

type SettlementData = {
  summaries: OutletSettlement[];
  payoutRequests: Array<{ id: string; amount: number; requestedAt: string; paymentCount: number; outletId: string; outletName: string; businessName: string; address: string | null; phone: string | null; upiId: string | null; bankLast4: string | null; bankIfsc: string | null }>;
  totals: { pendingAmount: number; paidAmount: number; outletCount: number; paidOrderCount: number; commissionEarned: number; commissionGst: number; netEarned: number; pendingRequestCount: number };
  note: string;
};

const money = (amount: number) => `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminSettlementsPage() {
  const router = useRouter();
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [utrs, setUtrs] = useState<Record<string, string>>({});
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meResponse = await fetch("/api/me", { cache: "no-store" });
      const me = await meResponse.json();
      if (!meResponse.ok || me.user?.role !== "SUPER_ADMIN") {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/admin/settlements", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Settlement list load nahi hui.");
      setData(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Settlement list load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function markRequestPaid(request: SettlementData["payoutRequests"][number]) {
    const utr = utrs[request.id]?.trim() || "";
    if (utr.length < 4) {
      setError("Paid mark karne se pehle valid UTR enter karo.");
      return;
    }
    if (!window.confirm(`${money(request.amount)} ${request.businessName} · ${request.outletName} ko bank/UPI se transfer kar diya hai? Transfer ke baad hi Paid mark karein.`)) return;

    setSavingRequestId(request.id);
    setError("");
    setActionMessage("");
    try {
      const response = await fetch("/api/admin/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutRequestId: request.id, utr }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payout update nahi ho paya.");
      setActionMessage(`${money(result.payout.amount)} paid record ho gaya. UTR: ${result.payout.utr}`);
      setUtrs((current) => ({ ...current, [request.id]: "" }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payout update nahi ho paya.");
    } finally {
      setSavingRequestId(null);
    }
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en-IN");
    if (!normalized) return data?.summaries ?? [];
    return (data?.summaries ?? []).filter((outlet) =>
      `${outlet.outletName} ${outlet.businessName} ${outlet.address ?? ""}`.toLocaleLowerCase("en-IN").includes(normalized),
    );
  }, [data, query]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => router.push("/admin")} className="mb-5 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">← Super Admin</button>
        <header className="rounded-3xl bg-gradient-to-r from-orange-600 to-red-500 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-orange-100">Qtoo Finance · Super Admin</p>
          <h1 className="mt-2 text-3xl font-black">Outlet settlements</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-orange-50">Har outlet ka successful online order amount, pending payable aur pehle record kiye gaye transfers ek jagah dekho.</p>
        </header>

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}
        {actionMessage && <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">{actionMessage}</div>}

        {loading ? <p className="py-12 text-center font-bold text-gray-500">Outlet settlement data load ho raha hai…</p> : data && <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="Outlets" value={String(data.totals.outletCount)} />
            <SummaryCard label="Successful online orders" value={String(data.totals.paidOrderCount)} />
            <SummaryCard label="Qtoo 2% fee earned" value={money(data.totals.commissionEarned)} />
            <SummaryCard label="GST on Qtoo fee" value={money(data.totals.commissionGst)} />
            <SummaryCard label="Outlet net earnings" value={money(data.totals.netEarned)} />
            <SummaryCard label="Outlet amount pending" value={money(data.totals.pendingAmount)} highlight />
            <SummaryCard label="Withdrawal requests" value={String(data.totals.pendingRequestCount)} highlight={data.totals.pendingRequestCount > 0} />
            <SummaryCard label="Transfer recorded" value={money(data.totals.paidAmount)} />
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Hisaab ka matlab:</strong> Har paid order par Qtoo fee 2% hai aur GST us fee ka 18%; outlet net = customer bill minus fee aur GST. Customer checkout mein extra fee nahi hai. Cashfree fee merchant settlement se alag kat sakti hai. App UTR record karta hai, bank transfer khud execute nahi karta.
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4">
              <div><h2 className="text-lg font-black text-blue-950">Outlet withdrawal requests</h2><p className="mt-1 text-sm text-blue-800">Bank/UPI transfer manually bhejne ke baad UTR daal kar Paid record karein.</p></div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-blue-800">{data.payoutRequests.length} pending</span>
            </div>
            {data.payoutRequests.length === 0 ? <p className="p-5 text-sm text-gray-500">Abhi koi outlet withdrawal request nahi hai.</p> : <div className="divide-y divide-gray-100">
              {data.payoutRequests.map((request) => <article key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h3 className="font-extrabold text-gray-900">{request.businessName} · {request.outletName}</h3>
                  <p className="mt-1 text-sm text-gray-600">{money(request.amount)} · {request.paymentCount} paid order{request.paymentCount === 1 ? "" : "s"} · requested {new Date(request.requestedAt).toLocaleString("en-IN")}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">UPI: {request.upiId || "Not added"}{request.bankLast4 ? ` · Bank ending ${request.bankLast4}${request.bankIfsc ? ` · IFSC ${request.bankIfsc}` : ""}` : ""}{request.phone ? ` · Contact ${request.phone}` : ""}</p>
                  {request.address && <p className="mt-1 text-xs text-gray-500">{request.address}</p>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[360px]">
                  <input aria-label={`UTR for ${request.outletName}`} value={utrs[request.id] || ""} onChange={(event) => setUtrs((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={100} placeholder="Required UTR" className="min-h-11 flex-1 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-400" />
                  <button type="button" onClick={() => void markRequestPaid(request)} disabled={savingRequestId !== null || (utrs[request.id] || "").trim().length < 4} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-50">{savingRequestId === request.id ? "Saving…" : `Mark ${money(request.amount)} paid`}</button>
                </div>
              </article>)}
            </div>}
          </section>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input aria-label="Search outlets" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Outlet ya business search karo" className="min-h-12 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-orange-400" />
            <button onClick={() => void load()} className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700">Refresh</button>
          </div>

          <div className="mt-5 space-y-4">
            {filtered.map((outlet) => <section key={outlet.outletId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5">
                <div><h2 className="text-lg font-extrabold text-gray-900">{outlet.outletName}</h2><p className="mt-1 text-sm text-gray-600">{outlet.businessName}{outlet.address ? ` · ${outlet.address}` : ""}</p><p className="mt-1 text-xs text-gray-500">{outlet.paidOrderCount} successful order{outlet.paidOrderCount === 1 ? "" : "s"}</p></div>
                <div className="flex flex-wrap gap-5 text-right">
                  <div><p className="text-xs font-bold text-gray-500">Qtoo fee + GST</p><p className="text-lg font-black text-orange-700">{money(outlet.commissionEarned + outlet.commissionGst)}</p></div>
                  <div><p className="text-xs font-bold text-gray-500">Outlet net earned</p><p className="text-lg font-black text-gray-900">{money(outlet.netEarned)}</p></div>
                  <div><p className="text-xs font-bold text-gray-500">Pending</p><p className="text-xl font-black text-orange-700">{money(outlet.pendingAmount)}</p><p className="text-xs text-gray-500">{outlet.pendingCount} orders</p></div>
                  <div><p className="text-xs font-bold text-gray-500">Transfer recorded</p><p className="text-xl font-black text-emerald-700">{money(outlet.paidAmount)}</p><p className="text-xs text-gray-500">{outlet.paidCount} orders</p></div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-orange-50/60 px-5 py-3">
                <div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Business UPI · settlement destination</p><p className="mt-1 font-bold text-gray-900">{outlet.businessUpiId || "UPI not added by Business Admin"}</p></div>
                {outlet.businessUpiId && <button type="button" onClick={() => void navigator.clipboard.writeText(outlet.businessUpiId!)} className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-800">Copy UPI ID</button>}
              </div>
              {outlet.orders.length ? <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Order date</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Outlet payout</th><th className="px-5 py-3">UTR / note</th><th className="px-5 py-3 text-right">Customer paid</th><th className="px-5 py-3 text-right">Qtoo fee 2%</th><th className="px-5 py-3 text-right">GST 18%</th><th className="px-5 py-3 text-right">Outlet earns</th></tr></thead>
                  <tbody>{outlet.orders.map((order) => <tr key={order.paymentId} className="border-t border-gray-100"><td className="px-5 py-3 font-bold text-gray-800">{order.orderNumber}</td><td className="px-5 py-3 text-gray-600">{new Date(order.orderDate).toLocaleString("en-IN")}</td><td className="px-5 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{order.method === "UPI" ? "UPI confirmed" : "Cashfree paid"}</span></td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${order.payoutStatus === "RECORDED_PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{order.payoutStatus === "RECORDED_PAID" ? `Recorded${order.payoutAt ? ` · ${new Date(order.payoutAt).toLocaleDateString("en-IN")}` : ""}` : "Pending"}</span></td><td className="px-5 py-3 text-gray-600">{order.payoutReference || "—"}</td><td className="px-5 py-3 text-right text-gray-700">{money(order.amount)}</td><td className="px-5 py-3 text-right text-orange-700">{money(order.platformCommission)}</td><td className="px-5 py-3 text-right text-orange-700">{money(order.commissionGst)}</td><td className="px-5 py-3 text-right font-extrabold text-gray-900">{money(order.outletPayoutAmount)}</td></tr>)}</tbody>
                </table>
              </div> : <p className="p-5 text-sm text-gray-500">Is outlet ke liye abhi koi successful online payment nahi hai.</p>}
            </section>)}
            {!filtered.length && <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Search se matching outlet nahi mila.</div>}
          </div>
          <p className="mt-5 text-xs leading-5 text-gray-500">{data.note}</p>
        </>}
      </div>
    </main>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-2xl border p-5 shadow-sm ${highlight ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}><p className="text-sm font-bold text-gray-500">{label}</p><p className="mt-2 text-2xl font-black text-gray-900">{value}</p></div>;
}
