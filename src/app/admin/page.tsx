"use client";

import "./admin.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Stats = {
  todaysOrders: number;
  todaysSales: number;
  onlineOrders: number;
  offlineOrders: number;
};

type BusinessVerificationRequest = {
  id: string;
  name: string;
  foodLicenseNumber: string | null;
  foodLicenseExpiry: string | null;
  ownerAadhaarNumber: string | null;
  ownerAadhaarLast4: string | null;
  verificationSubmittedAt: string | null;
  users: Array<{ name: string; email: string; phone: string | null }>;
  outlets: Array<{ id: string; name: string; city: string | null; locality: string | null; address: string | null; phone: string | null; foodType: string }>;
};

type FoodLicenseExpiryAlert = {
  id: string;
  name: string;
  foodLicenseExpiry: string;
  isActive: boolean;
  daysRemaining: number;
};

type OutletUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
};

type Outlet = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  company: {
    id: string;
    name: string;
  };
  users: OutletUser[];
  _count: {
    orders: number;
    users: number;
  };
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState<BusinessVerificationRequest[]>([]);
  const [foodLicenseAlerts, setFoodLicenseAlerts] = useState<FoodLicenseExpiryAlert[]>([]);
  const [foodLicenseAlertsError, setFoodLicenseAlertsError] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [approvingCompanyId, setApprovingCompanyId] = useState("");
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const [deliverySettingError, setDeliverySettingError] = useState("");
  const [deliverySettingMessage, setDeliverySettingMessage] = useState("");

  const [error, setError] = useState("");
  const [outletsError, setOutletsError] = useState("");


  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = (await meResponse.json()) as {
          authenticated?: boolean;
          user?: User;
        };

        if (
          !meData.authenticated ||
          meData.user?.role !== "SUPER_ADMIN"
        ) {
          const destination = meData.user?.role === "BUSINESS_ADMIN"
            ? "https://business.qtoo.in/business-admin"
            : meData.user?.role === "DELIVERY_STAFF"
              ? "https://qtoo.in/delivery"
              : "https://qtoo.in/";
          window.location.replace(destination);
          return;
        }

        setUser(meData.user);

        const [
          statsResponse,
          outletsResponse,
          verificationResponse,
          foodLicenseAlertsResponse,
          deliverySettingResponse,
        ] = await Promise.all([
          fetch("/api/admin-stats"),
          fetch("/api/admin/outlets"),
          fetch("/api/admin/business-verifications", { cache: "no-store" }),
          fetch("/api/admin/food-license-expiry", { cache: "no-store" }),
          fetch("/api/admin/delivery-setting", { cache: "no-store" }),
        ]);

        const statsData = (await statsResponse.json()) as {
          error?: string;
          stats?: Stats;
        };

        if (!statsResponse.ok) {
          setError(
            statsData.error ||
              "Unable to load dashboard statistics."
          );
        } else if (statsData.stats) {
          setStats(statsData.stats);
        }

        if (verificationResponse.ok) {
          const verificationData = await verificationResponse.json() as { requests?: BusinessVerificationRequest[] };
          setVerificationRequests(verificationData.requests || []);
        } else {
          const data = await verificationResponse.json() as { error?: string };
          setVerificationError(data.error || "Unable to load business verification requests.");
        }

        if (foodLicenseAlertsResponse.ok) {
          const data = await foodLicenseAlertsResponse.json() as { alerts?: FoodLicenseExpiryAlert[] };
          setFoodLicenseAlerts(data.alerts || []);
        } else {
          const data = await foodLicenseAlertsResponse.json() as { error?: string };
          setFoodLicenseAlertsError(data.error || "Unable to load food licence expiry alerts.");
        }

        if (outletsResponse.ok) {
          const outletsData =
            (await outletsResponse.json()) as {
              outlets?: Outlet[];
            };

          setOutlets(outletsData.outlets || []);
        } else {
          const data = (await outletsResponse.json()) as {
            error?: string;
          };

          setOutletsError(
            data.error || "Unable to load outlets."
          );
        }

        if (deliverySettingResponse.ok) {
          const deliverySetting = await deliverySettingResponse.json() as {
            deliveryEnabled?: boolean;
          };
          setDeliveryEnabled(deliverySetting.deliveryEnabled === true);
        } else {
          setDeliverySettingError("Unable to load delivery setting.");
        }
      } catch (error) {
        console.error(error);
        setError("Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    } finally {
      router.replace("/login");
    }
  }

  async function toggleDeliveryAvailability() {
    if (updatingDelivery) return;
    setUpdatingDelivery(true);
    setDeliverySettingError("");
    setDeliverySettingMessage("");
    try {
      const response = await fetch("/api/admin/delivery-setting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryEnabled: !deliveryEnabled }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDeliverySettingError(data.error || "Unable to update delivery setting.");
        return;
      }
      setDeliveryEnabled(data.deliveryEnabled === true);
      setDeliverySettingMessage(data.deliveryEnabled
        ? "Delivery is now available to customers."
        : "Customers can choose Self Receive or Dine In at checkout.");
    } catch (error) {
      console.error("Update delivery setting failed:", error);
      setDeliverySettingError("Unable to update delivery setting.");
    } finally {
      setUpdatingDelivery(false);
    }
  }

  async function approveBusiness(request: BusinessVerificationRequest) {
    setApprovingCompanyId(request.id);
    setVerificationError("");
    setVerificationMessage("");
    try {
      const response = await fetch("/api/admin/business-verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: request.id }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setVerificationError(data.error || "Unable to approve this business.");
        return;
      }
      setVerificationRequests((current) => current.filter((item) => item.id !== request.id));
      setVerificationMessage(`${request.name} is verified and active. The full Aadhaar number has been cleared.`);
    } catch {
      setVerificationError("Unable to approve this business. Try again.");
    } finally {
      setApprovingCompanyId("");
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div className="admin-badge">
              SUPER ADMIN
            </div>

            <div className="admin-title">
              Loading dashboard...
            </div>

            <p className="admin-subtitle">
              Preparing your platform administration panel.
            </p>
          </div>

          <div className="admin-stats">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="admin-stat"
              >
                <div
                  style={{
                    height: 12,
                    width: "40%",
                    background: "#e5e7eb",
                    borderRadius: 8,
                  }}
                />

                <div
                  style={{
                    height: 36,
                    width: "55%",
                    background: "#f3f4f6",
                    borderRadius: 10,
                    marginTop: 18,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="admin-page">
      <div className="admin-container">

        {/* HEADER */}
        <section className="admin-header">
          <div className="admin-header-row">
            <div>
              <div className="admin-badge">
                SUPER ADMIN
              </div>

              <h1 className="admin-title">
                Platform Admin Dashboard
              </h1>

              <p className="admin-subtitle">
                Manage businesses, outlets and platform
                activity from one place.
              </p>

              <div className="admin-user-row">
                <div className="admin-user-box">
                  <p className="admin-user-label">
                    Admin
                  </p>

                  <p className="admin-user-value">
                    {user.name}
                  </p>
                </div>

                <div className="admin-user-box">
                  <p className="admin-user-label">
                    Email
                  </p>

                  <p className="admin-user-value">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="admin-logout"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="admin-alert admin-alert-error">
            {error}
          </div>
        )}

        {/* STATS */}
        <section className="admin-stats">
          <div className="admin-stat">
            <p className="admin-stat-label">
              Today&apos;s Orders
            </p>

            <p className="admin-stat-value">
              {stats?.todaysOrders ?? 0}
            </p>

            <p className="admin-stat-description">
              Orders placed today
            </p>
          </div>

          <div className="admin-stat">
            <p className="admin-stat-label">
              Today&apos;s Sales
            </p>

            <p className="admin-stat-value">
              ₹{stats?.todaysSales ?? 0}
            </p>

            <p className="admin-stat-description">
              Total sales today
            </p>
          </div>

          <div className="admin-stat">
            <p className="admin-stat-label">
              Online Orders
            </p>

            <p className="admin-stat-value">
              {stats?.onlineOrders ?? 0}
            </p>

            <p className="admin-stat-description">
              Online orders today
            </p>
          </div>

          <div className="admin-stat">
            <p className="admin-stat-label">
              Offline Orders
            </p>

            <p className="admin-stat-value">
              {stats?.offlineOrders ?? 0}
            </p>

            <p className="admin-stat-description">
              Counter / offline orders
            </p>
          </div>
        </section>

        <section className="admin-section" aria-labelledby="food-license-expiry-title">
          <p className="admin-section-label">Business compliance</p>
          <h2 id="food-license-expiry-title" className="admin-section-title">Food licence expiry <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 align-middle text-sm text-amber-900">{foodLicenseAlerts.length}</span></h2>
          <p className="admin-section-description">Approved businesses with a food licence that has expired or expires within 30 days.</p>
          {foodLicenseAlertsError && <div role="alert" className="admin-alert admin-alert-error">{foodLicenseAlertsError}</div>}
          {!foodLicenseAlertsError && foodLicenseAlerts.length === 0 && <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">No approved business licences are expired or expiring in the next 30 days.</p>}
          <div className="mt-4 space-y-3">
            {foodLicenseAlerts.map((alert) => {
              const expired = alert.daysRemaining < 0;
              const expiryText = expired
                ? `Expired ${Math.abs(alert.daysRemaining)} ${Math.abs(alert.daysRemaining) === 1 ? "day" : "days"} ago`
                : alert.daysRemaining === 0
                  ? "Expires today"
                  : `Expires in ${alert.daysRemaining} ${alert.daysRemaining === 1 ? "day" : "days"}`;
              return (
                <article key={alert.id} role="alert" className={`rounded-xl border p-4 ${expired ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-extrabold text-gray-950">{alert.name}{!alert.isActive && <span className="ml-2 text-xs font-bold text-gray-500">Inactive</span>}</p>
                    <p className={`text-sm font-extrabold ${expired ? "text-red-800" : "text-amber-900"}`}>{expiryText}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">Expiry date: {new Date(alert.foodLicenseExpiry).toLocaleDateString("en-IN", { timeZone: "UTC" })}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="admin-section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="admin-section-label">Platform Earnings</p>
            <h2 className="admin-section-title">Outlet commission ledger</h2>
            <p className="admin-section-description">See commission due by business and record UPI payments you have received.</p>
          </div>
          <button type="button" onClick={() => router.push("/admin/commissions")} className="admin-button">Open Commission Ledger →</button>
        </section>

        <section className="admin-section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="admin-section-label">Outlet payouts</p>
            <h2 className="admin-section-title">All outlet settlements</h2>
            <p className="admin-section-description">See each outlet’s pending amount, recorded transfers, and paid-order details.</p>
          </div>
          <button type="button" onClick={() => router.push("/admin/settlements")} className="admin-button">Open Settlements →</button>
        </section>

        <section className="admin-section">
          <p className="admin-section-label">Order Options</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="admin-section-title">Customer Delivery</h2>
              <p className="admin-section-description">
                {deliveryEnabled
                  ? "Customers can choose Delivery, Self Receive or Dine In at checkout."
                  : "Delivery is off. Customers can choose Self Receive or Dine In at checkout."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggleDeliveryAvailability()}
              disabled={updatingDelivery}
              className="admin-button"
            >
              {updatingDelivery
                ? "Saving…"
                : deliveryEnabled
                  ? "Disable Delivery"
                  : "Enable Delivery"}
            </button>
          </div>
          {deliverySettingMessage && (
            <div className="admin-alert admin-alert-success">{deliverySettingMessage}</div>
          )}
          {deliverySettingError && (
            <div className="admin-alert admin-alert-error">{deliverySettingError}</div>
          )}
        </section>

        <section className="admin-section">
          <p className="admin-section-label">Business onboarding</p>
          <h2 className="admin-section-title">Verification requests <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-1 align-middle text-sm text-orange-800">{verificationRequests.length}</span></h2>
          <p className="admin-section-description">Review the owner, outlet, food licence and Aadhaar details before activating a new business.</p>
          {verificationMessage && <div role="status" className="admin-alert admin-alert-success">{verificationMessage}</div>}
          {verificationError && <div role="alert" className="admin-alert admin-alert-error">{verificationError}</div>}
          <div className="mt-5 space-y-4">
            {verificationRequests.map((request) => {
              const owner = request.users[0];
              return (
                <article key={request.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Pending approval</p><h3 className="mt-1 text-xl font-black text-gray-950">{request.name}</h3></div>
                    <p className="text-xs font-semibold text-gray-500">Submitted {request.verificationSubmittedAt ? new Date(request.verificationSubmittedAt).toLocaleString("en-IN") : "date unavailable"}</p>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-extrabold uppercase text-gray-500">Business owner</p><p className="mt-2 font-bold text-gray-900">{owner?.name || "Name unavailable"}</p><p className="mt-1 text-sm text-gray-700">{owner?.email || "Email unavailable"}</p><p className="text-sm text-gray-700">{owner?.phone || "Phone unavailable"}</p></div>
                    <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-extrabold uppercase text-gray-500">Food licence</p><p className="mt-2 break-all font-bold text-gray-900">{request.foodLicenseNumber || "Not provided"}</p><p className="mt-1 text-sm text-gray-700">Expires: {request.foodLicenseExpiry ? new Date(request.foodLicenseExpiry).toLocaleDateString("en-IN") : "Not provided"}</p></div>
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 sm:col-span-2"><p className="text-xs font-extrabold uppercase text-red-800">Owner Aadhaar · restricted verification data</p><p className="mt-2 break-all font-mono text-lg font-bold tracking-wider text-gray-950">{request.ownerAadhaarNumber || (request.ownerAadhaarLast4 ? `Unavailable · ending ${request.ownerAadhaarLast4}` : "Unavailable")}</p>{!request.ownerAadhaarNumber && <p className="mt-1 text-xs text-red-700">The number could not be decrypted. Check the business verification encryption secret before approval.</p>}</div>
                    {request.outlets.map((outlet) => <div key={outlet.id} className="rounded-xl bg-gray-50 p-3 sm:col-span-2"><p className="text-xs font-extrabold uppercase text-gray-500">Outlet details</p><p className="mt-2 font-bold text-gray-900">{outlet.name} · {outlet.foodType}</p><p className="mt-1 text-sm text-gray-700">{[outlet.locality, outlet.city].filter(Boolean).join(", ")}</p><p className="mt-1 text-sm leading-5 text-gray-700">{outlet.address || "Address unavailable"}</p><p className="mt-1 text-sm text-gray-700">{outlet.phone || "Outlet phone unavailable"}</p></div>)}
                  </div>
                  <button type="button" onClick={() => void approveBusiness(request)} disabled={approvingCompanyId === request.id || !request.ownerAadhaarNumber} className="mt-5 min-h-11 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{approvingCompanyId === request.id ? "Approving…" : "Approve and activate business"}</button>
                </article>
              );
            })}
            {!verificationRequests.length && !verificationError && <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No business verification requests are waiting.</p>}
          </div>
        </section>

        {/* PLATFORM MANAGEMENT */}
        <section className="admin-management">
          <div className="admin-management-header">
            <p className="admin-section-label">
              Platform Management
            </p>

            <h2 className="admin-section-title">
              Manage your platform
            </h2>
          </div>

          <div className="admin-management-grid">
            {/* OUTLETS */}
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/outlets";
              }}
              className="admin-management-card"
            >
              <div className="admin-management-icon">
                📍
              </div>

              <span className="admin-count">
                {outlets.length}
              </span>

              <h2 className="admin-management-title">
                Outlets
              </h2>

              <p className="admin-management-description">
                View outlets, locations and outlet
                login accounts.
              </p>

              {outletsError && (
                <p
                  style={{
                    marginTop: 10,
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {outletsError}
                </p>
              )}

              <div className="admin-management-footer">
                <span>
                  View Outlets
                </span>

                <span>
                  →
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="admin-footer">
          Super Admin Panel
        </footer>
      </div>
    </main>
  );
}
