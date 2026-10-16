"use client";

import { useEffect, useRef, useState } from "react";

type User = {
  name: string;
  email: string;
  role: string;
};

export default function CustomerStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountOpen) return;
    function closeOutside(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

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
          const role = data.user?.role;
          if (role === "SUPER_ADMIN") {
            window.location.replace("https://admin.qtoo.in/admin");
            return;
          }
          if (role === "BUSINESS_ADMIN") {
            window.location.replace("https://business.qtoo.in/business-admin");
            return;
          }
          if (role === "DELIVERY_STAFF") {
            window.location.replace("https://qtoo.in/delivery");
            return;
          }
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
    setAccountOpen(false);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/";
    }
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

      <div className="relative" ref={accountMenuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          onClick={() => setAccountOpen((open) => !open)}
          className="rounded-full border border-gray-300 px-2.5 py-2 text-[10px] font-bold text-gray-800 hover:bg-gray-100 sm:px-4 sm:text-sm"
        >
          Account <span aria-hidden="true">⌄</span>
        </button>
        {accountOpen && (
          <div role="menu" aria-label="Account menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
            <a role="menuitem" href="/profile" onClick={() => setAccountOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-800 hover:bg-orange-50">Profile</a>
            <button role="menuitem" type="button" onClick={handleLogout} className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-gray-800 hover:bg-orange-50">Logout</button>
            <a role="menuitem" href="mailto:info@qtoo.com" className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-800 hover:bg-orange-50">
              <span className="block">Support</span>
              <span className="mt-0.5 block text-xs font-medium text-gray-500">info@qtoo.com</span>
            </a>
          </div>
        )}
      </div>

      <a
        href="/my-orders"
        className="hidden rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-100 sm:inline-flex"
      >
        My Orders
      </a>

    </div>
  );
}
