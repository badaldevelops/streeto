import type { Metadata } from "next";
import PolicyPageShell from "../components/PolicyPageShell";

export const metadata: Metadata = {
  title: "Terms of Use | Qtoo",
  description: "Terms for using Qtoo to browse local food outlets and place pickup or dine-in orders.",
};

export default function TermsPage() {
  return (
    <PolicyPageShell title="Terms of Use" updatedAt="15 October 2026">
      <p>These terms explain how to use Qtoo, a platform for discovering participating food outlets and placing orders. By creating an account or placing an order, you agree to these terms.</p>

      <section>
        <h2 className="text-lg font-black text-gray-950">Using Qtoo</h2>
        <p>Give accurate account and order details, keep your sign-in information private, and use the app lawfully. You must be able to make a purchase under the laws that apply to you. We may restrict access when needed to protect customers, outlets, or the service.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Outlets and orders</h2>
        <p>Outlets manage their menus, prices, availability, preparation, and handover. The options available at checkout depend on the outlet. Review the items, quantities, pickup or dine-in choice, and final amount before paying.</p>
        <p>An order is confirmed only after the payment provider reports a successful payment to Qtoo. A pending payment screen is not a confirmed order. If an outlet cannot fulfil a paid order, contact Qtoo support with your order number.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Payments and refunds</h2>
        <p>Online payments are processed through the payment options shown at checkout. Applicable taxes and charges are shown in the order bill before you pay. See our <a className="font-bold text-orange-700 underline" href="/refunds">Cancellation & refunds policy</a> for help with failed, duplicate, or unfulfilled orders.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Availability and changes</h2>
        <p>Outlet hours, menus, and availability can change. We work to keep the service available, but access may be interrupted for maintenance, connectivity, payment-provider issues, or other events outside our control.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Contact</h2>
        <p>For help with an order or these terms, email <a className="font-bold text-orange-700 underline" href="mailto:info@qtoo.com">info@qtoo.com</a>. Include the order number when asking about a payment or order.</p>
      </section>
    </PolicyPageShell>
  );
}
