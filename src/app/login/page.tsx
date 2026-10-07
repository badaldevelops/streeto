"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  function redirectByRole(role: string) {
    if (role === "SUPER_ADMIN") {
      router.replace("/admin");
      return;
    }

    if (role === "BUSINESS_ADMIN") {
      router.replace("/business-admin");
      return;
    }

    if (role === "DELIVERY_STAFF") {
      router.replace("/delivery");
      return;
    }

    router.replace("/");
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
          redirectByRole(data.user.role);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Unable to login."
        );
        return;
      }

      setUser(data.user);
      setMessage(
        `Welcome, ${data.user.name}! Login successful.`
      );
      setPassword("");

      redirectByRole(data.user.role);
    } catch (error) {
      console.error(error);
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });

      setUser(null);
      setEmail("");
      setPassword("");
      setMessage("Logged out successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to logout. Please try again."
      );
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#fffaf5] px-4 text-gray-900">
        <p className="font-semibold text-gray-700">
          Checking session...
        </p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#fffaf5] px-4 py-8 text-gray-900 sm:py-10">
        <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 text-gray-900 shadow-lg shadow-orange-950/5 sm:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-950">
              MR DABS
            </h1>

            <p className="mt-2 font-medium text-gray-600">
              Redirecting to your dashboard...
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-gray-100 p-5">
            <p className="text-sm font-medium text-gray-600">
              Welcome
            </p>

            <p className="mt-1 text-xl font-bold text-gray-950">
              {user.name}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              {user.email}
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {user.phone}
            </p>
          </div>

          {message && (
            <div className="mt-5 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-800">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-xl bg-black px-4 py-4 font-semibold text-white transition hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#fffaf5] px-4 py-8 text-gray-900 sm:py-10">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-6 text-gray-900 shadow-lg shadow-orange-950/5 sm:p-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-950">
            MR DABS
          </h1>

          <p className="mt-2 font-medium text-gray-600">
            Login to your account
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-800">
              Email
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-gray-800">
              Password
            </label>

            <div className="relative">
              <input
                required
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 font-extrabold text-white shadow-md shadow-orange-200 transition hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-gray-700">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="font-bold text-orange-700 underline decoration-2 underline-offset-2 hover:text-red-700"
          >
            Create Account
          </a>
        </p>
      </div>
    </main>
  );
}
