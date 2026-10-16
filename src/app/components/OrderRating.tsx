"use client";

import { useState } from "react";

export default function OrderRating({ orderId, initialStars }: { orderId: string; initialStars: number | null }) {
  const [selectedStars, setSelectedStars] = useState(initialStars ?? 0);
  const [savedStars, setSavedStars] = useState(initialStars ?? 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveRating() {
    if (selectedStars < 1 || selectedStars > 5 || selectedStars === savedStars) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/customer/outlet-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, stars: selectedStars }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Rating save nahi ho paayi.");
      setSavedStars(data.rating.stars);
      setSelectedStars(data.rating.stars);
      setMessage("Thanks for rating this outlet!");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rating save nahi ho paayi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-label="Rate outlet">
      <p className="text-sm font-extrabold text-gray-900">How was your experience?</p>
      <p className="mt-1 text-xs text-gray-600">Tap a star to rate your order. Your rating helps other customers.</p>
      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Choose 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={selectedStars === stars}
            aria-label={`${stars} ${stars === 1 ? "star" : "stars"}`}
            onClick={() => setSelectedStars(stars)}
            className="min-h-10 min-w-10 rounded-lg text-2xl transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            <span className={stars <= selectedStars ? "text-amber-500" : "text-gray-300"}>★</span>
          </button>
        ))}
        {selectedStars > 0 && <span className="ml-2 text-sm font-bold text-gray-700">{selectedStars}/5</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void saveRating()} disabled={saving || selectedStars === 0 || selectedStars === savedStars} className="min-h-10 rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? "Saving…" : savedStars ? "Update rating" : "Submit rating"}
        </button>
        {message && <p role="status" className="text-sm font-semibold text-green-700">{message}</p>}
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      </div>
    </section>
  );
}
