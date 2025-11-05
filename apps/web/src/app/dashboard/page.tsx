"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    name?: string;
    roll_no?: string;
    department?: string;
    avatar_url?: string;
  };
}

interface Stats {
  lostItemsCount: number;
  foundItemsCount: number;
  claimsCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ lostItemsCount: 0, foundItemsCount: 0, claimsCount: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch user (me)
        const meRes = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const userData = await meRes.json();
        setUser(userData);

        // Fetch profile to get name
        const profRes = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profRes.ok) {
          const prof = await profRes.json();
          if (prof?.name) setProfileName(prof.name);
        }

        // Fetch user's items stats
        const itemsRes = await fetch(`${API_BASE}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (itemsRes.ok) {
          const items = await itemsRes.json();
          const userItems = items.filter((item: any) => item.finder_id === userData.id);
          // Statuses are typically 'active', 'claimed', 'resolved'. Adjust as needed.
          const foundItems = userItems.filter((item: any) => item.status !== "resolved");
          const lostItems = userItems.filter((item: any) => item.status === "resolved");
          
          setStats({
            lostItemsCount: lostItems.length,
            foundItemsCount: foundItems.length,
            claimsCount: 0, // TODO: Add claims endpoint
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            {user.profile?.avatar_url ? (
              <img
                src={user.profile.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {(profileName || user.profile?.name || user.email)?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profileName || user.profile?.name || user.email}!
              </h1>
              <p className="text-gray-600">
                {user.role === "student" && user.profile?.roll_no && `Roll No: ${user.profile.roll_no}`}
                {user.profile?.department && ` • ${user.profile.department}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Lost Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lostItemsCount}</p>
              </div>
              <div className="text-4xl">🔴</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Found Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.foundItemsCount}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Claims Made</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.claimsCount}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/items"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="font-semibold text-lg text-gray-900">Browse Items</h3>
              <p className="text-sm text-gray-600 mt-1">View all lost & found items</p>
            </Link>

            <Link
              href="/items/new"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-4xl mb-2">➕</div>
              <h3 className="font-semibold text-lg text-gray-900">Report Item</h3>
              <p className="text-sm text-gray-600 mt-1">Report a lost or found item</p>
            </Link>

            <Link
              href="/events"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-4xl mb-2">📅</div>
              <h3 className="font-semibold text-lg text-gray-900">Events</h3>
              <p className="text-sm text-gray-600 mt-1">Browse campus events</p>
            </Link>

            <Link
              href="/profile"
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-4xl mb-2">👤</div>
              <h3 className="font-semibold text-lg text-gray-900">My Profile</h3>
              <p className="text-sm text-gray-600 mt-1">View and edit your profile</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-600 text-center py-8">No recent activity</p>
        </div>
      </div>
    </main>
  );
}

