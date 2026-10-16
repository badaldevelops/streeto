"use client";

import { useEffect, useState } from "react";

const ANDROID_UPI_APPS = [
  { name: "Google Pay", packageName: "com.google.android.apps.nbu.paisa.user", initials: "G", color: "bg-blue-600" },
  { name: "PhonePe", packageName: "com.phonepe.app", initials: "P", color: "bg-purple-700" },
  { name: "Paytm", packageName: "net.one97.paytm", initials: "P", color: "bg-sky-600" },
  { name: "BHIM", packageName: "in.org.npci.upiapp", initials: "B", color: "bg-orange-600" },
];

function getAndroidIntent(paymentLink: string, packageName: string) {
  try {
    const paymentUrl = new URL(paymentLink);
    if (paymentUrl.protocol !== "upi:" || paymentUrl.hostname !== "pay") return paymentLink;
    const fallback = encodeURIComponent("https://qtoo.in/my-orders");
    return `intent://pay?${paymentUrl.searchParams.toString()}#Intent;scheme=upi;package=${packageName};S.browser_fallback_url=${fallback};end`;
  } catch {
    return paymentLink;
  }
}

export default function UpiAppOptions({
  paymentLink,
  payeeId,
  compact = false,
}: {
  paymentLink: string;
  payeeId: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  async function copyPayeeId() {
    try {
      await navigator.clipboard.writeText(payeeId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={compact ? "mt-3" : "mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5"} aria-label="Choose a UPI app">
      {!compact && (
        <>
          <h3 className="text-lg font-extrabold text-gray-900">Pay with UPI</h3>
          <p className="mt-1 text-sm text-gray-600">Payment goes directly to the outlet. Choose an app on Android, or copy the UPI ID on iPhone.</p>
        </>
      )}

      {isAndroid ? (
        <div className={`grid gap-2 ${compact ? "grid-cols-1 sm:flex sm:flex-wrap" : "mt-4 grid-cols-1 sm:grid-cols-2"}`}>
          {ANDROID_UPI_APPS.map((app) => (
            <a key={app.packageName} href={getAndroidIntent(paymentLink, app.packageName)} className="flex min-h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left font-bold text-gray-800 shadow-sm transition hover:border-green-300 hover:bg-green-50">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${app.color}`} aria-hidden="true">{app.initials}</span>
              <span>{app.name}</span>
              <span className="ml-auto text-gray-400" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      ) : (
        <p className={`text-sm text-gray-600 ${compact ? "mt-2" : "mt-4"}`}>
          On iPhone or a browser that cannot launch UPI apps, copy the UPI ID below and open your payment app.
        </p>
      )}

      <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-2" : "mt-4"}`}>
        <span className="text-xs text-gray-600">UPI ID: <span className="font-semibold text-gray-800">{payeeId}</span></span>
        <button type="button" onClick={copyPayeeId} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">
          {copied ? "Copied" : "Copy UPI ID"}
        </button>
      </div>
      {!compact && (
        <p className="mt-3 text-xs leading-5 text-gray-600">On Android, choose an app that is installed and UPI-ready. On iPhone, copy the UPI ID and enter the order amount in your payment app. Check the amount and outlet name before approving payment.</p>
      )}
    </section>
  );
}
