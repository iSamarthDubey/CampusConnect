"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Event {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  venue?: string;
  organizer_name?: string;
  tags?: string[];
  max_attendees?: number;
  attendee_count: number;
  is_rsvped: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "ongoing" | "past" | "all">("upcoming");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchEvents();
  }, [filter]);

  const fetchUserRole = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setUserRole(user.role);
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      // Fetch all events and filter client-side for ongoing/past
      if (filter === "upcoming") {
        params.append("upcoming", "true");
      }
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events?${params}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  
  const filteredEvents = events.filter((event) => {
    // Search filter
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Time-based filter
    const startTime = new Date(event.start_time);
    const endTime = event.end_time ? new Date(event.end_time) : null;
    
    if (filter === "upcoming") {
      return startTime > now;
    } else if (filter === "ongoing") {
      return startTime <= now && (!endTime || endTime >= now);
    } else if (filter === "past") {
      return endTime ? endTime < now : startTime < now;
    }
    
    return true; // "all"
  });

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
            Campus Events
          </h1>
          {(userRole === "faculty" || userRole === "admin") && (
            <Link
              href="/events/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
            >
              + Create Event
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === "upcoming"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter("ongoing")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === "ongoing"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === "past"
                    ? "bg-white text-gray-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  filter === "all"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600">
              {filter === "upcoming" && "There are no upcoming events at the moment."}
              {filter === "ongoing" && "There are no ongoing events right now."}
              {filter === "past" && "No past events found."}
              {filter === "all" && "Try adjusting your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
              >
                <div className="p-6">
                  {/* Event Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.is_rsvped && (
                      <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ RSVPed
                      </div>
                    )}
                    {(() => {
                      const startTime = new Date(event.start_time);
                      const endTime = event.end_time ? new Date(event.end_time) : null;
                      const now = new Date();
                      
                      if (startTime <= now && (!endTime || endTime >= now)) {
                        return (
                          <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            🔴 Live Now
                          </div>
                        );
                      } else if (endTime && endTime < now) {
                        return (
                          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            Ended
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span>{formatDateTime(event.start_time)}</span>
                    </div>

                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <span>{event.venue}</span>
                      </div>
                    )}

                    {event.organizer_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <span>By {event.organizer_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <span>
                        {event.attendee_count}
                        {event.max_attendees && ` / ${event.max_attendees}`} attending
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

