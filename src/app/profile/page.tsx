"use client";


import { useEffect, useState } from "react";

type Customer = {
  name: string;
  email: string;
  phone: string;
};

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

export default function ProfilePage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);

  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressMessage, setAddressMessage] = useState("");

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  async function loadAddresses() {
    try {
      setAddressLoading(true);
      setAddressError("");

      const response = await fetch("/api/addresses", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setAddressError(
          data.error || "Unable to load addresses."
        );
        return;
      }

      setAddresses(data.addresses || []);
    } catch (error) {
      console.error(error);
      setAddressError("Unable to load saved addresses.");
    } finally {
      setAddressLoading(false);
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load profile.");
          return;
        }

        setCustomer({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
        });

        setFullName(data.user?.name || "");
        setPhone(data.user?.phone || "");
      } catch (error) {
        console.error(error);
        setError(
          "Something went wrong while loading your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
    loadAddresses();
  }, []);

  async function handleAddAddress(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSavingAddress(true);
      setAddressError("");
      setAddressMessage("");

      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          fullName,
          phone,
          addressLine,
          landmark,
          latitude,
          longitude,
          isDefault: addresses.length === 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddressError(
          data.error || "Unable to save address."
        );
        return;
      }

      setAddressMessage(
        "Address added successfully."
      );

      setAddresses((current) => [
        data.address,
        ...current.map((address) =>
          data.address.isDefault
            ? {
                ...address,
                isDefault: false,
              }
            : address
        ),
      ]);

      setLabel("Home");
      setAddressLine("");
      setLandmark("");
      setLatitude(null);
      setLongitude(null);
      setShowAddressForm(false);
    } catch (error) {
      console.error(error);
      setAddressError(
        "Something went wrong while saving the address."
      );
    } finally {
      setSavingAddress(false);
    }
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setAddressError(
        "Your browser does not support location."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAddressError("");
      },
      (error) => {
        console.error(error);

        setAddressError(
          "Unable to get your current location. Please allow location access."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

    async function handleDeleteAddress(addressId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setAddressError("");
      setAddressMessage("");

      const response = await fetch("/api/addresses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddressError(
          data.error || "Unable to delete address."
        );
        return;
      }

      setAddressMessage(
        "Address deleted successfully."
      );

      await loadAddresses();
    } catch (error) {
      console.error(error);
      setAddressError(
        "Something went wrong while deleting the address."
      );
    }
  }
  
  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setError("Unable to logout.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-gray-600">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border bg-white p-6 text-center">
            <h1 className="text-xl font-bold">
              Please login first
            </h1>

            <a
              href="/login"
              className="mt-4 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-white"
            >
              Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <a
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to Menu
          </a>

          <h1 className="mt-4 text-3xl font-bold">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your customer account
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="mt-1 text-lg font-semibold">
                {customer.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>

              <p className="mt-1 text-lg font-semibold">
                {customer.phone}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="mt-1 text-lg font-semibold">
                {customer.email || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Saved Addresses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Save your delivery addresses for faster checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddressForm((current) => !current);
                setAddressError("");
                setAddressMessage("");
              }}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              {showAddressForm
                ? "Cancel"
                : "+ Add Address"}
            </button>
          </div>

          {addressMessage && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
              {addressMessage}
            </div>
          )}

          {addressError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {addressError}
            </div>
          )}

          {showAddressForm && (
            <form
              onSubmit={handleAddAddress}
              className="mt-6 space-y-4 border-t pt-6"
            >
              <div>
                <label className="text-sm font-semibold">
                  Address Label
                </label>

                <select
                  value={label}
                  onChange={(event) =>
                    setLabel(event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Full Name
                </label>

                <input
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  required
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Phone
                </label>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  required
                  maxLength={10}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                  placeholder="10-digit phone number"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Address
                </label>

                <textarea
                  value={addressLine}
                  onChange={(event) =>
                    setAddressLine(event.target.value)
                  }
                  required
                  rows={3}
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                  placeholder="House number, street, area..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Landmark
                </label>

                <input
                  value={landmark}
                  onChange={(event) =>
                    setLandmark(event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                  placeholder="Nearby landmark (optional)"
                />
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="text-sm font-semibold">
                  Delivery Location
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Save your current GPS location with this address.
                </p>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="mt-3 rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
                >
                  📍 Use Current Location
                </button>

                {latitude !== null &&
                  longitude !== null && (
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      Location saved:{" "}
                      {latitude.toFixed(6)},{" "}
                      {longitude.toFixed(6)}
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={savingAddress}
                className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {savingAddress
                  ? "Saving Address..."
                  : "Save Address"}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-4">
            {addressLoading ? (
              <p className="text-sm text-gray-500">
                Loading saved addresses...
              </p>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-semibold">
                  No saved addresses
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add an address for faster checkout.
                </p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">
                          {address.label}
                        </h3>

                        {address.isDefault && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-semibold">
                        {address.fullName}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {address.phone}
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        {address.addressLine}
                      </p>

                      {address.landmark && (
                        <p className="mt-1 text-sm text-gray-500">
                          Landmark: {address.landmark}
                        </p>
                      )}

                      {address.latitude !== null &&
                        address.longitude !== null && (
                          <p className="mt-2 text-xs text-gray-400">
                            📍{" "}
                            {address.latitude.toFixed(6)},{" "}
                            {address.longitude.toFixed(6)}
                          </p>
                        )}
                        <button
  type="button"
  onClick={() =>
    handleDeleteAddress(address.id)
  }
  className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
>
  Delete Address
</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}