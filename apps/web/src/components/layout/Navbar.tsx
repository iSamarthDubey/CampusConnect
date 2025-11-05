"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import NotificationBell from "../NotificationBell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const [userRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUser({ ...userRes.data, ...profileRes.data, role: userRes.data.role });
    } catch (err) {
      console.error(err);
      localStorage.removeItem("token");
      document.cookie = "token=; Path=/; Max-Age=0";
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; Path=/; Max-Age=0";
    setUser(null);
    router.push("/login");
  };

  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="text-xl font-bold text-primary">
            CampusConnect
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`${
                    isActive("/dashboard") ? "text-primary font-semibold" : "text-gray-700"
                  } hover:text-primary transition`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/items"
                  className={`${
                    pathname.startsWith("/items") ? "text-primary font-semibold" : "text-gray-700"
                  } hover:text-primary transition`}
                >
                  Lost & Found
                </Link>
                <Link
                  href="/events"
                  className={`${
                    pathname.startsWith("/events") ? "text-primary font-semibold" : "text-gray-700"
                  } hover:text-primary transition`}
                >
                  Events
                </Link>
                <Link
                  href="/timetable"
                  className={`${
                    pathname.startsWith("/timetable") ? "text-primary font-semibold" : "text-gray-700"
                  } hover:text-primary transition`}
                >
                  Timetable
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`${
                      pathname.startsWith("/admin") ? "text-primary font-semibold" : "text-gray-700"
                    } hover:text-primary transition`}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className={`${
                    pathname.startsWith("/profile") ? "text-primary font-semibold" : "text-gray-700"
                  } hover:text-primary transition`}
                >
                  Profile
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l">
                  <NotificationBell />
                  <span className="text-sm text-gray-600">{user.name || user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`${
                    isActive("/") ? "text-primary font-semibold" : "text-gray-700"
                  } hover:text-primary transition`}
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary hover:text-primary-dark font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/items"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Lost & Found
                </Link>
                <Link
                  href="/events"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Events
                </Link>
                <Link
                  href="/timetable"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Timetable
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-gray-700 hover:text-primary"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Profile
                </Link>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-2">{user.name || user.email}</p>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="text-sm text-red-600 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-primary font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-primary font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

