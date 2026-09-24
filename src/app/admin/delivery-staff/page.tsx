"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DeliveryStaffPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("Delivery Staff");
  const [email, setEmail] = useState("delivery@mrdabs.com");
  const [phone, setPhone] = useState("9999999999");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch("/api/me");
        const data = await response.json();

        if (
          !response.ok ||
          !data.authenticated ||
          data.user?.role !== "SUPER_ADMIN"
        ) {
          router.replace("/");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error(error);
        router.replace("/");
      }
    }

    checkAdmin();
  }, [router]);

  async function createDeliveryStaff(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/delivery-staff",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to create delivery staff."
        );
        return;
      }

      setMessage(
        "Delivery staff account created successfully."
      );
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
          <p>Checking admin access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to Admin
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Create Delivery Staff
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create a login account for a delivery person.
          </p>

          {message && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={createDeliveryStaff}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="text-sm font-semibold">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Phone
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                maxLength={10}
                className="mt-1 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

           <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full rounded-xl border px-4 py-3 pr-12"
    placeholder="Enter password"
    required
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
  >
    {showPassword ? "🙈" : "👁️"}
  </button>
</div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Delivery Staff"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}