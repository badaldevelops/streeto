import type { Metadata } from "next";
import PolicyPageShell from "../components/PolicyPageShell";

export const metadata: Metadata = {
  title: "Cancellation & Refunds | Qtoo",
  description: "What to do about a pending payment, duplicate charge, or order an outlet cannot fulfil.",
};

export default function RefundsPage() {
  return (
    <PolicyPageShell title="Cancellation & refunds" updatedAt="15 October 2026">
      <p>Qtoo orders are prepared by the outlet selected at checkout. If something goes wrong with an order or payment, contact support so we can check the order and payment status.</p>

      <section>
        <h2 className="text-lg font-black text-gray-950">Before paying again</h2>
        <p>If checkout shows “Payment pending” or returns to Qtoo after a payment attempt, open <a className="font-bold text-orange-700 underline" href="/my-orders">My Orders</a> first. Cashfree may take a little time to report the final result. Avoid repeating the payment while the first attempt is still being checked.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Cancellation and unfulfilled orders</h2>
        <p>Contact support promptly if you need to request cancellation, if the outlet says it cannot prepare a paid order, or if an order was charged more than once. Whether an order can be cancelled depends on its preparation and handover status. We will review paid orders that an outlet cannot fulfil and help resolve the payment.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Refund processing</h2>
        <p>When a refund is approved, it is sent to the original payment method where supported. The payment provider and your bank control when the credit appears; processing time can vary. Qtoo cannot promise a specific posting date. If an approved refund has not appeared after the timeframe shown by your bank or payment provider, contact support with your order number and payment reference.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">How to contact us</h2>
        <p>Email <a className="font-bold text-orange-700 underline" href="mailto:info@qtoo.com">info@qtoo.com</a>. Include your Qtoo order number, the amount, payment date, and Cashfree/payment reference if available. Never email your password, card security code, UPI PIN, or OTP.</p>
      </section>
    </PolicyPageShell>
  );
}
