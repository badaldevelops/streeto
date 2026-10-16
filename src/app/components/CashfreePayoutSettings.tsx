import Link from "next/link";

export default function CashfreePayoutSettings() {
  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-xl">
      <div className="border-b border-orange-100 bg-orange-50 px-6 py-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-orange-600">Cashfree Payment Gateway</p>
        <h2 className="mt-1 text-xl font-black text-gray-900">Customer payments and outlet payouts</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Cashfree settles customer payments to the bank account approved on your Cashfree merchant account. Qtoo calculates each outlet’s net earnings and lets you request a withdrawal from Super Admin.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-8">
        <p className="max-w-2xl text-sm leading-6 text-amber-900">Cashfree says the account has an initial ₹50,000 transaction limit. Easy Split is unavailable for this entity type, so outlet withdrawals are handled manually by Super Admin after a request.</p>
        <Link href="/business-admin/payouts" className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-orange-700">Open outlet earnings</Link>
      </div>
    </section>
  );
}
