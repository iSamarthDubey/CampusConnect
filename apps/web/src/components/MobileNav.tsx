"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileNav() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthenticated(!!token);
  }, [pathname]);

  // Don't show mobile nav on auth pages or landing page for unauthenticated users
  if (pathname === "/login" || pathname === "/signup" || (!isAuthenticated && pathname === "/")) {
    return null;
  }

  const tabs = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard", icon: "🏠" },
        { href: "/items", label: "Items", icon: "🔍" },
        { href: "/events", label: "Events", icon: "📅" },
        { href: "/profile", label: "Profile", icon: "👤" },
      ]
    : [];

  if (tabs.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 md:hidden">
      <ul className="flex items-stretch justify-around">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col h-14 items-center justify-center text-xs ${
                  active ? "text-primary font-medium" : "text-gray-600"
                }`}
              >
                <span className="text-xl mb-1">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
