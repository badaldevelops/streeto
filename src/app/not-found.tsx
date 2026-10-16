import Link from "next/link";
import QtooWordmark from "./components/QtooWordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-7 text-center shadow-xl shadow-orange-950/5 sm:p-9">
        <Link href="/" className="inline-block"><QtooWordmark /></Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-orange-600">Page not found</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Let’s get you back to good food.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">This link may be old or the page may have moved. Your saved account and cart are still available.</p>
        <Link href="/#discover" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-700">Explore outlets</Link>
        <a href="mailto:info@qtoo.com" className="mt-4 inline-block text-sm font-bold text-gray-600 hover:text-orange-700">Need help? Contact support</a>
      </section>
    </main>
  );
}
