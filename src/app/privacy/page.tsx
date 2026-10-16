import type { Metadata } from "next";
import PolicyPageShell from "../components/PolicyPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | Qtoo",
  description: "How Qtoo uses account, location, order, and payment-status information.",
};

export default function PrivacyPage() {
  return (
    <PolicyPageShell title="Privacy Policy" updatedAt="15 October 2026">
      <p>This policy describes the information Qtoo uses to run accounts, find local outlets, and manage orders. Qtoo uses the information for these services and does not sell personal information for advertising.</p>

      <section>
        <h2 className="text-lg font-black text-gray-950">Information you provide</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details such as your name, email address, and phone number. Business owners also provide business and outlet details, food licence information, and owner verification information to request a Qtoo business account.</li>
          <li>Order details, selected outlet, items, instructions, order status, and support messages you send us.</li>
          <li>Saved addresses and location details you choose to provide for an order.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Business verification information</h2>
        <p>For a business account request, Qtoo collects the owner's Aadhaar number only with their confirmation and uses it only for Super Admin business-owner verification. The number is encrypted in storage and restricted to the verification queue. After approval, Qtoo deletes the full Aadhaar number and retains only its last four digits with the verification record. Food licence number and expiry, owner contact details, and the first outlet's address are provided to Super Admin reviewers so they can review the request.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Location and browser storage</h2>
        <p>If you allow location access, Qtoo uses your device location to show nearby outlets. You can instead search by city or locality. Your cart is stored in your browser on that device; clearing browser storage removes it.</p>
        <p>Qtoo uses a necessary sign-in cookie to keep your account session active. The business dashboard may also use browser notification settings when its operator enables order alerts.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Payments</h2>
        <p>Cashfree processes online checkout. Qtoo receives payment and order status information needed to confirm orders and reconcile payments. Qtoo's app does not ask you to give us your card PIN, CVV, UPI PIN, or one-time password; enter payment credentials only in the payment provider's checkout.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">How information is used and shared</h2>
        <p>We use information to sign you in, show relevant outlets, send order updates, provide customer support, prevent misuse, and maintain payment and settlement records. Order details necessary to prepare and hand over your order are shared with the selected outlet. Service providers that host the app, store its database, send transactional email, or process payments may handle information on Qtoo's behalf.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Retention and your requests</h2>
        <p>We keep account, order, and payment records for as long as needed to operate the service, resolve support and payment issues, and meet record-keeping obligations. The order list shown in the app may not include older records even when a record is retained for reconciliation.</p>
        <p>To ask for access, correction, or deletion of account information, email <a className="font-bold text-orange-700 underline" href="mailto:info@qtoo.com">info@qtoo.com</a> from your registered email and describe your request. Some transaction records may need to be retained where required for payment, settlement, or legal records.</p>
      </section>

      <section>
        <h2 className="text-lg font-black text-gray-950">Keeping information safe</h2>
        <p>We use access controls and service-provider security measures to protect information. No internet service can guarantee that transmission or storage is completely risk-free. Contact support if you believe your account has been accessed without permission.</p>
      </section>

      <p>We may update this policy as Qtoo changes. The latest version and date will appear on this page.</p>
    </PolicyPageShell>
  );
}
