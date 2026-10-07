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
          className="rounded-full border border-gray-300 px-2 py-2 text-[10px] font-bold text-gray-800 sm:px-4 sm:text-sm"
        >
          Login
        </a>

        <a
          href="/register"
          className="rounded-full bg-black px-2 py-2 text-[10px] font-bold text-white sm:px-4 sm:text-sm"
        >
          <span className="sm:hidden">Sign up</span>
          <span className="hidden sm:inline">Create Account</span>
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
        href="/profile"
        className="rounded-full border border-gray-300 px-1.5 py-2 text-[10px] font-bold text-gray-800 hover:bg-gray-100 sm:px-4 sm:text-sm"
      >
        Account
      </a>

      <a
        href="/my-orders"
        className="hidden rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-100 sm:inline-flex"
      >
        My Orders
      </a>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-gray-300 px-1.5 py-2 text-[10px] font-bold text-gray-800 hover:bg-gray-100 sm:px-4 sm:text-sm"
      >
        Logout
      </button>
    </div>
  );
}
