"use client";

import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
};

export default function CustomerStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

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
        }
      } catch (error) {
        console.error(error);
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    setUser(null);
    window.location.href = "/";
  }

  if (checking) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-3">
        <a
          href="/login"
          className="rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm"
        >
          Login
        </a>

        <a
          href="/register"
          className="hidden rounded-full bg-black px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
        >
          Create Account
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold">
          Welcome, {user.name}
        </p>

        <p className="text-xs text-gray-500">
          {user.email}
        </p>
      </div>

      <a
        href="/my-orders"
        className="hidden rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-100 sm:inline-flex"
      >
        My Orders
      </a>

      <button
        type="button"
        onClick={handleLogout}
        className="hidden rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-100 sm:inline-flex"
      >
        Logout
      </button>
    </div>
  );
}
