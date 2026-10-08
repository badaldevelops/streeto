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

type Company = {
  id: string;
  name: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const [deliverySettingError, setDeliverySettingError] = useState("");
  const [deliverySettingMessage, setDeliverySettingMessage] = useState("");

  const [error, setError] = useState("");
  const [outletsError, setOutletsError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessPassword, setBusinessPassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");

  const [newBusinessName, setNewBusinessName] = useState("");
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [businessMessage, setBusinessMessage] = useState("");
  const [businessError, setBusinessError] = useState("");

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
          router.replace("/");
          return;
        }

        setUser(meData.user);

        const [
          statsResponse,
          companiesResponse,
          outletsResponse,
          deliverySettingResponse,
        ] = await Promise.all([
          fetch("/api/admin-stats"),
          fetch("/api/admin/companies"),
          fetch("/api/admin/outlets"),
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

        if (companiesResponse.ok) {
          const companiesData =
            (await companiesResponse.json()) as {
              companies?: Company[];
            };

          setCompanies(companiesData.companies || []);
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
        : "Customers can now choose Self Receive only.");
    } catch (error) {
      console.error("Update delivery setting failed:", error);
      setDeliverySettingError("Unable to update delivery setting.");
    } finally {
      setUpdatingDelivery(false);
    }
  }

  async function handleCreateBusiness(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreatingBusiness(true);
    setBusinessMessage("");
    setBusinessError("");

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBusinessName,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        company?: Company;
        error?: string;
      };

      if (!response.ok) {
        setBusinessError(
          data.error || "Unable to create business."
        );
        return;
      }

      if (data.company) {
        setCompanies((current) =>
          [...current, data.company!].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );

        setSelectedCompanyId(data.company.id);
      }

      setBusinessMessage(
        "Business created successfully."
      );

      setNewBusinessName("");
    } catch (error) {
      console.error(error);

      setBusinessError(
        "Unable to create business."
      );
    } finally {
      setCreatingBusiness(false);
    }
  }

  async function handleCreateBusinessAdmin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreatingAdmin(true);
    setAdminMessage("");
    setAdminError("");

    try {
      const response = await fetch(
        "/api/admin/business-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: businessName,
            email: businessEmail,
            phone: businessPhone,
            password: businessPassword,
            companyId: selectedCompanyId,
          }),
        }
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setAdminError(
          data.error ||
            "Unable to create Business Admin."
        );
        return;
      }

      setAdminMessage(
        "Business Admin created successfully."
      );

      setBusinessName("");
      setBusinessEmail("");
      setBusinessPhone("");
      setBusinessPassword("");
      setSelectedCompanyId("");
    } catch (error) {
      console.error(error);

      setAdminError(
        "Unable to create Business Admin."
      );
    } finally {
      setCreatingAdmin(false);
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

        <section className="admin-section">
          <p className="admin-section-label">Order Options</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="admin-section-title">Customer Delivery</h2>
              <p className="admin-section-description">
                {deliveryEnabled
                  ? "Customers can choose Delivery or Self Receive at checkout."
                  : "Delivery is off. Customers can place Self Receive orders only."}
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

        {/* CREATE BUSINESS */}
        <section className="admin-section">
          <p className="admin-section-label">
            Business Management
          </p>

          <h2 className="admin-section-title">
            Create Business
          </h2>

          <p className="admin-section-description">
            Create a new business that can later have
            outlets, products and a Business Admin.
          </p>

          <form
            onSubmit={handleCreateBusiness}
            className="admin-form admin-form-business"
          >
            <div className="admin-field">
              <label htmlFor="new-business-name">
                Business Name
              </label>

              <input
                id="new-business-name"
                type="text"
                value={newBusinessName}
                onChange={(event) =>
                  setNewBusinessName(event.target.value)
                }
                placeholder="Enter business name"
                required
                className="admin-input"
              />
            </div>

            <div className="admin-submit-wrap">
              <button
                type="submit"
                disabled={creatingBusiness}
                className="admin-button"
              >
                {creatingBusiness
                  ? "Creating..."
                  : "Create Business"}
              </button>
            </div>
          </form>

          {businessMessage && (
            <div className="admin-alert admin-alert-success">
              {businessMessage}
            </div>
          )}

          {businessError && (
            <div className="admin-alert admin-alert-error">
              {businessError}
            </div>
          )}
        </section>

        {/* CREATE BUSINESS ADMIN */}
        <section className="admin-section">
          <p className="admin-section-label">
            Account Management
          </p>

          <h2 className="admin-section-title">
            Create Business Admin
          </h2>

          <p className="admin-section-description">
            Create a Business Admin account for an
            existing business.
          </p>

          <form
            onSubmit={handleCreateBusinessAdmin}
            className="admin-form admin-form-admin"
          >
            <div className="admin-field">
              <label>Name</label>

              <input
                type="text"
                value={businessName}
                onChange={(event) =>
                  setBusinessName(event.target.value)
                }
                required
                placeholder="Business Admin name"
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label>Business</label>

              <select
                value={selectedCompanyId}
                onChange={(event) =>
                  setSelectedCompanyId(event.target.value)
                }
                required
                className="admin-select"
              >
                <option value="">
                  Select business
                </option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>Email</label>

              <input
                type="email"
                value={businessEmail}
                onChange={(event) =>
                  setBusinessEmail(event.target.value)
                }
                required
                placeholder="admin@example.com"
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label>Phone</label>

              <input
                type="tel"
                value={businessPhone}
                onChange={(event) =>
                  setBusinessPhone(event.target.value)
                }
                placeholder="10 digit phone"
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label>Password</label>

              <input
                type="password"
                value={businessPassword}
                onChange={(event) =>
                  setBusinessPassword(event.target.value)
                }
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="admin-input"
              />
            </div>

            <div className="admin-submit-wrap">
              <button
                type="submit"
                disabled={creatingAdmin}
                className="admin-button"
              >
                {creatingAdmin
                  ? "Creating..."
                  : "Create Business Admin"}
              </button>
            </div>
          </form>

          {adminMessage && (
            <div className="admin-alert admin-alert-success">
              {adminMessage}
            </div>
          )}

          {adminError && (
            <div className="admin-alert admin-alert-error">
              {adminError}
            </div>
          )}
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

            {/* ORDERS */}
            <div className="admin-management-card">
              <div className="admin-management-icon">
                📦
              </div>

              <h2 className="admin-management-title">
                Orders
              </h2>

              <p className="admin-management-description">
                View and manage customer orders.
              </p>

              <div className="admin-management-footer">
                <span>
                  Admin Orders
                </span>

                <span>
                  →
                </span>
              </div>
            </div>

            {/* PRODUCTS */}
            <div className="admin-management-card">
              <div className="admin-management-icon">
                🛍️
              </div>

              <h2 className="admin-management-title">
                Products
              </h2>

              <p className="admin-management-description">
                Manage products, prices and availability.
              </p>

              <div className="admin-management-footer">
                <span>
                  Business Admin
                </span>

                <span>
                  →
                </span>
              </div>
            </div>

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
