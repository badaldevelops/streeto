"use client";

import { useEffect, useState } from "react";

import { useCart } from "./CartProvider";
import GoogleLocationPicker from "./GoogleLocationPicker";



type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type SavedAddress = {
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

export default function Checkout() {
  const {
    items,
    cartTotal,
    cartCount,
    cartCompanyName,
    cartOutletName,
  } = useCart();
  
  

  const [orderType, setOrderType] = useState<
    "DELIVERY" | "SELF_RECEIVE"
  >("DELIVERY");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
const [street, setStreet] = useState("");
const [locality, setLocality] = useState("");
const [city, setCity] = useState("");
const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
    const [outletLocation, setOutletLocation] = useState<{
    id: string;
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    businessType: string;
    companyName: string;
  } | null>(null);

  const [loadingOutletLocation, setLoadingOutletLocation] =
    useState(false);

  const [outletLocationError, setOutletLocationError] =
    useState("");

  useEffect(() => {
    async function loadOutletLocation() {
      const outletProductId = items[0]?.productId;

      if (!outletProductId) {
        return;
      }

      setLoadingOutletLocation(true);
      setOutletLocationError("");

      try {
        const response = await fetch(
          `/api/customers/outlet-location?outletProductId=${encodeURIComponent(
            outletProductId
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          setOutletLocation(null);
          setOutletLocationError(
            data.error ||
              "Unable to load outlet location."
          );
          return;
        }

        setOutletLocation(data.outlet);
      } catch (error) {
        console.error(
          "Unable to load outlet location:",
          error
        );

        setOutletLocation(null);
        setOutletLocationError(
          "Unable to load outlet location."
        );
      } finally {
        setLoadingOutletLocation(false);
      }
    }

    loadOutletLocation();
  }, [items]);

  const [savedAddresses, setSavedAddresses] = useState<
    SavedAddress[]
  >([]);
  const [loadingAddresses, setLoadingAddresses] =
    useState(false);
  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] =
    useState(true);
  const [placingOrder, setPlacingOrder] =
    useState(false);

  useEffect(() => {
    async function loadSavedAddresses() {
      setLoadingAddresses(true);

      try {
        const response = await fetch("/api/addresses");

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const addresses = data.addresses || [];

        setSavedAddresses(addresses);

        const defaultAddress = addresses.find(
          (item: SavedAddress) => item.isDefault
        );

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setName(defaultAddress.fullName);
          setPhone(defaultAddress.phone);

          const completeAddress =
            defaultAddress.landmark
              ? `${defaultAddress.addressLine}, ${defaultAddress.landmark}`
              : defaultAddress.addressLine;

          setAddress(completeAddress);
          setLatitude(defaultAddress.latitude);
          setLongitude(defaultAddress.longitude);

          if (
            defaultAddress.latitude !== null &&
            defaultAddress.longitude !== null
          ) {
            setLocationStatus(
              `✅ Saved location selected: ${defaultAddress.latitude.toFixed(
                6
              )}, ${defaultAddress.longitude.toFixed(6)}`
            );
          }
        }
      } catch (error) {
        console.error(
          "Unable to load saved addresses:",
          error
        );
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadSavedAddresses();
  }, []);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    loadCustomer();
  }, []);

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(
        "❌ Your browser does not support location."
      );
      return;
    }

    setLocationStatus("📍 Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

        setLocationStatus(
          `✅ Location detected: ${position.coords.latitude.toFixed(
            6
          )}, ${position.coords.longitude.toFixed(6)}`
        );
      },
      (error) => {
        console.error("Location error:", error);

        setLocationStatus(
          `❌ Location error: ${error.code} - ${error.message}`
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function selectSavedAddress(savedAddress: SavedAddress) {
    setSelectedAddressId(savedAddress.id);
    setName(savedAddress.fullName);
    setPhone(savedAddress.phone);

    const completeAddress = savedAddress.landmark
      ? `${savedAddress.addressLine}, ${savedAddress.landmark}`
      : savedAddress.addressLine;

    setAddress(completeAddress);
    setLatitude(savedAddress.latitude);
    setLongitude(savedAddress.longitude);

    if (
      savedAddress.latitude !== null &&
      savedAddress.longitude !== null
    ) {
      setLocationStatus(
        `✅ Saved location selected: ${savedAddress.latitude.toFixed(
          6
        )}, ${savedAddress.longitude.toFixed(6)}`
      );
    } else {
      setLocationStatus("");
    }
  }

  async function handleCheckout() {
    if (checkingSession) {
      alert("Please wait while we check your login.");
      return;
    }

    if (placingOrder) {
      return;
    }

    if (!user) {
      alert("Please login before placing an order.");
      window.location.href = "/login";
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      alert("Phone number is required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (
  orderType === "DELIVERY" &&
  (
    !houseNumber.trim() ||
    !street.trim() ||
    !locality.trim() ||
    !city.trim() ||
    !pincode.trim()
  )
) {
  alert("Please complete your delivery address.");
  return;
}

if (orderType === "DELIVERY") {
  setAddress(
    `${houseNumber.trim()}, ${street.trim()}, ${locality.trim()}, ${city.trim()} - ${pincode.trim()}`
  );
}    

setPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          orderType,
          deliveryAddress:
            orderType === "DELIVERY" ? address : null,
          latitude:
            orderType === "DELIVERY" ? latitude : null,
          longitude:
            orderType === "DELIVERY" ? longitude : null,
          items: items.map((item) => ({
            outletProductId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to create order.");
        return;
      }

      alert(
        `Order placed successfully!\nOrder Number: ${data.order.orderNumber}`
      );
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (cartCount === 0) {
    return null;
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-red-500 px-5 py-7 text-white sm:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">
            🛒
          </div>

          <div>
            <p className="text-sm font-medium text-orange-100">
              Almost there!
            </p>

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Complete Your Order
            </h2>

            <p className="mt-1 text-sm text-orange-100">
              Fresh food, made for you ❤️
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8">

        {/* Ordering From */}
        {cartCompanyName && cartOutletName && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🏪
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Ordering From
                </p>

                <p className="mt-1 text-lg font-extrabold text-gray-900">
                  {cartCompanyName}
                </p>

                <p className="mt-1 text-sm font-medium text-gray-600">
                  📍 {cartOutletName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account */}
        <div className="mt-5">
          {checkingSession ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <span className="mr-2">⏳</span>
              Checking your account...
            </div>
          ) : user ? (
            <div className="flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                👤
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Logged in as
                </p>

                <p className="font-bold text-gray-900">
                  {user.name}
                </p>

                <p className="text-sm text-gray-600">
                  {user.phone}
                </p>
              </div>

              <div className="ml-auto text-xl">
                ✓
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="font-bold text-gray-900">
                Please login to place your order.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="mt-3 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Login to Continue
              </button>
            </div>
          )}
        </div>

        {/* Order Type */}
        <div className="mt-7">
          <div className="mb-3">
            <p className="text-lg font-extrabold text-gray-900">
              How would you like to receive it?
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Choose delivery or collect it yourself.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            <button
              type="button"
              onClick={() => setOrderType("DELIVERY")}
              className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition ${
                orderType === "DELIVERY"
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
              }`}
            >
              {orderType === "DELIVERY" && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  ✓
                </span>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                    orderType === "DELIVERY"
                      ? "bg-orange-500 text-white"
                      : "bg-orange-100"
                  }`}
                >
                  🚚
                </div>

                <div>
                  <p className="font-extrabold text-gray-900">
                    Delivery
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Get it delivered to your door
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType("SELF_RECEIVE")}
              className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition ${
                orderType === "SELF_RECEIVE"
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
              }`}
            >
              {orderType === "SELF_RECEIVE" && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  ✓
                </span>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                    orderType === "SELF_RECEIVE"
                      ? "bg-orange-500 text-white"
                      : "bg-orange-100"
                  }`}
                >
                  🏪
                </div>

                <div>
                  <p className="font-extrabold text-gray-900">
                    Self Receive
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Collect your order from outlet
                  </p>
                </div>
              </div>
            </button>

          </div>
        </div>

                {/* Self Receive Outlet Location */}
        {orderType === "SELF_RECEIVE" && (
          <div className="mt-7 overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-red-50 shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-md">
                  📍
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">
                    Pickup Location
                  </p>

                  <h3 className="mt-1 text-xl font-extrabold text-gray-900">
                    {loadingOutletLocation
                      ? "Loading outlet..."
                      : outletLocation?.name ||
                        cartOutletName ||
                        "Outlet"}
                  </h3>

                  {outletLocation?.companyName && (
                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      {outletLocation.companyName}
                    </p>
                  )}
                </div>
              </div>

              {loadingOutletLocation ? (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-4">
                  <span className="animate-spin text-xl">
                    ⏳
                  </span>

                  <p className="text-sm font-semibold text-gray-600">
                    Loading exact outlet location...
                  </p>
                </div>
              ) : outletLocationError ? (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">
                    ⚠️ {outletLocationError}
                  </p>
                </div>
              ) : outletLocation ? (
                <>
                  <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <GoogleLocationPicker
                      latitude={outletLocation.latitude}
                      longitude={outletLocation.longitude}
                      onLocationChange={() => {}}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-lg">
                        🏪
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900">
                          {outletLocation.name}
                        </p>

                        {outletLocation.address && (
                          <p className="mt-1 text-sm leading-5 text-gray-600">
                            {outletLocation.address}
                          </p>
                        )}

                        <p className="mt-2 text-xs font-semibold text-green-600">
                          ✓ Exact outlet location
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${outletLocation.latitude},${outletLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-orange-200 transition hover:from-orange-600 hover:to-red-600"
                  >
                    🗺️ Open Directions in Google Maps
                  </a>
                </>
              ) : null}
            </div>
          </div>
        )}
        
        
        {/* Customer Details */}
        <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-6">
          <div className="mb-5">
            <p className="text-lg font-extrabold text-gray-900">
              👤 Your Details
            </p>

            <p className="mt-1 text-sm text-gray-500">
              We need these details to prepare your order.
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Full Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Phone Number *
              </label>

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                🔒 Phone number is linked to your customer account.
              </p>
            </div>

          </div>
        </div>

        {/* Delivery */}
        {orderType === "DELIVERY" && (
          <div className="mt-7">

            <div className="mb-4">
              <p className="text-lg font-extrabold text-gray-900">
                📍 Delivery Details
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Choose a saved address or select your exact location.
              </p>
            </div>

            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:p-5">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-gray-900">
                      Saved Addresses
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Tap an address to use it
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    📍
                  </div>
                </div>

                {loadingAddresses ? (
                  <div className="mt-4 rounded-xl bg-white p-4 text-sm text-gray-500">
                    Loading saved addresses...
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {savedAddresses.map((savedAddress) => (
                      <button
                        key={savedAddress.id}
                        type="button"
                        onClick={() =>
                          selectSavedAddress(savedAddress)
                        }
                        className={`relative w-full rounded-2xl border-2 p-4 text-left transition ${
                          selectedAddressId === savedAddress.id
                            ? "border-orange-500 bg-white shadow-md"
                            : "border-white bg-white hover:border-orange-200"
                        }`}
                      >
                        {selectedAddressId ===
                          savedAddress.id && (
                          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                            ✓
                          </div>
                        )}

                        <div className="flex items-start gap-3 pr-8">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-lg">
                            {savedAddress.label
                              .toLowerCase()
                              .includes("home")
                              ? "🏠"
                              : "📍"}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-gray-900">
                                {savedAddress.label}
                              </span>

                              {savedAddress.isDefault && (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-green-700">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {savedAddress.fullName}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {savedAddress.phone}
                            </p>

                            <p className="mt-2 text-sm leading-5 text-gray-600">
                              {savedAddress.addressLine}
                            </p>

                            {savedAddress.landmark && (
                              <p className="mt-1 text-xs text-gray-500">
                                Near {savedAddress.landmark}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

           {/* Delivery Address */}
<div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 sm:p-5">
  <div className="mb-5">
    <p className="text-base font-extrabold text-gray-900">
      📍 Delivery Address *
    </p>

    <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
      Enter your complete address and then select your exact location on
      Google Maps.
    </p>
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    {/* House / Flat */}
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        House / Flat No. *
      </label>

      <input
        type="text"
        value={houseNumber}
        onChange={(e) => {
          setHouseNumber(e.target.value);
          setSelectedAddressId("");
        }}
        placeholder="e.g. 123, Flat 4B"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
    </div>

    {/* Street */}
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        Street / Road *
      </label>

      <input
        type="text"
        value={street}
        onChange={(e) => {
          setStreet(e.target.value);
          setSelectedAddressId("");
        }}
        placeholder="e.g. Main Road"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
    </div>

    {/* Locality */}
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        Locality / Area *
      </label>

      <input
        type="text"
        value={locality}
        onChange={(e) => {
          setLocality(e.target.value);
          setSelectedAddressId("");
        }}
        placeholder="e.g. Shastri Nagar"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
    </div>

    {/* City */}
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        City *
      </label>

      <input
        type="text"
        value={city}
        onChange={(e) => {
          setCity(e.target.value);
          setSelectedAddressId("");
        }}
        placeholder="e.g. Meerut"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
    </div>

    {/* Pincode */}
    <div className="sm:col-span-2">
      <label className="mb-2 block text-sm font-bold text-gray-800">
        Pincode *
      </label>

      <input
        type="text"
        value={pincode}
        onChange={(e) => {
          setPincode(
            e.target.value.replace(/\D/g, "").slice(0, 6)
          );
          setSelectedAddressId("");
        }}
        placeholder="6-digit pincode"
        inputMode="numeric"
        maxLength={6}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
      />
    </div>
  </div>

  {/* Google Map */}
  <div className="mt-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-extrabold text-gray-900">
          Exact Location *
        </p>

        <p className="mt-1 text-xs font-medium text-gray-500">
          Choose your exact delivery location on the map.
        </p>
      </div>

      <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-red-600">
        Required
      </span>
    </div>

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <GoogleLocationPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={(
          newLatitude,
          newLongitude
        ) => {
          setLatitude(newLatitude);
          setLongitude(newLongitude);
          setSelectedAddressId("");

          setLocationStatus(
            `✅ Location selected: ${newLatitude.toFixed(
              6
            )}, ${newLongitude.toFixed(6)}`
          );
        }}
      />
    </div>
  </div>

  {locationStatus && (
    <div
      className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
        locationStatus.startsWith("❌")
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-green-100 bg-green-50 text-green-700"
      }`}
    >
      {locationStatus}
    </div>
  )}
</div>

            {locationStatus && (
              <div
                className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  locationStatus.startsWith("❌")
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-green-100 bg-green-50 text-green-700"
                }`}
              >
                {locationStatus}
              </div>
            )}

          </div>
        )}

        {/* Payment */}
        <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              💳
            </div>

            <div>
              <p className="font-extrabold text-gray-900">
                Payment
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {orderType === "SELF_RECEIVE"
                  ? "Self Receive orders require online payment."
                  : "Online payment will be available at the final checkout step."}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-extrabold text-gray-900">
                🧾 Order Summary
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {cartCount} item
                {cartCount !== 1 ? "s" : ""} in your order
              </p>
            </div>

            <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              {orderType === "DELIVERY"
                ? "Delivery"
                : "Self Receive"}
            </div>
          </div>

          <div className="mt-5 divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {item.productName}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 font-bold text-gray-900">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-800">
                ₹{cartTotal}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Delivery
              </span>

              <span className="text-sm font-semibold text-green-600">
                {orderType === "DELIVERY"
                  ? "As applicable"
                  : "—"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-gray-200 pt-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total
              </p>

              <p className="mt-1 text-3xl font-extrabold text-gray-900">
                ₹{cartTotal}
              </p>
            </div>

            <span className="text-2xl">
              😋
            </span>
          </div>
        </div>

        {/* Place order */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkingSession || placingOrder}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 text-lg font-extrabold text-white shadow-lg shadow-orange-200 transition hover:from-orange-600 hover:to-red-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkingSession ? (
            "Checking Account..."
          ) : placingOrder ? (
            <>
              <span className="animate-spin">⏳</span>
              Placing Order...
            </>
          ) : (
            <>
              Continue to Payment
              <span>→</span>
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          🔒 Your order details are securely processed.
        </p>
      </div>
    </div>
  );
}