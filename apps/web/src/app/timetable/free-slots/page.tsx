"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FreeSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FreeSlotsPage() {
  const router = useRouter();
  const [userEmails, setUserEmails] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFreeSlots([]);
    setSearched(false);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Parse user emails (comma-separated)
    const emails = userEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setError("Please enter at least one user email");
      setLoading(false);
      return;
    }

    try {
      // First, fetch user IDs from emails
      const userIds: string[] = [];
      for (const email of emails) {
        // In a real app, you'd have an endpoint to search users by email
        // For now, we'll assume users provide actual UUIDs or we have a search endpoint
        // Simplified: We'll just accept the email as-is and let backend handle validation
        userIds.push(email);
      }

      const payload = {
        user_ids: userIds,
        day_of_week: selectedDay === "all" ? null : parseInt(selectedDay),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/free-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setFreeSlots(data);
        setSearched(true);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to find free slots. Make sure user IDs are valid.");
      }
    } catch (error) {
      setError("Failed to find free slots");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/timetable"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          ← Back to Timetable
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Free Slots</h1>
          <p className="text-gray-600 mb-6">
            Find common free time slots with your friends or colleagues
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User IDs (comma-separated) *
              </label>
              <input
                type="text"
                value={userEmails}
                onChange={(e) => setUserEmails(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., user-id-1, user-id-2, user-id-3"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter user IDs of people you want to find free time with (ask them for their ID)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Day (Optional)
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Days</option>
                {DAYS.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "🔍 Find Free Slots"}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Free Time Slots
              {selectedDay !== "all" && ` - ${DAYS[parseInt(selectedDay)]}`}
            </h2>

            {freeSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">😔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No common free slots found
                </h3>
                <p className="text-gray-600">
                  Try selecting a different day or checking with fewer people
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS.map((day, dayIdx) => {
                  const daySlots = freeSlots.filter((slot) => slot.day_of_week === dayIdx);
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={dayIdx} className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{day}</h3>
                      <div className="space-y-2">
                        {daySlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                          >
                            <span className="text-2xl">✅</span>
                            <div>
                              <span className="font-medium text-green-900">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <span className="ml-3 text-sm text-green-700">
                                (
                                {(() => {
                                  const [startH, startM] = slot.start_time.split(":").map(Number);
                                  const [endH, endM] = slot.end_time.split(":").map(Number);
                                  const duration = (endH * 60 + endM) - (startH * 60 + startM);
                                  const hours = Math.floor(duration / 60);
                                  const minutes = duration % 60;
                                  return `${hours}h ${minutes}m`;
                                })()}
                                )
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How to get User IDs:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Ask your friends to go to their Profile page</li>
            <li>They can copy their User ID from there</li>
            <li>Paste multiple User IDs separated by commas</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

