export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-[#fffaf5] px-3 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-5 w-36 rounded bg-orange-100" />
        <div className="mt-5 overflow-hidden rounded-[28px] border border-orange-100 bg-white p-5 shadow-lg sm:p-8">
          <div className="h-7 w-40 rounded bg-gray-100" />
          <div className="mt-6 h-16 rounded-2xl bg-gray-100" />
          <div className="mt-4 h-32 rounded-2xl bg-gray-100" />
          <div className="mt-4 h-12 rounded-xl bg-orange-100" />
        </div>
      </div>
    </main>
  );
}
