"use client";

import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/customers", {
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
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Registration failed.");
        return;
      }

      setMessage("Account created successfully! 🎉");

      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#fffaf5] px-4 py-8 text-gray-900 sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-red-100/60 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-orange-100 bg-white p-5 text-gray-900 shadow-xl shadow-orange-950/10 sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl shadow-md shadow-orange-200" aria-hidden="true">
            🛍️
          </div>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">Customer account</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950">Create your account</h1>
          <p className="mt-2 text-sm font-medium text-gray-600">Join StreetO to order from nearby businesses.</p>
        </div>

        <form onSubmit={handleRegister} className="mt-7 space-y-4 sm:mt-8 sm:space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-800">
              Full Name
            </label>

            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-800">
              Email
            </label>

            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-800">
              Phone Number *
            </label>

            <input
              required
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel-national"
              className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
  <label className="mb-1.5 block text-sm font-bold text-gray-800">
    Password
  </label>

  <div className="relative">
    <input
      required
      type={showPassword ? "text" : "password"}
      minLength={6}
      autoComplete="new-password"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      placeholder="Minimum 6 characters"
      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
</div>

          {message && (
            <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${message.startsWith("Account created") ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 font-extrabold text-white shadow-md shadow-orange-200 transition hover:from-orange-600 hover:to-red-600 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-medium leading-5 text-gray-600">
          Your password is securely hashed before being stored.
        </p>
        <p className="mt-5 text-center text-sm font-medium text-gray-700">
          Already have an account?{" "}
          <a href="/login" className="font-bold text-orange-700 underline decoration-2 underline-offset-2 hover:text-red-700">Login</a>
        </p>
      </div>
    </main>
  );
}
