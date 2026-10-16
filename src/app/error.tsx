"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl" aria-hidden="true">
          ⚠️
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          We couldn’t load this page
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Please close Qtoo and open it again. Your saved account and order data will still be there. Any changes that were not saved may need to be entered again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 min-h-12 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 min-h-12 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          Reload Qtoo
        </button>
      </section>
    </main>
  );
}
