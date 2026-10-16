import Link from "next/link";
import type { ReactNode } from "react";
import QtooWordmark from "./QtooWordmark";

export default function PolicyPageShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-5 text-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
          <Link href="/" aria-label="Qtoo home"><QtooWordmark /></Link>
          <Link href="/" className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800">← Home</Link>
        </header>
        <article className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Qtoo · Customer information</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-xs font-medium text-gray-400">Last updated: {updatedAt}</p>
          <div className="policy-copy mt-7 space-y-6 text-sm leading-7 text-gray-700">{children}</div>
          <div className="mt-8 rounded-2xl bg-orange-50 p-4 text-sm">
            <p className="font-extrabold text-gray-900">Questions or help?</p>
            <a href="mailto:info@qtoo.com" className="font-bold text-orange-700 underline underline-offset-2">info@qtoo.com</a>
          </div>
        </article>
        <nav aria-label="Policies" className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-5 text-xs font-bold text-gray-600">
          <Link href="/terms" className="hover:text-orange-700">Terms</Link>
          <Link href="/privacy" className="hover:text-orange-700">Privacy</Link>
          <Link href="/refunds" className="hover:text-orange-700">Cancellation & refunds</Link>
        </nav>
      </div>
    </main>
  );
}
