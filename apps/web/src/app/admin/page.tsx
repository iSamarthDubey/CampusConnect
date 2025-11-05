"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Stats {
  users: { total: number; by_role: Record<string, number>; new_last_7_days: number };
  items: { total: number; by_status: Record<string, number>; new_last_7_days: number };
  events: { total: number; upcoming: number; new_last_7_days: number };
  feedback: { total: number; pending: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokenCount, setTokenCount] = useState(10);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(`${API_BASE}/admin/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError("Failed to load statistics");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateTokens = async () => {
    try {
      setGeneratingTokens(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/feedback/admin/tokens`,
        { count: tokenCount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTokens(response.data.tokens);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate tokens");
    } finally {
      setGeneratingTokens(false);
    }
  };

  const copyTokens = () => {
    navigator.clipboard.writeText(tokens.join("\n"));
    alert("Tokens copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.users.total || 0}</p>
            <p className="text-sm text-gray-500 mt-2">
              +{stats?.users.new_last_7_days || 0} this week
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Active Items</h3>
            <p className="text-3xl font-bold text-green-600">
              {stats?.items.by_status?.active || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {stats?.items.total || 0} total items
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Upcoming Events</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.events.upcoming || 0}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats?.events.total || 0} total events
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Feedback</h3>
            <p className="text-3xl font-bold text-orange-600">{stats?.feedback.pending || 0}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats?.feedback.total || 0} total feedback
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate Feedback Tokens */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Generate Feedback Tokens</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="number"
                min="1"
                max="100"
                value={tokenCount}
                onChange={(e) => setTokenCount(parseInt(e.target.value) || 1)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Number of tokens"
              />
              <button
                onClick={generateTokens}
                disabled={generatingTokens}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {generatingTokens ? "Generating..." : "Generate"}
              </button>
            </div>

            {tokens.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">Generated Tokens:</p>
                  <button
                    onClick={copyTokens}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy All
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-60 overflow-y-auto">
                  {tokens.map((token, idx) => (
                    <p key={idx} className="text-xs font-mono mb-1">
                      {token}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Management</h2>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage all users</p>
              </Link>
              <Link
                href="/admin/feedback"
                className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-medium text-gray-900">Review Feedback</h3>
                <p className="text-sm text-gray-600">
                  {stats?.feedback.pending || 0} pending feedback items
                </p>
              </Link>
              <Link
                href="/admin/items"
                className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-medium text-gray-900">Moderate Items</h3>
                <p className="text-sm text-gray-600">Review flagged lost & found items</p>
              </Link>
              <Link
                href="/admin/events"
                className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <h3 className="font-medium text-gray-900">Moderate Events</h3>
                <p className="text-sm text-gray-600">Review and manage events</p>
              </Link>
            </div>
          </div>
        </div>

        {/* User Role Breakdown */}
        {stats?.users.by_role && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Users by Role</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.users.by_role).map(([role, count]) => (
                <div key={role} className="text-center p-4 border border-gray-200 rounded-md">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{role}s</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

